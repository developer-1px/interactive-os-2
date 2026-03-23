import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { EngineOptions } from '../core/dispatchLogger'
import type { Command, NormalizedData, Plugin } from '../core/types'
import { ROOT_ID, createBatchCommand } from '../core/types'
import type { AriaBehavior, NodeState } from '../behaviors/types'
import { createCommandEngine } from '../core/createCommandEngine'
import type { CommandEngine } from '../core/createCommandEngine'
import { getChildren, getParent, getEntity, getEntityData } from '../core/createStore'
import { focusCommands, selectionCommands, FOCUS_ID, SELECTION_ID, SELECTION_ANCHOR_ID, EXPANDED_ID, GRID_COL_ID, VALUE_ID } from '../plugins/core'
import { RENAME_ID } from '../plugins/rename'

/** Known internal meta-entity IDs — only these are preserved during external sync */
const META_ENTITY_IDS = new Set([FOCUS_ID, SELECTION_ID, SELECTION_ANCHOR_ID, EXPANDED_ID, GRID_COL_ID, RENAME_ID, '__combobox__', '__spatial_parent__', VALUE_ID])
import { createBehaviorContext } from '../behaviors/createBehaviorContext'
import { findMatchingKey } from './useKeyboard'
import { isEditableElement, dispatchKeyAction } from './keymapHelpers'

const EMPTY_BEHAVIOR: AriaBehavior = {
  role: '',
  focusStrategy: { type: 'natural-tab-order', orientation: 'vertical' },
  ariaAttributes: () => ({}),
  keyMap: {},
}

export interface UseAriaOptions {
  behavior?: AriaBehavior
  data: NormalizedData
  plugins?: Plugin[]
  keyMap?: Record<string, (ctx: ReturnType<typeof createBehaviorContext>) => Command | void>
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  /** Focus this node on mount instead of the first child */
  initialFocus?: string
  /** Logger for engine dispatch events */
  logger?: EngineOptions['logger']
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
  const { behavior = EMPTY_BEHAVIOR, data, plugins = [], keyMap: keyMapOverrides, onChange, onActivate, initialFocus, logger } = options
  const [, forceRender] = useState(0)
  const engineRef = useRef<CommandEngine | null>(null)
  const onActivateRef = useRef(onActivate)
  // eslint-disable-next-line react-hooks/refs
  onActivateRef.current = onActivate
  const behaviorRef = useRef(behavior)
  // eslint-disable-next-line react-hooks/refs
  behaviorRef.current = behavior
  const prevFocusRef = useRef<string>('')
  // Stores BehaviorContext captured on pointerdown (before browser focus fires).
  // Must be a ref so it survives the re-render triggered by onFocus → setFocus.
  const pointerDownCtxRef = useRef<ReturnType<typeof createBehaviorContext> | null>(null)

  if (engineRef.current == null) {
    const middlewares = plugins
      .map((p) => p.middleware)
      .filter((m): m is NonNullable<typeof m> => m != null)

    // Suppress subscriber during initialization to prevent setState/navigate during render.
    // The initial render reads from getStore() directly, so forceRender is unnecessary.
    let initializing = true
    // eslint-disable-next-line react-hooks/refs
    engineRef.current = createCommandEngine(data, middlewares, (newStore) => {
      if (initializing) return
      // followFocus: detect focus change and call onActivate for eligible items
      const newFocusedId = (newStore.entities['__focus__']?.focusedId as string) ?? ''
      if (behaviorRef.current.followFocus && onActivateRef.current && newFocusedId && newFocusedId !== prevFocusRef.current) {
        const entityData = getEntityData<{ followFocus?: boolean }>(newStore, newFocusedId)
        if (entityData?.followFocus !== false) {
          onActivateRef.current(newFocusedId)
        }
      }
      prevFocusRef.current = newFocusedId
      onChange?.(newStore)
      forceRender((n) => n + 1)
    }, logger != null ? { logger } : undefined)

    // Priority: data.__focus__ (external binding) > initialFocus (hint) > first child
    const externalFocus = (data.entities[FOCUS_ID]?.focusedId as string) ?? ''
    const focusTarget = (externalFocus && data.entities[externalFocus])
      ? externalFocus
      : (initialFocus && data.entities[initialFocus])
        ? initialFocus
        : getChildren(data, ROOT_ID)[0]
    if (focusTarget) {
      // eslint-disable-next-line react-hooks/refs
      prevFocusRef.current = focusTarget
      // eslint-disable-next-line react-hooks/refs
      engineRef.current.dispatch(focusCommands.setFocus(focusTarget))
    }
    initializing = false
  }

  // eslint-disable-next-line react-hooks/refs
  const engine = engineRef.current

  // Gap 1 fix: sync external data changes into the engine
  // Merge external data while preserving only known internal meta-entities
  useEffect(() => {
    const currentStore = engine.getStore()
    // Check if content entities actually differ (skip meta-only diffs)
    // Also detect external __focus__ changes (CRUD two-way binding)
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
        // If external data explicitly provides __focus__, respect it (CRUD two-way binding)
        // Otherwise preserve internal meta-entity state (default one-way)
        if (key === FOCUS_ID && FOCUS_ID in data.entities) continue
        mergedEntities[key] = value
      }
    }

    // Sanitize stale references in meta-entities
    const focusMeta = mergedEntities[FOCUS_ID] as { focusedId?: string } | undefined
    if (focusMeta?.focusedId && !(focusMeta.focusedId in data.entities)) {
      // Focused item was removed externally → recover to nearest sibling or first child
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
    forceRender(n => n + 1)
  }, [data, engine])

  const pluginKeyMaps = useMemo(
    () => {
      if (!plugins.length) return undefined
      const merged: Record<string, (ctx: ReturnType<typeof createBehaviorContext>) => Command | void> = {}
      for (const p of plugins) {
        if (p.keyMap) Object.assign(merged, p.keyMap)
      }
      return Object.keys(merged).length > 0 ? merged : undefined
    },
    [plugins],
  )

  const pluginUnhandledKeyHandlers = useMemo(
    () => {
      if (!plugins.length) return undefined
      const handlers = plugins
        .map((p) => p.onUnhandledKey)
        .filter((h): h is NonNullable<typeof h> => h != null)
      return handlers.length > 0 ? handlers : undefined
    },
    [plugins],
  )

  const pluginClipboardHandlers = useMemo(
    () => {
      if (!plugins.length) return null
      type ClipboardHandler = (ctx: ReturnType<typeof createBehaviorContext>) => Command | void
      const handlers: { onCopy?: ClipboardHandler; onCut?: ClipboardHandler; onPaste?: ClipboardHandler } = {}
      for (const p of plugins) {
        if (p.onCopy) handlers.onCopy = p.onCopy
        if (p.onCut) handlers.onCut = p.onCut
        if (p.onPaste) handlers.onPaste = p.onPaste
      }
      return (handlers.onCopy || handlers.onCut || handlers.onPaste) ? handlers : null
    },
    [plugins],
  )

  const mergedKeyMap = useMemo(
    () => ({ ...behavior.keyMap, ...pluginKeyMaps, ...keyMapOverrides }),
    [behavior.keyMap, pluginKeyMaps, keyMapOverrides]
  )

  const dispatch = useCallback(
    (command: Command) => engine.dispatch(command),
    [engine]
  )

  // eslint-disable-next-line react-hooks/refs
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
  const renameEntity = store.entities[RENAME_ID]
  const valueMeta = behavior.valueRange ? store.entities[VALUE_ID] as Record<string, unknown> | undefined : undefined

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
      const renaming = !!(renameEntity?.active && renameEntity?.nodeId === id)

      return {
        focused: id === focusedId,
        selected: selectedIdSet.has(id),
        disabled: false,
        index: siblings.indexOf(id),
        siblingCount: siblings.length,
        expanded: isExpandable ? expandedIds.includes(id) : undefined,
        level: level + 1,
        renaming,
        ...(behavior.valueRange && { valueCurrent: (valueMeta?.value as number) ?? behavior.valueRange.min }),
      }
    },
    [store, focusedId, selectedIdSet, expandedIds, behavior.expandable, renameEntity, valueMeta, behavior.valueRange]
  )

  const behaviorCtxOptions = useMemo(
    () => ({
      expandable: behavior.expandable,
      selectionMode: behavior.selectionMode,
      colCount: behavior.colCount,
      valueRange: behavior.valueRange,
    }),
    [behavior.expandable, behavior.selectionMode, behavior.colCount, behavior.valueRange]
  )

  /** Handle native clipboard events (copy/cut/paste) from plugins */
  const handleClipboardEvent = useCallback(
    (event: ClipboardEvent) => {
      if (event.defaultPrevented) return
      if (!pluginClipboardHandlers) return
      if (isEditableElement(event.target as Element)) return

      const ctx = createBehaviorContext(engine, behaviorCtxOptions)
      let handler: ((ctx: ReturnType<typeof createBehaviorContext>) => Command | void) | undefined
      switch (event.type) {
        case 'copy': handler = pluginClipboardHandlers.onCopy; break
        case 'cut': handler = pluginClipboardHandlers.onCut; break
        case 'paste': handler = pluginClipboardHandlers.onPaste; break
      }
      if (!handler) return
      const command = handler(ctx)
      if (command) {
        engine.dispatch(command)
        event.preventDefault()
      }
    },
    [pluginClipboardHandlers, engine, behaviorCtxOptions],
  )

  /** Shared keydown dispatch: try keyMap first, then plugin onUnhandledKey fallback */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const matchedKey = findMatchingKey(event, mergedKeyMap)
      if (matchedKey) {
        const ctx = createBehaviorContext(engine, behaviorCtxOptions)
        const handler = mergedKeyMap[matchedKey]
        if (!handler) return
        const handled = dispatchKeyAction(ctx, handler, engine, onActivateRef.current)
        if (handled) event.preventDefault()
      } else if (pluginUnhandledKeyHandlers) {
        for (const h of pluginUnhandledKeyHandlers) {
          if (h(event, engine)) {
            event.preventDefault()
            break
          }
        }
      }
    },
    [mergedKeyMap, engine, behaviorCtxOptions, pluginUnhandledKeyHandlers],
  )

  const isKeyMapOnly = behavior === EMPTY_BEHAVIOR

  const getNodeProps = useCallback(
    (id: string): Record<string, unknown> => {
      if (isKeyMapOnly) return {}
      const state = getNodeState(id)
      const entity = getEntity(store, id) ?? { id }
      const ariaAttrs = behavior.ariaAttributes(entity, state)
      const isActivedescendant = behavior.focusStrategy.type === 'aria-activedescendant'

      const baseProps: Record<string, unknown> = {
        role: behavior.childRole ?? 'row',
        'data-node-id': id,
        ...ariaAttrs,
      }

      if (state.focused) baseProps['data-focused'] = ''

      // Capture BehaviorContext on pointerdown (before browser focus fires).
      // onFocus → setFocus → anchorResetMiddleware clears anchor.
      // We need the pre-focus ctx for Shift+Click range calculation.
      // Uses ref so it survives the re-render triggered by onFocus.
      baseProps.onPointerDown = () => {
        if (behavior.selectOnClick) {
          pointerDownCtxRef.current = createBehaviorContext(engine, behaviorCtxOptions)
        }
      }

      baseProps.onClick = (event: MouseEvent) => {
        if (event.defaultPrevented) return // bubbling guard for nested aria instances

        // 1. Select on click
        if (behavior.selectOnClick) {
          if (event.shiftKey && behavior.selectionMode === 'multiple') {
            // Range select: use pre-focus ctx (has correct anchor)
            if (pointerDownCtxRef.current) {
              engine.dispatch(pointerDownCtxRef.current.extendSelectionTo(id))
            }
          } else if ((event.ctrlKey || event.metaKey) && behavior.selectionMode === 'multiple') {
            // Toggle select: add/remove from current selection
            engine.dispatch(selectionCommands.toggleSelect(id))
          } else {
            // Plain click: replace selection + set anchor for future Shift+Click
            engine.dispatch(createBatchCommand([
              selectionCommands.select(id),
              selectionCommands.setAnchor(id),
            ]))
          }
          pointerDownCtxRef.current = null
        }

        // 2. Activate on click (existing behavior)
        // Skip activate when modifier keys are held — modifier+click is for selection, not activation
        const hasModifier = event.shiftKey || event.ctrlKey || event.metaKey
        if (behavior.activateOnClick && !hasModifier) {
          if (onActivateRef.current) {
            onActivateRef.current(id)
          } else {
            const ctx = createBehaviorContext(engine, behaviorCtxOptions)
            const command = ctx.activate()
            if (command) engine.dispatch(command)
          }
        }
      }
      baseProps.onFocus = (event: FocusEvent) => {
        // Only handle direct focus, not bubbled from children
        if (event.target !== event.currentTarget) return
        if (id !== focusedId) {
          engine.dispatch(focusCommands.setFocus(id))
        }
      }

      if (!isActivedescendant) {
        baseProps.tabIndex = behavior.focusStrategy.type === 'natural-tab-order' ? 0 : (id === focusedId ? 0 : -1)
        baseProps.onKeyDown = (event: KeyboardEvent) => {
          if (event.defaultPrevented) return
          if (event.target !== event.currentTarget) return
          handleKeyDown(event)
        }
      }

      return baseProps
    },
    [store, behavior, isKeyMapOnly, engine, focusedId, getNodeState, handleKeyDown, behaviorCtxOptions]
  )

  const containerProps = useMemo((): Record<string, unknown> => {
    const clipboardProps: Record<string, unknown> = pluginClipboardHandlers
      ? { onCopy: handleClipboardEvent, onCut: handleClipboardEvent, onPaste: handleClipboardEvent }
      : {}

    if (isKeyMapOnly) {
      // keyMap-only mode: catch bubbled keyboard events, no role/tabIndex
      return {
        onKeyDown: (event: KeyboardEvent) => {
          if (event.defaultPrevented) return
          handleKeyDown(event)
        },
        ...clipboardProps,
      }
    }
    if (behavior.focusStrategy.type !== 'aria-activedescendant') return { tabIndex: -1, ...clipboardProps }
    return {
      tabIndex: 0,
      'aria-activedescendant': focusedId || undefined,
      onKeyDown: (event: KeyboardEvent) => {
        if (event.defaultPrevented) return
        if (event.target !== event.currentTarget && isEditableElement(event.target as Element)) return
        handleKeyDown(event)
      },
      ...clipboardProps,
    }
  }, [isKeyMapOnly, behavior.focusStrategy.type, focusedId, handleKeyDown, pluginClipboardHandlers, handleClipboardEvent])

  // Sync DOM focus with data focus (skip for aria-activedescendant — container holds focus)
  // Only move DOM focus if this widget already owns it (prevents stealing focus from other widgets)
  useEffect(() => {
    if (isKeyMapOnly) return // keyMap-only mode: no focus management
    if (!focusedId) return
    if (behavior.focusStrategy.type === 'aria-activedescendant') return
    const el = document.querySelector<HTMLElement>(`[data-node-id="${focusedId}"]`)
    if (!el || el === document.activeElement) return
    const container = el.closest('[data-aria-container]')
    const ownsActiveFocus = container?.contains(document.activeElement)
    const focusIsOrphaned = document.activeElement === document.body || document.activeElement === null
    if (!ownsActiveFocus && !focusIsOrphaned) return
    el.focus({ preventScroll: false })
  }, [isKeyMapOnly, focusedId, behavior.focusStrategy.type, behavior.role])

  return {
    dispatch,
    getNodeProps,
    getNodeState,
    focused: focusedId,
    selected: selectedIds,
    getStore: () => engine.getStore(),
    containerProps,
  }
}
