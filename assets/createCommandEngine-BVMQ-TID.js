var e=`// ② 2026-03-29-engine-handler-registry-prd.md
import type { Command, Middleware, BatchCommand, CommandHandler, CommandEngine, EngineOptions, InspectResult, KeyMapEntry, EngineEvent, CommandResult, ValidatorFn } from './types'
import { isBatchCommand } from './types'
export type { CommandEngine } from './types'
import type { NormalizedData } from '../store/types'
import type { InspectPatternInfo } from './computeNodeAriaProps'
import { computeAllNodeLabels, computeNodeAriaProps } from './computeNodeAriaProps'
import { computeStoreDiff } from '../store/computeStoreDiff'
import type { StoreDiff } from '../store/computeStoreDiff'
import type { LogEntry, Logger } from './logger'
import { defaultLogger } from './logger'

export function createCommandEngine(
  initialStore: NormalizedData,
  middlewares: Middleware[],
  registry: Map<string, CommandHandler>,
  onStoreChange: (store: NormalizedData) => void,
  options?: EngineOptions
): CommandEngine {
  let store = initialStore

  // --- subscribers ---
  const subscribers = new Set<(event: EngineEvent) => void>()
  let seq = 0

  /** Tracks the original command dispatched before middleware chain (stack for reentrant dispatch) */
  const _pendingOriginalStack: Command[] = []

  const emit = (event: EngineEvent) => {
    const snapshot = Array.from(subscribers)
    for (const listener of snapshot) {
      try {
        listener(event)
      } catch (e) {
        console.error('[engine] subscriber threw:', e)
      }
    }
  }

  const createDispatchEvent = (
    command: Command,
    prev: NormalizedData,
    next: NormalizedData,
    eventSeq: number,
    error?: string
  ): EngineEvent => {
    let cachedDiff: StoreDiff[] | undefined
    const original = _pendingOriginalStack[_pendingOriginalStack.length - 1] ?? null
    const wasTransformed = original != null && original.type !== command.type
    return {
      kind: 'dispatch' as const,
      seq: eventSeq,
      command,
      prev,
      next,
      get diff() {
        if (cachedDiff === undefined) {
          cachedDiff = error ? [] : computeStoreDiff(prev, next)
        }
        return cachedDiff
      },
      ...(error ? { error } : {}),
      ...(wasTransformed ? { originalType: original.type, originalPayload: original.payload } : {}),
    }
  }

  // --- resolve logger → internal subscriber ---
  const resolveLogger = (): Logger | null => {
    if (options?.logger === false) return null
    if (typeof options?.logger === 'function') return options.logger
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      return defaultLogger
    }
    return null
  }
  const logger = resolveLogger()
  if (logger) {
    subscribers.add((event) => {
      if (event.kind === 'unhandled-key') {
        logger(event)
        return
      }
      const entry: LogEntry = {
        seq: event.seq,
        type: event.command.type,
        payload: event.command.payload,
        diff: event.diff,
        prev: event.prev,
        next: event.next,
        ...(event.error ? { error: event.error } : {}),
        ...(event.originalType ? { originalType: event.originalType, originalPayload: event.originalPayload } : {}),
      }
      logger(entry)

      // batch children: type/payload only, no re-execution
      if (!event.error && isBatchCommand(event.command)) {
        const topParentSeq = event.seq
        const logChildren = (batch: BatchCommand) => {
          for (const child of batch.commands) {
            seq++
            logger({
              seq,
              type: child.type,
              payload: child.payload,
              diff: [],
              parent: topParentSeq,
            })
            if (isBatchCommand(child)) {
              logChildren(child as BatchCommand)
            }
          }
        }
        logChildren(event.command as BatchCommand)
      }
    })
  }

  /** Resolve a command (or batch) into the next store — pure, no closure mutation */
  const resolve = (s: NormalizedData, command: Command): NormalizedData => {
    if (isBatchCommand(command)) {
      for (const sub of (command as BatchCommand).commands) {
        s = resolve(s, sub)
      }
      return s
    }
    const handler = registry.get(command.type)
    if (!handler) {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.warn(\`[engine] No handler registered for command type "\${command.type}"\`)
      }
      return s
    }
    return handler(s, command.payload)
  }

  // ② engine-validator-clipboard-prd.md — collect validators from plugins
  const validators: ValidatorFn[] = (options?.plugins ?? [])
    .map(p => p.validator)
    .filter((v): v is ValidatorFn => v != null)

  const MUTATION_PREFIXES = ['crud:', 'dnd:', 'clipboard:paste', 'clipboard:cut', 'clipboard:duplicateAfter']
  const isMutationCommand = (cmd: Command): boolean => {
    if (cmd.meta) return false
    if (isBatchCommand(cmd)) return (cmd as BatchCommand).commands.some(c => isMutationCommand(c))
    return MUTATION_PREFIXES.some(p => cmd.type.startsWith(p))
  }

  const runValidators = (s: NormalizedData, command: Command): CommandResult | undefined => {
    if (validators.length === 0) return undefined
    if (isBatchCommand(command)) {
      for (const sub of (command as BatchCommand).commands) {
        if (isMutationCommand(sub)) {
          const rejection = runValidatorsForSingle(s, sub)
          if (rejection) return rejection
        }
      }
      return undefined
    }
    if (!isMutationCommand(command)) return undefined
    return runValidatorsForSingle(s, command)
  }

  const runValidatorsForSingle = (s: NormalizedData, command: Command): CommandResult | undefined => {
    for (const validator of validators) {
      const result = validator(s, command)
      if (result && !result.ok) return result
    }
    return undefined
  }

  let _lastResult: CommandResult = { ok: true, store: initialStore }

  let _execCount = 0
  const executor = (command: Command) => {
    _execCount++
    if (_execCount > 1000) { console.error('[engine] executor loop detected, count:', _execCount, 'cmd:', command.type); _execCount = 0; return }

    // ② engine-validator-clipboard-prd.md — validator check
    const rejection = runValidators(store, command)
    if (rejection && !rejection.ok) {
      _lastResult = rejection
      seq++
      if (subscribers.size > 0) {
        emit(createDispatchEvent(command, store, store, seq, rejection.reason))
      }
      return
    }

    const prev = store
    try {
      store = resolve(prev, command)
    } catch (error) {
      store = prev
      seq++
      if (subscribers.size > 0) {
        emit(createDispatchEvent(command, prev, prev, seq, error instanceof Error ? error.message : String(error)))
      }
      _lastResult = { ok: false, reason: error instanceof Error ? error.message : String(error) }
      return
    }
    seq++
    if (subscribers.size > 0) {
      emit(createDispatchEvent(command, prev, store, seq))
    }
    if (store !== prev) {
      onStoreChange(store)
    }
    _lastResult = { ok: true, store }
  }

  const getStore = () => store

  const chain = middlewares.reduceRight<(command: Command) => void>(
    (next, mw) => mw(next, getStore),
    executor
  )

  let inspectKeyMap: Record<string, KeyMapEntry> = options?.keyMap ?? {}
  let inspectRole: string | undefined
  let inspectChildRole: string | undefined
  let inspectPatternInfo: InspectPatternInfo | undefined

  const inspect = (): InspectResult => {
    const pluginList = options?.plugins ?? []
    const extras: Record<string, Record<string, unknown>> = {}
    for (const p of pluginList) {
      if (p.name && p.inspect) {
        try {
          extras[p.name] = p.inspect()
        } catch (e) {
          extras[p.name] = { error: e instanceof Error ? e.message : String(e) }
        }
      }
    }
    return {
      commands: [...registry.keys()],
      keyMap: inspectKeyMap,
      plugins: pluginList.map((p) => p.name ?? 'anonymous'),
      state: store,
      extras,
      role: inspectRole,
      childRole: inspectChildRole,
      ...(inspectPatternInfo && {
        nodeProps: computeAllNodeLabels(store, inspectPatternInfo),
        computeNodeProps: (nodeId: string) => computeNodeAriaProps(nodeId, store, inspectPatternInfo!),
      }),
    }
  }

  return {
    dispatch: (command) => {
      _pendingOriginalStack.push(command)
      _execCount = 0
      chain(command)
      _pendingOriginalStack.pop()
      return _lastResult
    },
    getStore,
    syncStore: (newStore: NormalizedData) => {
      store = newStore
    },
    inspect,
    setInspectKeyMap: (desc: Record<string, import('./types').KeyMapEntry>) => { inspectKeyMap = desc },
    setInspectRole: (role: string, childRole?: string) => { inspectRole = role; inspectChildRole = childRole },
    setInspectPattern: (info: InspectPatternInfo) => { inspectPatternInfo = info },
    subscribe: (listener: (event: EngineEvent) => void) => {
      subscribers.add(listener)
      return () => { subscribers.delete(listener) }
    },
    emitUnhandledKey: (event: KeyboardEvent) => {
      if (subscribers.size === 0) return
      seq++
      const mods: string[] = []
      if (event.ctrlKey) mods.push('Ctrl+')
      if (event.altKey) mods.push('Alt+')
      if (event.shiftKey) mods.push('Shift+')
      if (event.metaKey) mods.push('Meta+')
      emit({
        kind: 'unhandled-key',
        seq,
        key: event.key,
        code: event.code,
        modifiers: mods.join(''),
      })
    },
  }
}
`;export{e as default};