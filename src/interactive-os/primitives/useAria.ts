import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { Command, EffectContext, EngineOptions, InspectResult } from '../engine/types'
import { buildRegistry } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { AriaPattern, NodeState, PatternContext } from '../pattern/types'
import { createCommandEngine } from '../engine/createCommandEngine'
import type { CommandEngine } from '../engine/createCommandEngine'
import { getChildren } from '../store/createStore'
import { coreRegistry } from '../axis/coreCommands'
import { focusCommands, FOCUS_ID, GRID_COL_ID } from '../axis/navigate'
import { SELECTION_ID, SELECTION_ANCHOR_ID } from '../axis/select'
import { EXPANDED_ID } from '../axis/expand'
import { CHECKED_ID } from '../axis/checked'
import { POPUP_ID } from '../axis/popup'
import { VALUE_ID } from '../axis/value'
import { RENAME_ID } from '../plugins/rename'
import { ERRORS_ID, TOUCHED_ID } from '../plugins/form'
import { createPatternContext } from '../pattern/createPatternContext'
import type { PatternContextOptions } from '../pattern/createPatternContext'
import { useAriaView } from './useAriaView'
import { dispatchKeyAction } from './keymapHelpers'
import { registerAria, unregisterAria } from './ariaRegistry'
import { registerBinding, unregisterBindings, getAllBindings } from './bindingRegistry'

type EngineCallbacks = { onActivate: UseAriaOptions['onActivate']; onFocusChange: UseAriaOptions['onFocusChange']; pattern: AriaPattern; prevFocus: string; prevSelectedIds: string[] }
const engineCallbacksMap = new WeakMap<CommandEngine, EngineCallbacks>()

/** Known internal meta-entity IDs — only these are preserved during external sync */
const META_ENTITY_IDS = new Set([FOCUS_ID, SELECTION_ID, SELECTION_ANCHOR_ID, EXPANDED_ID, CHECKED_ID, GRID_COL_ID, RENAME_ID, '__combobox__', '__spatial_parent__', VALUE_ID, '__search__', POPUP_ID, ERRORS_ID, TOUCHED_ID])

const EMPTY_BEHAVIOR: AriaPattern = {
  role: '',
  focusStrategy: { type: 'natural-tab-order', orientation: 'vertical' },
  ariaAttributes: () => ({}),
  keyMap: {},
}

export interface UseAriaOptions {
  pattern?: AriaPattern
  data: NormalizedData
  plugins?: Plugin[]
  keyMap?: Record<string, (ctx: ReturnType<typeof createPatternContext>) => Command | void>
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  onFocusChange?: (nodeId: string | null) => void
  /** Focus this node on mount instead of the first child */
  initialFocus?: string
  /** Logger for engine dispatch events */
  logger?: EngineOptions['logger']
  /** Whether to auto-focus the first item on mount (default: true) */
  autoFocus?: boolean
  /** When true, the zone is fully inert — no focus, no events, no ARIA */
  disabled?: boolean
  /** Registry key for inspector — auto-registers when provided */
  'aria-label'?: string
  /** Explicit registry id (takes precedence over aria-label) */
  id?: string
}

export interface UseAriaReturn {
  dispatch(command: Command): void
  getNodeProps(id: string): Record<string, unknown>
  getNodeState(id: string): NodeState
  focused: string
  selected: string[]
  getStore(): NormalizedData
  inspect(): InspectResult
  containerProps: Record<string, unknown>
  // ② 2026-03-28-aria-panel-trigger-prd.md
  getPatternContext?(): PatternContext
}

export function useAria(options: UseAriaOptions): UseAriaReturn {
  const { pattern = EMPTY_BEHAVIOR, data, plugins = [], keyMap: keyMapOverrides, onChange, onActivate, onFocusChange, initialFocus, logger, autoFocus = true, disabled = false, 'aria-label': ariaLabel, id: ariaId } = options
  const [, forceRender] = useState(0)
  const pointerDownCtxRef = useRef<ReturnType<typeof createPatternContext> | null>(null)
  const suppressFocusDispatchRef = useRef(false)

  // ── ① Engine creation (useAria-only) ──
  // Mutable callbacks bag lives inside the engine wrapper so the useState
  // initializer owns it without capturing any React ref.

  const [engine] = useState(() => {
    const bag: EngineCallbacks = { onActivate, onFocusChange, pattern, prevFocus: '', prevSelectedIds: [] }

    const middlewares = [
      pattern.middleware,
      ...plugins.map((p) => p.middleware),
    ].filter((m): m is NonNullable<typeof m> => m != null)

    // Build handler registry from core axes + plugins
    const pluginCommands = plugins
      .map((p) => p.commands)
      .filter((c): c is NonNullable<typeof c> => c != null)
    const registry = buildRegistry(...pluginCommands)
    for (const [type, handler] of coreRegistry) registry.set(type, handler)

    let _onChangeCount = 0
    let initializing = true
    const created = createCommandEngine(data, middlewares, registry, (newStore) => {
      if (initializing) return
      _onChangeCount++
      if (_onChangeCount > 500) { console.error('[useAria] onStoreChange loop detected, count:', _onChangeCount); return }
      const cb = engineCallbacksMap.get(created)!
      const newFocusedId = (newStore.entities['__focus__']?.focusedId as string) ?? ''
      // activationFollowsSelection: selection change → onActivate
      if (cb.pattern.activationFollowsSelection && cb.onActivate) {
        const newSelArr = (newStore.entities[SELECTION_ID]?.selectedIds as string[]) ?? []
        if (newSelArr.length > 0 && newSelArr !== cb.prevSelectedIds) {
          cb.onActivate(newSelArr[newSelArr.length - 1]!)
        }
        cb.prevSelectedIds = newSelArr
      }
      if (newFocusedId !== cb.prevFocus && cb.onFocusChange) {
        cb.onFocusChange(newFocusedId || null)
      }
      cb.prevFocus = newFocusedId
      onChange?.(newStore)
      forceRender((n) => n + 1)
    }, logger != null ? { logger } : undefined)

    engineCallbacksMap.set(created, bag)

    // Initialize required entities declared by axes (expand, checked, popup, etc.)
    if (pattern.requiredEntities) {
      const currentEntities = created.getStore().entities
      let merged: typeof currentEntities | undefined
      for (const decl of pattern.requiredEntities) {
        if (!currentEntities[decl.id]) {
          if (!merged) merged = { ...currentEntities }
          merged[decl.id] = { id: decl.id, ...decl.default }
        }
      }
      if (merged) {
        const currentStore = created.getStore()
        created.syncStore({ entities: merged, relationships: currentStore.relationships, slots: currentStore.slots })
      }
    }
    const externalFocus = (data.entities[FOCUS_ID]?.focusedId as string) ?? ''
    const focusTarget = (externalFocus && data.entities[externalFocus])
      ? externalFocus
      : (initialFocus && data.entities[initialFocus])
        ? initialFocus
        : getChildren(data, ROOT_ID)[0]
    if (focusTarget) {
      bag.prevFocus = focusTarget
      created.dispatch(focusCommands.setFocus(focusTarget))
    }
    initializing = false
    // Initialize prevSelectedIds to post-init state so mount doesn't trigger onActivate
    bag.prevSelectedIds = (created.getStore().entities[SELECTION_ID]?.selectedIds as string[]) ?? []
    return created
  })
  useEffect(() => {
    const cb = engineCallbacksMap.get(engine)
    if (!cb) return
    cb.onActivate = onActivate
    cb.onFocusChange = onFocusChange
    cb.pattern = pattern
  })

  // ── ② External data sync (useAria-only) ──

  useMemo(() => {
    // @ts-expect-error debug counter
    engine.__syncCount = (engine.__syncCount ?? 0) + 1
    // @ts-expect-error debug counter
    const _tag = `[useAria:${pattern.role || 'none'}] #${engine.__syncCount}`
    const _entityCount = Object.keys(data.entities).filter(k => !META_ENTITY_IDS.has(k)).length
    // @ts-expect-error debug counter
    if (engine.__syncCount > 500) { console.error(_tag, 'LOOP — entities:', _entityCount, 'data ref changed:', data !== engine.__prevData); return }
    // @ts-expect-error debug counter
    if (engine.__syncCount > 1) { console.warn(_tag, 'entities:', _entityCount, 'data ref changed:', data !== engine.__prevData) }
    // @ts-expect-error debug counter
    engine.__prevData = data
    const currentStore = engine.getStore()
    const externalFocusChanged = FOCUS_ID in data.entities &&
      (data.entities[FOCUS_ID]?.focusedId as string) !== (currentStore.entities[FOCUS_ID]?.focusedId as string)
    const contentChanged = externalFocusChanged ||
      data.relationships !== currentStore.relationships ||
      Object.keys(data.entities).some(key => !META_ENTITY_IDS.has(key) && data.entities[key] !== currentStore.entities[key]) ||
      Object.keys(currentStore.entities).some(key => !META_ENTITY_IDS.has(key) && !(key in data.entities))
    if (!contentChanged) return

    const mergedEntities = { ...data.entities }
    for (const [key, value] of Object.entries(currentStore.entities)) {
      if (META_ENTITY_IDS.has(key)) {
        if (key === FOCUS_ID && FOCUS_ID in data.entities) continue
        if (key === EXPANDED_ID && EXPANDED_ID in data.entities) continue
        mergedEntities[key] = value
      }
    }

    const focusMeta = mergedEntities[FOCUS_ID] as { focusedId?: string } | undefined
    if (focusMeta?.focusedId && !(focusMeta.focusedId in data.entities)) {
      const allChildren = data.relationships[ROOT_ID] ?? []
      const fallback = allChildren[0] ?? ''
      mergedEntities[FOCUS_ID] = { id: FOCUS_ID, ...focusMeta, focusedId: fallback }
    }

    // selectionFollowsFocus: external focus change → auto-sync selection
    // syncStore bypasses middleware, so we replicate the middleware effect here
    if (externalFocusChanged && pattern.selectionFollowsFocus) {
      const newFocusedId = (mergedEntities[FOCUS_ID] as { focusedId?: string })?.focusedId
      if (newFocusedId) {
        mergedEntities[SELECTION_ID] = { id: SELECTION_ID, selectedIds: [newFocusedId] }
      }
    }

    const selectionMeta = mergedEntities[SELECTION_ID] as { selectedIds?: string[] } | undefined
    if (selectionMeta?.selectedIds) {
      const cleaned = selectionMeta.selectedIds.filter(id => id in data.entities)
      if (cleaned.length !== selectionMeta.selectedIds.length) {
        mergedEntities[SELECTION_ID] = { id: SELECTION_ID, ...selectionMeta, selectedIds: cleaned }
      }
    }

    engine.syncStore({ entities: mergedEntities, relationships: data.relationships, slots: data.slots })
  }, [data, engine])

  // ── State derivation ──

  const store = engine.getStore()
  const focusedId = (store.entities['__focus__']?.focusedId as string) ?? ''
  const selectedIdSet = useMemo(() => {
    const ids = (store.entities['__selection__']?.selectedIds as string[]) ?? []
    return new Set(ids)
  }, [store])
  const selectedIds = useMemo(() => Array.from(selectedIdSet), [selectedIdSet])
  const isKeyMapOnly = pattern === EMPTY_BEHAVIOR

  // ── ③④⑤⑥⑦ Shared view logic ──

  const view = useAriaView({
    engine, store, pattern, plugins, keyMap: keyMapOverrides,
    onActivate, focusedId, selectedIdSet,
    isKeyMapOnly, autoFocus, disabled,
  })

  // ── Pointer selection overlay (useAria-only) ──

  const { patternCtxOptions, observedEngine } = view

  const getNodeProps = useCallback(
    (id: string): Record<string, unknown> => {
      const baseProps = view.getNodeProps(id)
      if (isKeyMapOnly) return baseProps

      // Declarative clickMap path — pattern owns pointer bindings
      if (pattern.clickMap) {
        const clickMap = pattern.clickMap
        const originalOnFocus = baseProps.onFocus as ((event: FocusEvent) => void) | undefined

        baseProps.onPointerDown = () => {
          // Suppress onFocus standalone dispatch during click when selectionFollowsFocus
          // is active — the click handler manages focus via batch (selectAndAnchor).
          // Without this, onFocus fires before onClick and the followFocus middleware
          // auto-selects, corrupting Mod+Click toggle and Shift+Click extend.
          // Microtask resets the flag so Tab-initiated focus dispatches normally.
          if (pattern.selectionFollowsFocus) {
            suppressFocusDispatchRef.current = true
            queueMicrotask(() => { suppressFocusDispatchRef.current = false })
          }
          pointerDownCtxRef.current = createPatternContext(observedEngine, patternCtxOptions as PatternContextOptions)
        }

        baseProps.onFocus = (event: FocusEvent) => {
          if (suppressFocusDispatchRef.current) return
          originalOnFocus?.(event)
        }

        baseProps.onClick = (event: MouseEvent) => {
          if (event.defaultPrevented) return
          const target = event.target as HTMLElement
          const closestItem = target.closest(`[data-node-id]`)
          if (closestItem && closestItem !== (event.currentTarget as HTMLElement)) return

          let key: string
          if (event.shiftKey) key = 'Shift+Click'
          else if (event.ctrlKey || event.metaKey) key = 'Mod+Click'
          else if (event.altKey) key = 'Alt+Click'
          else key = 'Click'

          const handler = clickMap[key]
          if (handler) {
            const baseCtx = (key === 'Shift+Click' && pointerDownCtxRef.current)
              ? pointerDownCtxRef.current
              : createPatternContext(observedEngine, { ...patternCtxOptions as PatternContextOptions, overrideFocused: id })
            const ctx = baseCtx.focused === id ? baseCtx : { ...baseCtx, focused: id }
            dispatchKeyAction(ctx, handler as (c: typeof ctx) => Command | void, observedEngine)
          }
          pointerDownCtxRef.current = null
        }

        return baseProps
      }

      return baseProps
    },
    [view, isKeyMapOnly, pattern.clickMap, observedEngine, patternCtxOptions],
  )

  const dispatch = useCallback(
    (command: Command) => observedEngine.dispatch(command),
    [observedEngine]
  )

  // ── Plugin effects ──
  const containerRef = useRef<HTMLElement | null>(null)
  const effectCtx: EffectContext = useMemo(
    () => ({ containerRef, getStore: () => engine.getStore() }),
    [engine],
  )
  for (const plugin of plugins) {
    plugin.useEffect?.(effectCtx)
  }

  const containerProps = useMemo(
    () => ({ ...view.containerProps, ref: containerRef }),
    [view.containerProps],
  )

  // Auto-register in inspector registry + binding registry
  const registryKey = ariaId ?? ariaLabel
  useEffect(() => {
    if (!registryKey) return
    registerAria(registryKey, { dispatch, getStore: () => engine.getStore(), inspect: () => {
      const base = engine.inspect()
      if (import.meta.env.DEV) {
        return { ...base, bindings: getAllBindings().filter(b => b.nodeId === null || b.nodeId === registryKey) }
      }
      return base
    } })

    if (import.meta.env.DEV) {
      for (const map of [pattern.keyMap, pattern.clickMap]) {
        if (!map) continue
        for (const [input, handler] of Object.entries(map)) {
          for (const cmd of handler.commands) {
            registerBinding({ command: cmd, nodeId: registryKey, input })
          }
        }
      }
    }

    return () => {
      unregisterAria(registryKey)
      if (import.meta.env.DEV) unregisterBindings(registryKey)
    }
  }, [registryKey, dispatch, engine, pattern.keyMap, pattern.clickMap])

  return {
    dispatch,
    getNodeProps,
    getNodeState: view.getNodeState,
    focused: focusedId,
    selected: selectedIds,
    getStore: () => engine.getStore(),
    inspect: () => engine.inspect(),
    containerProps,
    // ② 2026-03-28-aria-panel-trigger-prd.md
    getPatternContext: () => createPatternContext(engine, patternCtxOptions as PatternContextOptions),
  }
}
