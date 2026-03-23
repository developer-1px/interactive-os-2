import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { Command, NormalizedData, Plugin } from '../core/types'
import { ROOT_ID, createBatchCommand } from '../core/types'
import type { AriaBehavior, NodeState } from '../behaviors/types'
import type { CommandEngine } from '../core/createCommandEngine'
import { getChildren, getParent, getEntity, getEntityData } from '../core/createStore'
import { focusCommands } from '../plugins/core'
import { createBehaviorContext } from '../behaviors/createBehaviorContext'
import { findMatchingKey } from './useKeyboard'
import { isEditableElement, dispatchKeyAction } from './keymapHelpers'
import { isVisible, findFallbackFocus, detectNewVisibleEntities } from '../plugins/focusRecovery'
import type { IsReachable } from '../plugins/focusRecovery'
import type { UseAriaReturn } from './useAria'

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
  plugins?: Plugin[]
  keyMap?: Record<string, (ctx: ReturnType<typeof createBehaviorContext>) => Command | void>
  onActivate?: (nodeId: string) => void
  initialFocus?: string
  isReachable?: IsReachable
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
  const p = command.payload as Record<string, unknown>
  switch (command.type) {
    case 'core:focus':
      return { ...state, focusedId: p.nodeId as string }
    case 'core:toggle-select': {
      const id = p.nodeId as string
      const set = new Set(state.selectedIds)
      if (set.has(id)) set.delete(id); else set.add(id)
      return { ...state, selectedIds: Array.from(set) }
    }
    case 'core:select-range':
      return { ...state, selectedIds: p.nodeIds as string[] }
    case 'core:set-anchor':
      return { ...state, selectionAnchor: p.nodeId as string }
    case 'core:clear-anchor':
      return { ...state, selectionAnchor: '' }
    case 'core:clear-selection':
      return { ...state, selectedIds: [] }
    case 'core:expand': {
      const id = p.nodeId as string
      return state.expandedIds.includes(id) ? state : { ...state, expandedIds: [...state.expandedIds, id] }
    }
    case 'core:collapse': {
      const id = p.nodeId as string
      return { ...state, expandedIds: state.expandedIds.filter(x => x !== id) }
    }
    case 'core:toggle-expand': {
      const id = p.nodeId as string
      return state.expandedIds.includes(id)
        ? { ...state, expandedIds: state.expandedIds.filter(x => x !== id) }
        : { ...state, expandedIds: [...state.expandedIds, id] }
    }
    case 'core:set-col-index':
      return { ...state, gridCol: p.colIndex as number }
    default:
      return state
  }
}

// ── Hook ──

export function useAriaZone(options: UseAriaZoneOptions): UseAriaReturn {
  const {
    engine, store, behavior, scope,
    plugins: zonePlugins,
    keyMap: keyMapOverrides,
    onActivate, initialFocus,
    isReachable,
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
            // Zone-level focus recovery (always active)
            const storeAfter = engine.getStore()
            if (storeAfter !== storeBefore) {
              runFocusRecovery(storeBefore, storeAfter)
            }
          }
          return
        }

        if (META_COMMAND_TYPES.has(command.type)) {
          setViewState(prev => {
            const next = applyMetaCommand(prev, command)
            // Anchor reset: when standalone focus fires, clear selection anchor
            return command.type === 'core:focus'
              ? { ...next, selectionAnchor: '' }
              : next
          })
          return
        }

        // Data command → shared engine + focus recovery (always active)
        const storeBefore = engine.getStore()
        engine.dispatch(command)
        const storeAfter = engine.getStore()
        if (storeAfter !== storeBefore) {
          runFocusRecovery(storeBefore, storeAfter)
        }
      },
      syncStore() { /* no-op — zone doesn't own engine store */ },
    }

    function runFocusRecovery(storeBefore: NormalizedData, storeAfter: NormalizedData) {
      const vs = viewStateRef.current
      // New visible entities → focus the first one (top-level result)
      const newVisible = detectNewVisibleEntities(storeBefore, storeAfter, isReachable)
      if (newVisible.length > 0) {
        setViewState(prev => ({ ...prev, focusedId: newVisible[0]! }))
        return
      }
      // Current focus not visible → fallback
      if (vs.focusedId && !isVisible(storeAfter, vs.focusedId, isReachable)) {
        const fallback = findFallbackFocus(storeBefore, storeAfter, vs.focusedId, isReachable)
        if (fallback) {
          setViewState(prev => ({ ...prev, focusedId: fallback }))
        }
      }
    }
  }, [engine, isReachable])

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

  const pluginKeyMaps = useMemo(
    () => {
      if (!zonePlugins?.length) return undefined
      const merged: Record<string, (ctx: ReturnType<typeof createBehaviorContext>) => Command | void> = {}
      for (const p of zonePlugins) {
        if (p.keyMap) Object.assign(merged, p.keyMap)
      }
      return Object.keys(merged).length > 0 ? merged : undefined
    },
    [zonePlugins],
  )

  const pluginClipboardHandlers = useMemo(
    () => {
      if (!zonePlugins?.length) return null
      type ClipboardHandler = (ctx: ReturnType<typeof createBehaviorContext>) => Command | void
      const handlers: { onCopy?: ClipboardHandler; onCut?: ClipboardHandler; onPaste?: ClipboardHandler } = {}
      for (const p of zonePlugins) {
        if (p.onCopy) handlers.onCopy = p.onCopy
        if (p.onCut) handlers.onCut = p.onCut
        if (p.onPaste) handlers.onPaste = p.onPaste
      }
      return (handlers.onCopy || handlers.onCut || handlers.onPaste) ? handlers : null
    },
    [zonePlugins],
  )

  const mergedKeyMap = useMemo(
    () => ({ ...behavior.keyMap, ...pluginKeyMaps, ...keyMapOverrides }),
    [behavior.keyMap, pluginKeyMaps, keyMapOverrides],
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
          if (event.defaultPrevented) return
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

  // ── Clipboard event handler ──

  const handleClipboardEvent = useCallback(
    (event: ClipboardEvent) => {
      if (event.defaultPrevented) return
      if (!pluginClipboardHandlers) return
      if (isEditableElement(event.target as Element)) return

      const ctx = createBehaviorContext(virtualEngine, behaviorCtxOptions)
      let handler: ((ctx: ReturnType<typeof createBehaviorContext>) => Command | void) | undefined
      switch (event.type) {
        case 'copy': handler = pluginClipboardHandlers.onCopy; break
        case 'cut': handler = pluginClipboardHandlers.onCut; break
        case 'paste': handler = pluginClipboardHandlers.onPaste; break
      }
      if (!handler) return
      const command = handler(ctx)
      if (command) {
        virtualEngine.dispatch(command)
        event.preventDefault()
      }
    },
    [pluginClipboardHandlers, virtualEngine, behaviorCtxOptions],
  )

  // ── containerProps (for aria-activedescendant mode) ──

  const containerProps = useMemo((): Record<string, unknown> => {
    const clipboardProps: Record<string, unknown> = pluginClipboardHandlers
      ? { onCopy: handleClipboardEvent, onCut: handleClipboardEvent, onPaste: handleClipboardEvent }
      : {}

    if (behavior.focusStrategy.type !== 'aria-activedescendant') return { tabIndex: -1, ...clipboardProps }
    return {
      tabIndex: 0,
      'aria-activedescendant': focusedId || undefined,
      onKeyDown: (event: KeyboardEvent) => {
        if (event.defaultPrevented) return
        if (event.target !== event.currentTarget && isEditableElement(event.target as Element)) return
        const matchedKey = findMatchingKey(event, mergedKeyMap)
        if (!matchedKey) return
        const ctx = createBehaviorContext(virtualEngine, behaviorCtxOptions)
        const handler = mergedKeyMap[matchedKey]
        if (!handler) return
        dispatchKeyAction(ctx, handler, virtualEngine, onActivateRef.current)
        event.preventDefault()
      },
      ...clipboardProps,
    }
  }, [behavior.focusStrategy.type, focusedId, mergedKeyMap, virtualEngine, behaviorCtxOptions, pluginClipboardHandlers, handleClipboardEvent])

  // ── External store-change focus recovery ──
  // When something outside the zone mutates the engine store (e.g. toolbar button),
  // the zone's synchronous runFocusRecovery in dispatch() doesn't fire.
  // This effect catches those external mutations and recovers focus.

  const prevStoreRef = useRef(store)

  useEffect(() => {
    const prevStore = prevStoreRef.current
    prevStoreRef.current = store
    if (prevStore === store) return

    const vs = viewStateRef.current
    if (!vs.focusedId) return

    // Focus still valid → skip
    if (isVisible(store, vs.focusedId, isReachable)) return

    // Focus invalid — external mutation removed the focused node
    const fallback = findFallbackFocus(prevStore, store, vs.focusedId, isReachable)
    if (fallback) {
      setViewState(prev => prev.focusedId === fallback ? prev : { ...prev, focusedId: fallback })
    }
  }, [store, isReachable])

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
