import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { Command } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { AriaPattern, NodeState } from '../pattern/types'
import type { CommandEngine } from '../engine/createCommandEngine'
import { getChildren, getParent, getEntity } from '../store/createStore'
import { focusCommands } from '../axis/navigate'
import { expandCommands, expandVisibilityFilter } from '../axis/expand'
import { VALUE_ID } from '../axis/value'
import { RENAME_ID } from '../plugins/rename'
import { createPatternContext } from '../pattern/createPatternContext'
import { findMatchingKey } from './useKeyboard'
import { isEditableElement, dispatchKeyAction } from './keymapHelpers'

type KeyMapHandler = (ctx: ReturnType<typeof createPatternContext>) => Command | void
type ClipboardHandler = KeyMapHandler

// ── Plugin handler extraction (pure) ──

export function collectPluginKeyMaps(plugins: Plugin[]): Record<string, KeyMapHandler> | undefined {
  if (!plugins.length) return undefined
  const merged: Record<string, KeyMapHandler> = {}
  for (const p of plugins) {
    if (p.keyMap) Object.assign(merged, p.keyMap)
  }
  return Object.keys(merged).length > 0 ? merged : undefined
}

export function collectPluginUnhandledKeyHandlers(plugins: Plugin[]) {
  if (!plugins.length) return undefined
  const handlers = plugins
    .map((p) => p.onUnhandledKey)
    .filter((h): h is NonNullable<typeof h> => h != null)
  return handlers.length > 0 ? handlers : undefined
}

export function collectPluginClipboardHandlers(plugins: Plugin[]) {
  if (!plugins.length) return null
  const handlers: { onCopy?: ClipboardHandler; onCut?: ClipboardHandler; onPaste?: ClipboardHandler } = {}
  for (const p of plugins) {
    if (p.onCopy) handlers.onCopy = p.onCopy
    if (p.onCut) handlers.onCut = p.onCut
    if (p.onPaste) handlers.onPaste = p.onPaste
  }
  return (handlers.onCopy || handlers.onCut || handlers.onPaste) ? handlers : null
}

// ── Shared view hook ──

export interface UseAriaViewOptions {
  engine: CommandEngine
  store: NormalizedData
  behavior: AriaPattern
  plugins?: Plugin[]
  keyMap?: Record<string, KeyMapHandler>
  onActivate?: (nodeId: string) => void
  focusedId: string
  selectedIdSet: Set<string>
  expandedIds: string[]
  nodeIdAttr?: string
  isKeyMapOnly?: boolean
  autoFocus?: boolean
  disabled?: boolean
}

export interface UseAriaViewReturn {
  getNodeProps: (id: string) => Record<string, unknown>
  getNodeState: (id: string) => NodeState
  containerProps: Record<string, unknown>
  behaviorCtxOptions: { expandable?: boolean; selectionMode?: string; colCount?: number; valueRange?: { min: number; max: number; step?: number }; visibilityFilters?: import('../engine/types').VisibilityFilter[] }
}

export function useAriaView(options: UseAriaViewOptions): UseAriaViewReturn {
  const {
    engine, store, behavior, plugins = [], keyMap: keyMapOverrides,
    onActivate, focusedId, selectedIdSet, expandedIds,
    nodeIdAttr = 'data-node-id', isKeyMapOnly = false, autoFocus = true,
    disabled = false,
  } = options

  const onActivateRef = useRef(onActivate)
  useEffect(() => { onActivateRef.current = onActivate })

  // ── Plugin handlers ──

  const { pluginKeyMaps, pluginUnhandledKeyHandlers, pluginClipboardHandlers } = useMemo(() => ({
    pluginKeyMaps: collectPluginKeyMaps(plugins),
    pluginUnhandledKeyHandlers: collectPluginUnhandledKeyHandlers(plugins),
    pluginClipboardHandlers: collectPluginClipboardHandlers(plugins),
  }), [plugins])

  const mergedKeyMap = useMemo(
    () => ({ ...behavior.keyMap, ...pluginKeyMaps, ...keyMapOverrides }),
    [behavior.keyMap, pluginKeyMaps, keyMapOverrides],
  )

  // ── Behavior context options ──

  // Collect visibility filters from behavior (axes) + plugins
  const allVisibilityFilters = useMemo(() => {
    const filters = [...(behavior.visibilityFilters ?? [])]
    // expandTracking/expandable without explicit expand axis → add expand filter
    if ((behavior.expandTracking || behavior.expandable) && !filters.some(f => f.shouldDescend)) {
      filters.push(expandVisibilityFilter)
    }
    for (const p of plugins) {
      if (p.visibilityFilter) filters.push(p.visibilityFilter)
    }
    return filters.length > 0 ? filters : undefined
  }, [behavior.visibilityFilters, behavior.expandTracking, behavior.expandable, plugins])

  const behaviorCtxOptions = useMemo(
    () => ({
      expandable: behavior.expandable,
      selectionMode: behavior.selectionMode,
      colCount: behavior.colCount,
      valueRange: behavior.valueRange,
      visibilityFilters: allVisibilityFilters,
    }),
    [behavior.expandable, behavior.selectionMode, behavior.colCount, behavior.valueRange, allVisibilityFilters],
  )

  // ── getNodeState ──

  const expandedIdSet = useMemo(() => new Set(expandedIds), [expandedIds])
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
        expanded: isExpandable ? expandedIdSet.has(id) : undefined,
        level: level + 1,
        renaming,
        ...(behavior.valueRange && { valueCurrent: (valueMeta?.value as number) ?? behavior.valueRange.min }),
      }
    },
    [store, focusedId, selectedIdSet, expandedIdSet, behavior.expandable, renameEntity, valueMeta, behavior.valueRange],
  )

  // ── Event handlers ──

  const handleClipboardEvent = useCallback(
    (event: ClipboardEvent) => {
      if (event.defaultPrevented) return
      if (!pluginClipboardHandlers) return
      if (isEditableElement(event.target as Element)) return

      const ctx = createPatternContext(engine, behaviorCtxOptions)
      let handler: ClipboardHandler | undefined
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

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const matchedKey = findMatchingKey(event, mergedKeyMap)
      if (matchedKey) {
        const ctx = createPatternContext(engine, behaviorCtxOptions)
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

  // ── getNodeProps ──

  const getNodeProps = useCallback(
    (id: string): Record<string, unknown> => {
      if (isKeyMapOnly) return {}
      const state = getNodeState(id)
      const entity = getEntity(store, id) ?? { id }
      const ariaAttrs = behavior.ariaAttributes(entity, state)
      const isActivedescendant = behavior.focusStrategy.type === 'aria-activedescendant'

      const baseProps: Record<string, unknown> = {
        role: behavior.childRole ?? 'row',
        [nodeIdAttr]: id,
        ...ariaAttrs,
      }

      if (state.focused) baseProps['data-focused'] = ''

      baseProps.onClick = (event: MouseEvent) => {
        if (event.defaultPrevented) return
        // Guard against bubbled clicks from nested treeitems
        const target = event.target as HTMLElement
        const closestItem = target.closest(`[${nodeIdAttr}]`)
        if (closestItem && closestItem !== (event.currentTarget as HTMLElement)) return
        if (behavior.activateOnClick) {
          const hasModifier = event.shiftKey || event.ctrlKey || event.metaKey
          if (hasModifier) return
          if (onActivateRef.current) {
            // ② 2026-03-26-treeview-click-expand-prd.md
            if (behavior.expandOnParentClick !== false) {
              const children = getChildren(engine.getStore(), id)
              if (children.length > 0) {
                engine.dispatch(expandCommands.toggleExpand(id))
              }
            }
            onActivateRef.current(id)
          } else {
            const ctx = createPatternContext(engine, behaviorCtxOptions)
            const command = ctx.activate()
            if (command) engine.dispatch(command)
          }
        }
      }

      baseProps.onFocus = (event: FocusEvent) => {
        if (event.target !== event.currentTarget) {
          const target = event.target as HTMLElement
          // Allow focus from non-item children (e.g. gridcells),
          // but ignore focus from nested node-items.
          if (target.closest(`[${nodeIdAttr}]`) !== event.currentTarget) return
        }
        if (id !== focusedId) {
          engine.dispatch(focusCommands.setFocus(id))
        }
      }

      if (!isActivedescendant) {
        baseProps.tabIndex = behavior.focusStrategy.type === 'natural-tab-order' ? 0 : (id === focusedId ? 0 : -1)
        baseProps.onKeyDown = (event: KeyboardEvent) => {
          if (event.defaultPrevented) return
          if (event.target !== event.currentTarget) {
            const target = event.target as HTMLElement
            // Allow bubbled events from non-item children (e.g. gridcells),
            // but reject events from nested node-items (separate keyboard owners).
            if (target.closest(`[${nodeIdAttr}]`) !== event.currentTarget) return
            // Don't intercept keys meant for editable children (contentEditable, input).
            if (isEditableElement(target)) return
          }
          handleKeyDown(event)
        }
      }

      return baseProps
    },
    [store, behavior, isKeyMapOnly, engine, focusedId, getNodeState, handleKeyDown, behaviorCtxOptions, nodeIdAttr],
  )

  // ── containerProps ──

  const containerProps = useMemo((): Record<string, unknown> => {
    if (disabled) {
      return { inert: true }
    }
    const clipboardProps: Record<string, unknown> = pluginClipboardHandlers
      ? { onCopy: handleClipboardEvent, onCut: handleClipboardEvent, onPaste: handleClipboardEvent }
      : {}
    if (isKeyMapOnly) {
      return {
        onKeyDown: (event: KeyboardEvent) => {
          if (event.defaultPrevented) return
          handleKeyDown(event)
        },
        ...clipboardProps,
      }
    }
    if (behavior.focusStrategy.type !== 'aria-activedescendant') {
      return {
        tabIndex: -1,
        onPointerDown: (event: PointerEvent) => {
          if (!focusedId) return
          const target = event.target as HTMLElement
          const container = event.currentTarget as HTMLElement
          // Nested guard: if click landed inside a deeper aria-container, let that one handle it
          if (target.closest('[data-aria-container]') !== container) return
          // If click was on an Item, onFocus will handle it
          if (target.closest(`[${nodeIdAttr}]`)) return
          // preventDefault stops browser from focusing the tabIndex=-1 container
          event.preventDefault()
          const el = container.querySelector<HTMLElement>(`[${nodeIdAttr}="${focusedId}"]`)
          if (el) el.focus()
        },
        ...clipboardProps,
      }
    }
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
  }, [disabled, isKeyMapOnly, behavior.focusStrategy.type, focusedId, handleKeyDown, pluginClipboardHandlers, handleClipboardEvent, nodeIdAttr])

  // ── DOM focus sync ──

  useEffect(() => {
    if (disabled) return
    if (isKeyMapOnly) return
    if (!focusedId) return
    if (behavior.focusStrategy.type === 'aria-activedescendant') return
    const el = document.querySelector<HTMLElement>(`[${nodeIdAttr}="${focusedId}"]`)
    if (!el || el === document.activeElement) return
    const container = el.closest('[data-aria-container]')
    const ownsActiveFocus = container?.contains(document.activeElement)
    const focusIsOrphaned = document.activeElement === document.body || document.activeElement === null
    if (!ownsActiveFocus && !focusIsOrphaned) return
    if (focusIsOrphaned && !autoFocus) return
    // Don't steal focus from editable elements inside the container (e.g., search input)
    if (ownsActiveFocus && isEditableElement(document.activeElement as Element)) return
    el.focus({ preventScroll: false })
  }, [disabled, isKeyMapOnly, focusedId, behavior.focusStrategy.type, nodeIdAttr, autoFocus])

  return { getNodeProps, getNodeState, containerProps, behaviorCtxOptions }
}
