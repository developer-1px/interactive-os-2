// ② 2026-03-29-engine-handler-registry-prd.md
import type { Command, Middleware, BatchCommand, CommandHandler, CommandEngine, EngineOptions, InspectResult, KeyMapEntry, EngineEvent } from './types'
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
      const entry: LogEntry = {
        seq: event.seq,
        type: event.command.type,
        payload: event.command.payload,
        diff: event.diff,
        ...(event.error ? { error: event.error } : {}),
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
        console.warn(`[engine] No handler registered for command type "${command.type}"`)
      }
      return s
    }
    return handler(s, command.payload)
  }

  let _execCount = 0
  const executor = (command: Command) => {
    _execCount++
    if (_execCount > 1000) { console.error('[engine] executor loop detected, count:', _execCount, 'cmd:', command.type); return }
    const prev = store
    try {
      store = resolve(prev, command)
    } catch (error) {
      store = prev
      seq++
      if (subscribers.size > 0) {
        emit(createDispatchEvent(command, prev, prev, seq, error instanceof Error ? error.message : String(error)))
      }
      return
    }
    seq++
    if (subscribers.size > 0) {
      emit(createDispatchEvent(command, prev, store, seq))
    }
    if (store !== prev) {
      onStoreChange(store)
    }
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
    dispatch: (command) => chain(command),
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
  }
}
