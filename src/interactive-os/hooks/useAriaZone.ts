import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { Command, NormalizedData } from '../core/types'
import { ROOT_ID, createBatchCommand } from '../core/types'
import type { AriaBehavior, NodeState } from '../behaviors/types'
import type { CommandEngine } from '../core/createCommandEngine'
import { getChildren, getParent, getEntity, getEntityData } from '../core/createStore'
import { focusCommands } from '../plugins/core'
import { createBehaviorContext } from '../behaviors/createBehaviorContext'
import { findMatchingKey } from './useKeyboard'
import { isVisible, findFallbackFocus, detectNewVisibleEntities } from '../plugins/focus-recovery'
import type { UseAriaReturn } from './useAria'

function isEditableElement(el: Element): boolean {
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true
  if (el.getAttribute('contenteditable') != null) return true
  return false
}

/** Command types that update zone-local view state (not shared engine data). */
const META_COMMAND_TYPES = new Set([
  'core:focus',
  'core:toggle-select',
  'core:select-range',
  'core:set-anchor',
  'core:clear-anchor',
  'core:clear-selection',
  'core:expand',
  'core:collapse',
  'core:toggle-expand',
  'core:set-col-index',
])

export interface UseAriaZoneOptions {
  engine: CommandEngine
  store: NormalizedData
  behavior: AriaBehavior
  scope: string
  keyMap?: Record<string, (ctx: ReturnType<typeof createBehaviorContext>) => Command | void>
  onActivate?: (nodeId: string) => void
  initialFocus?: string
  focusRecovery?: boolean
}

// ── Zone-local meta-entity state ──

interface ZoneViewState {
  focusedId: string
  selectedIds: string[]
  selectionAnchor: string
  expandedIds: string[]
  gridCol: number
}

function applyMetaCommand(state: ZoneViewState, command: Command): ZoneViewState {
  switch (command.type) {
    case 'core:focus':
      return { ...state, focusedId: (command.payload as { id: string }).id }
    case 'core:toggle-select': {
      const id = (command.payload as { id: string }).id
      const set = new Set(state.selectedIds)
      if (set.has(id)) set.delete(id); else set.add(id)
      return { ...state, selectedIds: Array.from(set) }
    }
    case 'core:select-range': {
      const ids = (command.payload as { ids: string[] }).ids
      return { ...state, selectedIds: ids }
    }
    case 'core:set-anchor':
      return { ...state, selectionAnchor: (command.payload as { id: string }).id }
    case 'core:clear-anchor':
      return { ...state, selectionAnchor: '' }
    case 'core:clear-selection':
      return { ...state, selectedIds: [] }
    case 'core:expand': {
      const id = (command.payload as { id: string }).id
      return state.expandedIds.includes(id) ? state : { ...state, expandedIds: [...state.expandedIds, id] }
    }
    case 'core:collapse': {
      const id = (command.payload as { id: string }).id
      return { ...state, expandedIds: state.expandedIds.filter(x => x !== id) }
    }
    case 'core:toggle-expand': {
      const id = (command.payload as { id: string }).id
      return state.expandedIds.includes(id)
        ? { ...state, expandedIds: state.expandedIds.filter(x => x !== id) }
        : { ...state, expandedIds: [...state.expandedIds, id] }
    }
    case 'core:set-col-index':
      return { ...state, gridCol: (command.payload as { colIndex: number }).colIndex }
    default:
      return state
  }
}

// ── Hook ──

export function useAriaZone(options: UseAriaZoneOptions): UseAriaReturn {
  const {
    engine, store, behavior, scope,
    keyMap: keyMapOverrides,
    onActivate, initialFocus,
    focusRecovery: enableFocusRecovery = true,
  } = options

  const [viewState, setViewState] = useState<ZoneViewState>(() => {
    const focusTarget = (initialFocus && store.entities[initialFocus])
      ? initialFocus
      : getChildren(store, ROOT_ID)[0] ?? ''
    return {
      focusedId: focusTarget,
      selectedIds: [],
      selectionAnchor: '',
      expandedIds: [],
      gridCol: 0,
    }
  })

  const onActivateRef = useRef(onActivate)
  onActivateRef.current = onActivate
  const behaviorRef = useRef(behavior)
  behaviorRef.current = behavior
  const prevFocusRef = useRef(viewState.focusedId)
  const viewStateRef = useRef(viewState)
  viewStateRef.current = viewState

  // ── Virtual engine adapter ──
  // Overlays zone-local meta-entities onto the real engine's store.
  // createBehaviorContext reads from engine.getStore(), so this makes it zone-aware.

  const virtualEngine = useMemo<CommandEngine>(() => {
    function getVirtualStore(): NormalizedData {
      const realStore = engine.getStore()
      const vs = viewStateRef.current
      return {
        entities: {
          ...realStore.entities,
          __focus__: { id: '__focus__', focusedId: vs.focusedId },
          __selection__: { id: '__selection__', selectedIds: vs.selectedIds },
          __selection_anchor__: { id: '__selection_anchor__', anchorId: vs.selectionAnchor },
          __expanded__: { id: '__expanded__', expandedIds: vs.expandedIds },
          __grid_col__: { id: '__grid_col__', colIndex: vs.gridCol },
        },
        relationships: realStore.relationships,
      }
    }

    return {
      getStore: getVirtualStore,
      dispatch(command: Command) {
        if (command.type === 'batch' && 'commands' in command) {
          const metaCmds: Command[] = []
          const dataCmds: Command[] = []
          for (const sub of (command as { commands: Command[] }).commands) {
            if (META_COMMAND_TYPES.has(sub.type)) metaCmds.push(sub)
            else dataCmds.push(sub)
          }
          // Apply meta commands to zone state
          if (metaCmds.length > 0) {
            setViewState(prev => {
              let s = prev
              for (const cmd of metaCmds) s = applyMetaCommand(s, cmd)
              return s
            })
          }
          // Dispatch data commands to real engine
          if (dataCmds.length > 0) {
            const storeBefore = engine.getStore()
            if (dataCmds.length === 1) {
              engine.dispatch(dataCmds[0]!)
            } else {
              // Re-batch data commands
              engine.dispatch(createBatchCommand(dataCmds))
            }
            // Zone-level focus recovery
            if (enableFocusRecovery) {
              const storeAfter = engine.getStore()
              if (storeAfter !== storeBefore) {
                runFocusRecovery(storeBefore, storeAfter)
              }
            }
          }
          return
        }

        if (META_COMMAND_TYPES.has(command.type)) {
          setViewState(prev => applyMetaCommand(prev, command))
          // Anchor reset: when standalone focus fires, clear selection anchor
          if (command.type === 'core:focus') {
            setViewState(prev => ({ ...prev, selectionAnchor: '' }))
          }
          return
        }

        // Data command → shared engine + focus recovery
        const storeBefore = engine.getStore()
        engine.dispatch(command)
        if (enableFocusRecovery) {
          const storeAfter = engine.getStore()
          if (storeAfter !== storeBefore) {
            runFocusRecovery(storeBefore, storeAfter)
          }
        }
      },
      syncStore() { /* no-op — zone doesn't own engine store */ },
    }

    function runFocusRecovery(storeBefore: NormalizedData, storeAfter: NormalizedData) {
      const vs = viewStateRef.current
      // New visible entities → focus last new one
      const newVisible = detectNewVisibleEntities(storeBefore, storeAfter)
      if (newVisible.length > 0) {
        setViewState(prev => ({ ...prev, focusedId: newVisible[newVisible.length - 1]! }))
        return
      }
      // Current focus not visible → fallback
      if (vs.focusedId && !isVisible(storeAfter, vs.focusedId)) {
        const fallback = findFallbackFocus(storeBefore, storeAfter, vs.focusedId)
        if (fallback) {
          setViewState(prev => ({ ...prev, focusedId: fallback }))
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, enableFocusRecovery])

  // ── Derived state ──

  const { focusedId, selectedIds, expandedIds } = viewState
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])

  // ── followFocus ──

  useEffect(() => {
    if (!focusedId || focusedId === prevFocusRef.current) return
    prevFocusRef.current = focusedId
    if (behaviorRef.current.followFocus && onActivateRef.current) {
      const entityData = getEntityData<{ followFocus?: boolean }>(store, focusedId)
      if (entityData?.followFocus !== false) {
        onActivateRef.current(focusedId)
      }
    }
  }, [focusedId, store])

  // ── KeyMap ──

  const mergedKeyMap = useMemo(
    () => ({ ...behavior.keyMap, ...keyMapOverrides }),
    [behavior.keyMap, keyMapOverrides],
  )

  const behaviorCtxOptions = useMemo(
    () => ({
      expandable: behavior.expandable,
      selectionMode: behavior.selectionMode,
      colCount: behavior.colCount,
    }),
    [behavior.expandable, behavior.selectionMode, behavior.colCount],
  )

  // ── dispatch (exposed) ──

  const dispatch = useCallback(
    (command: Command) => virtualEngine.dispatch(command),
    [virtualEngine],
  )

  // ── getNodeState ──

  const getNodeState = useCallback(
    (id: string): NodeState => {
      const parentId = getParent(store, id)
      const siblings = parentId ? getChildren(store, parentId) : []
      const children = getChildren(store, id)
      const hasChildren = children.length > 0

      let level = 0
      let current = id
      while (true) {
        const parent = getParent(store, current)
        if (!parent || parent === ROOT_ID) break
        level++
        current = parent
      }

      const isExpandable = hasChildren || (behavior.expandable ?? false)

      return {
        focused: id === focusedId,
        selected: selectedIdSet.has(id),
        disabled: false,
        index: siblings.indexOf(id),
        siblingCount: siblings.length,
        expanded: isExpandable ? expandedIds.includes(id) : undefined,
        level: level + 1,
      }
    },
    [store, focusedId, selectedIdSet, expandedIds, behavior.expandable],
  )

  // ── getNodeProps (scoped) ──

  const scopeAttr = `data-${scope}-id`

  const getNodeProps = useCallback(
    (id: string): Record<string, unknown> => {
      const state = getNodeState(id)
      const entity = getEntity(store, id) ?? { id }
      const ariaAttrs = behavior.ariaAttributes(entity, state)
      const isActivedescendant = behavior.focusStrategy.type === 'aria-activedescendant'

      const baseProps: Record<string, unknown> = {
        role: behavior.childRole ?? 'row',
        [scopeAttr]: id,
        ...ariaAttrs,
      }

      if (state.focused) baseProps['data-focused'] = ''

      baseProps.onClick = () => {
        if (behavior.activateOnClick) {
          if (onActivateRef.current) {
            onActivateRef.current(id)
          } else {
            const ctx = createBehaviorContext(virtualEngine, behaviorCtxOptions)
            const command = ctx.activate()
            if (command) virtualEngine.dispatch(command)
          }
        }
      }
      baseProps.onFocus = (event: FocusEvent) => {
        if (event.target !== event.currentTarget) return
        if (id !== focusedId) {
          virtualEngine.dispatch(focusCommands.setFocus(id))
        }
      }

      if (!isActivedescendant) {
        baseProps.tabIndex = behavior.focusStrategy.type === 'natural-tab-order' ? 0 : (id === focusedId ? 0 : -1)
        baseProps.onKeyDown = (event: KeyboardEvent) => {
          if (event.target !== event.currentTarget) return
          const matchedKey = findMatchingKey(event, mergedKeyMap)
          if (!matchedKey) return
          const ctx = createBehaviorContext(virtualEngine, behaviorCtxOptions)
          const handler = mergedKeyMap[matchedKey]
          if (!handler) return
          dispatchKeyAction(ctx, handler, virtualEngine, onActivateRef.current)
          event.preventDefault()
        }
      }

      return baseProps
    },
    [store, behavior, mergedKeyMap, virtualEngine, focusedId, getNodeState, behaviorCtxOptions, scopeAttr],
  )

  // ── containerProps (for aria-activedescendant mode) ──

  const containerProps = useMemo((): Record<string, unknown> => {
    if (behavior.focusStrategy.type !== 'aria-activedescendant') return {}
    return {
      tabIndex: 0,
      'aria-activedescendant': focusedId || undefined,
      onKeyDown: (event: KeyboardEvent) => {
        if (event.target !== event.currentTarget && isEditableElement(event.target as Element)) return
        const matchedKey = findMatchingKey(event, mergedKeyMap)
        if (!matchedKey) return
        const ctx = createBehaviorContext(virtualEngine, behaviorCtxOptions)
        const handler = mergedKeyMap[matchedKey]
        if (!handler) return
        dispatchKeyAction(ctx, handler, virtualEngine, onActivateRef.current)
        event.preventDefault()
      },
    }
  }, [behavior.focusStrategy.type, focusedId, mergedKeyMap, virtualEngine, behaviorCtxOptions])

  // ── DOM focus sync (scoped to zone container) ──

  useEffect(() => {
    if (!focusedId) return
    if (behavior.focusStrategy.type === 'aria-activedescendant') return
    // Find within any ancestor container that has data-aria-container
    const el = document.querySelector<HTMLElement>(`[${scopeAttr}="${focusedId}"]`)
    if (!el || el === document.activeElement) return
    const container = el.closest('[data-aria-container]')
    const ownsActiveFocus = container?.contains(document.activeElement)
    const focusIsOrphaned = document.activeElement === document.body || document.activeElement === null
    if (!ownsActiveFocus && !focusIsOrphaned) return
    el.focus({ preventScroll: false })
  }, [focusedId, behavior.focusStrategy.type, scopeAttr])

  return {
    dispatch,
    getNodeProps,
    getNodeState,
    focused: focusedId,
    selected: selectedIds,
    getStore: () => virtualEngine.getStore(),
    containerProps,
  }
}

// ── Shared helper (same as useAria) ──

function dispatchKeyAction(
  ctx: ReturnType<typeof createBehaviorContext>,
  handler: (ctx: ReturnType<typeof createBehaviorContext>) => Command | void,
  engine: CommandEngine,
  onActivateFn: ((nodeId: string) => void) | undefined,
) {
  if (onActivateFn) {
    let intercepted = false
    ctx.activate = () => {
      intercepted = true
      onActivateFn(ctx.focused)
      return undefined as unknown as Command
    }
    const command = handler(ctx)
    if (!intercepted && command) engine.dispatch(command)
  } else {
    const command = handler(ctx)
    if (command) engine.dispatch(command)
  }
}
