import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { EngineOptions } from '../engine/dispatchLogger'
import type { Command } from '../engine/types'
import { createBatchCommand } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { AriaPattern, NodeState } from '../pattern/types'
import { createCommandEngine } from '../engine/createCommandEngine'
import type { CommandEngine } from '../engine/createCommandEngine'
import { getChildren, getEntityData } from '../store/createStore'
import { focusCommands, FOCUS_ID, GRID_COL_ID } from '../axis/navigate'
import { selectionCommands, SELECTION_ID, SELECTION_ANCHOR_ID } from '../axis/select'
import { expandCommands, EXPANDED_ID } from '../axis/expand'
import { VALUE_ID } from '../axis/value'
import { RENAME_ID } from '../plugins/rename'
import { createPatternContext } from '../pattern/createPatternContext'
import type { PatternContextOptions } from '../pattern/createPatternContext'
import { useAriaView } from './useAriaView'

type EngineCallbacks = { onActivate: UseAriaOptions['onActivate']; behavior: AriaPattern; prevFocus: string }
const engineCallbacksMap = new WeakMap<CommandEngine, EngineCallbacks>()

/** Known internal meta-entity IDs — only these are preserved during external sync */
const META_ENTITY_IDS = new Set([FOCUS_ID, SELECTION_ID, SELECTION_ANCHOR_ID, EXPANDED_ID, GRID_COL_ID, RENAME_ID, '__combobox__', '__spatial_parent__', VALUE_ID, '__search__'])

const EMPTY_BEHAVIOR: AriaPattern = {
  role: '',
  focusStrategy: { type: 'natural-tab-order', orientation: 'vertical' },
  ariaAttributes: () => ({}),
  keyMap: {},
}

export interface UseAriaOptions {
  behavior?: AriaPattern
  data: NormalizedData
  plugins?: Plugin[]
  keyMap?: Record<string, (ctx: ReturnType<typeof createPatternContext>) => Command | void>
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  /** Focus this node on mount instead of the first child */
  initialFocus?: string
  /** Logger for engine dispatch events */
  logger?: EngineOptions['logger']
  /** Whether to auto-focus the first item on mount (default: true) */
  autoFocus?: boolean
  /** When true, the zone is fully inert — no focus, no events, no ARIA */
  disabled?: boolean
}

export interface UseAriaReturn {
  dispatch(command: Command): void
  getNodeProps(id: string): Record<string, unknown>
  getNodeState(id: string): NodeState
  focused: string
  selected: string[]
  getStore(): NormalizedData
  containerProps: Record<string, unknown>
}

export function useAria(options: UseAriaOptions): UseAriaReturn {
  const { behavior = EMPTY_BEHAVIOR, data, plugins = [], keyMap: keyMapOverrides, onChange, onActivate, initialFocus, logger, autoFocus = true, disabled = false } = options
  const [, forceRender] = useState(0)
  const pointerDownCtxRef = useRef<ReturnType<typeof createPatternContext> | null>(null)

  // ── ① Engine creation (useAria-only) ──
  // Mutable callbacks bag lives inside the engine wrapper so the useState
  // initializer owns it without capturing any React ref.

  const [engine] = useState(() => {
    const bag: EngineCallbacks = { onActivate, behavior, prevFocus: '' }

    const middlewares = [
      behavior.middleware,
      ...plugins.map((p) => p.middleware),
    ].filter((m): m is NonNullable<typeof m> => m != null)

    let initializing = true
    const created = createCommandEngine(data, middlewares, (newStore) => {
      if (initializing) return
      const cb = engineCallbacksMap.get(created)!
      const newFocusedId = (newStore.entities['__focus__']?.focusedId as string) ?? ''
      if (cb.behavior.followFocus && cb.onActivate && newFocusedId && newFocusedId !== cb.prevFocus) {
        const entityData = getEntityData<{ followFocus?: boolean }>(newStore, newFocusedId)
        if (entityData?.followFocus !== false) {
          cb.onActivate(newFocusedId)
        }
      }
      cb.prevFocus = newFocusedId
      onChange?.(newStore)
      forceRender((n) => n + 1)
    }, logger != null ? { logger } : undefined)

    engineCallbacksMap.set(created, bag)

    // If pattern uses expand axis (expandTracking), ensure __expanded__ entity exists
    // so getVisibleNodes activates gating (default-collapsed for tree/accordion).
    // Patterns without expand axis leave the entity absent → all children visible.
    if ((behavior.expandTracking || behavior.expandable) && !data.entities[EXPANDED_ID]) {
      created.syncStore({
        entities: { ...created.getStore().entities, [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: [] } },
        relationships: created.getStore().relationships,
      })
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
    return created
  })
  useEffect(() => {
    const cb = engineCallbacksMap.get(engine)!
    cb.onActivate = onActivate
    cb.behavior = behavior
  })

  // ── ② External data sync (useAria-only) ──

  useMemo(() => {
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
        mergedEntities[key] = value
      }
    }

    const focusMeta = mergedEntities[FOCUS_ID] as { focusedId?: string } | undefined
    if (focusMeta?.focusedId && !(focusMeta.focusedId in data.entities)) {
      const allChildren = data.relationships[ROOT_ID] ?? []
      const fallback = allChildren[0] ?? ''
      mergedEntities[FOCUS_ID] = { id: FOCUS_ID, ...focusMeta, focusedId: fallback }
    }

    const selectionMeta = mergedEntities[SELECTION_ID] as { selectedIds?: string[] } | undefined
    if (selectionMeta?.selectedIds) {
      const cleaned = selectionMeta.selectedIds.filter(id => id in data.entities)
      if (cleaned.length !== selectionMeta.selectedIds.length) {
        mergedEntities[SELECTION_ID] = { id: SELECTION_ID, ...selectionMeta, selectedIds: cleaned }
      }
    }

    engine.syncStore({ entities: mergedEntities, relationships: data.relationships })
  }, [data, engine])

  // ── State derivation ──

  const store = engine.getStore()
  const focusedId = (store.entities['__focus__']?.focusedId as string) ?? ''
  const selectedIdSet = useMemo(() => {
    const ids = (store.entities['__selection__']?.selectedIds as string[]) ?? []
    return new Set(ids)
  }, [store])
  const selectedIds = useMemo(() => Array.from(selectedIdSet), [selectedIdSet])
  const expandedIds = useMemo(
    () => (store.entities['__expanded__']?.expandedIds as string[]) ?? [],
    [store]
  )

  const isKeyMapOnly = behavior === EMPTY_BEHAVIOR

  // ── ③④⑤⑥⑦ Shared view logic ──

  const view = useAriaView({
    engine, store, behavior, plugins, keyMap: keyMapOverrides,
    onActivate, focusedId, selectedIdSet, expandedIds,
    isKeyMapOnly, autoFocus, disabled,
  })

  // ── Pointer selection overlay (useAria-only) ──

  const { behaviorCtxOptions } = view

  const getNodeProps = useCallback(
    (id: string): Record<string, unknown> => {
      const baseProps = view.getNodeProps(id)
      if (isKeyMapOnly) return baseProps
      if (!behavior.selectOnClick && !behavior.activateOnClick) return baseProps

      if (behavior.selectOnClick) {
        baseProps.onPointerDown = () => {
          pointerDownCtxRef.current = createPatternContext(engine, behaviorCtxOptions as PatternContextOptions)
        }

        baseProps.onClick = (event: MouseEvent) => {
          if (event.defaultPrevented) return
          // Guard against bubbled clicks from nested treeitems
          const target = event.target as HTMLElement
          const closestItem = target.closest(`[data-node-id]`)
          if (closestItem && closestItem !== (event.currentTarget as HTMLElement)) return

          if (event.shiftKey && behavior.selectionMode === 'multiple') {
            if (pointerDownCtxRef.current) {
              engine.dispatch(pointerDownCtxRef.current.extendSelectionTo(id))
            }
          } else if ((event.ctrlKey || event.metaKey) && behavior.selectionMode === 'multiple') {
            engine.dispatch(selectionCommands.toggleSelect(id))
          } else {
            engine.dispatch(createBatchCommand([
              selectionCommands.select(id),
              selectionCommands.setAnchor(id),
            ]))
          }
          pointerDownCtxRef.current = null

          // Activate on click (skip when modifier keys held)
          const hasModifier = event.shiftKey || event.ctrlKey || event.metaKey
          if (behavior.activateOnClick && !hasModifier) {
            const cb = engineCallbacksMap.get(engine)
            if (cb?.onActivate) {
              // ② 2026-03-26-treeview-click-expand-prd.md
              // APG File Directory: click on parent = expand toggle + select
              if (behavior.expandOnParentClick !== false) {
                const children = getChildren(engine.getStore(), id)
                if (children.length > 0) {
                  engine.dispatch(expandCommands.toggleExpand(id))
                }
              }
              cb.onActivate(id)
            } else {
              const ctx = createPatternContext(engine, behaviorCtxOptions as PatternContextOptions)
              const command = ctx.activate()
              if (command) engine.dispatch(command)
            }
          }
        }
      }
      // If only activateOnClick (no selectOnClick), the base onClick from view already handles it

      return baseProps
    },
    [view, isKeyMapOnly, behavior.selectOnClick, behavior.activateOnClick, behavior.expandOnParentClick, behavior.selectionMode, engine, behaviorCtxOptions],
  )

  const dispatch = useCallback(
    (command: Command) => engine.dispatch(command),
    [engine]
  )

  return {
    dispatch,
    getNodeProps,
    getNodeState: view.getNodeState,
    focused: focusedId,
    selected: selectedIds,
    getStore: () => engine.getStore(),
    containerProps: view.containerProps,
  }
}
