import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { Command } from '../engine/types'
import { createBatchCommand } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { AriaPattern } from '../pattern/types'
import type { CommandEngine } from '../engine/createCommandEngine'
import { getChildren } from '../store/createStore'
import { createPatternContext } from '../pattern/createPatternContext'
import { isVisible, findFallbackFocus, detectNewVisibleEntities } from '../plugins/focusRecovery'
import type { IsReachable } from '../plugins/focusRecovery'
import type { UseAriaReturn } from './useAria'
import { useAriaView } from './useAriaView'

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
  behavior: AriaPattern
  scope: string
  plugins?: Plugin[]
  keyMap?: Record<string, (ctx: ReturnType<typeof createPatternContext>) => Command | void>
  onActivate?: (nodeId: string) => void
  initialFocus?: string
  isReachable?: IsReachable
  disabled?: boolean
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
    isReachable, disabled = false,
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
  const viewStateRef = useRef(viewState)
  viewStateRef.current = viewState

  // ── Virtual engine adapter ──

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
          if (metaCmds.length > 0) {
            setViewState(prev => {
              let s = prev
              for (const cmd of metaCmds) s = applyMetaCommand(s, cmd)
              return s
            })
          }
          if (dataCmds.length > 0) {
            const storeBefore = engine.getStore()
            if (dataCmds.length === 1) {
              engine.dispatch(dataCmds[0]!)
            } else {
              engine.dispatch(createBatchCommand(dataCmds))
            }
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
            if (command.type === 'core:focus') {
              const withAnchorReset = { ...next, selectionAnchor: '' }
              // selectionFollowsFocus: auto-select focused node (standalone focus only, not batch)
              if (behaviorRef.current.selectionFollowsFocus) {
                const nodeId = (command.payload as { nodeId: string }).nodeId
                return { ...withAnchorReset, selectedIds: [nodeId] }
              }
              return withAnchorReset
            }
            return next
          })
          return
        }

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
      const newVisible = detectNewVisibleEntities(storeBefore, storeAfter, isReachable)
      if (newVisible.length > 0) {
        setViewState(prev => ({ ...prev, focusedId: newVisible[0]! }))
        return
      }
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

  // ── activationFollowsSelection ──

  const prevSelectedIdsRef = useRef<string[]>(selectedIds)

  useEffect(() => {
    const prev = prevSelectedIdsRef.current
    prevSelectedIdsRef.current = selectedIds
    if (prev === selectedIds) return
    if (!behaviorRef.current.activationFollowsSelection || !onActivateRef.current) return
    if (selectedIds.length === 0) return
    onActivateRef.current(selectedIds[selectedIds.length - 1]!)
  }, [selectedIds])

  // ── Shared view logic ──

  const view = useAriaView({
    engine: virtualEngine,
    store,
    behavior,
    plugins: zonePlugins,
    keyMap: keyMapOverrides,
    onActivate,
    focusedId,
    selectedIdSet,
    expandedIds,
    nodeIdAttr: `data-${scope}-id`,
    disabled,
  })

  // ── External store-change focus recovery ──

  const prevStoreRef = useRef(store)

  useEffect(() => {
    const prevStore = prevStoreRef.current
    prevStoreRef.current = store
    if (prevStore === store) return

    const vs = viewStateRef.current
    if (!vs.focusedId) return
    if (isVisible(store, vs.focusedId, isReachable)) return

    const fallback = findFallbackFocus(prevStore, store, vs.focusedId, isReachable)
    if (fallback) {
      setViewState(prev => prev.focusedId === fallback ? prev : { ...prev, focusedId: fallback })
    }
  }, [store, isReachable])

  // ── dispatch (exposed) ──

  const dispatch = useCallback(
    (command: Command) => virtualEngine.dispatch(command),
    [virtualEngine],
  )

  return {
    dispatch,
    getNodeProps: view.getNodeProps,
    getNodeState: view.getNodeState,
    focused: focusedId,
    selected: selectedIds,
    getStore: () => virtualEngine.getStore(),
    containerProps: view.containerProps,
  }
}
