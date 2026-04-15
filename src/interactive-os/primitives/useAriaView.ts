import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { Command, VisibilityFilter } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { AriaPattern, NodeState } from '../pattern/types'
import type { CommandEngine } from '../engine/createCommandEngine'
import { getChildren, getParent, getEntity } from '../store/createStore'
import { focusCommands } from '../axis/navigate'
import { RENAME_ID } from '../plugins/rename'
import { createPatternContext } from '../pattern/createPatternContext'
import { findMatchingKey } from './useKeyboard'
import { isEditableElement, dispatchKeyAction } from './keymapHelpers'
import { useSpatialBridge } from './useSpatialBridge'
import { getSerializedText, setExternalClipboard, hasDeserialize } from '../plugins/clipboard'
import { key, type KeyHandler, type CtxFactory } from '../axis/types'

type ClipboardHandler = (ctx: ReturnType<typeof createPatternContext>) => Command | void

function wrapWithOriginal(inner: KeyHandler, outer: KeyHandler): KeyHandler {
  const merged = [...new Set([...inner.commands, ...outer.commands])]
  return key(merged, (ctx) => outer(ctx, () => inner(ctx)))
}

// ── Plugin handler extraction (pure) ──

export function collectPluginKeyMaps(plugins: Plugin[]): Record<string, KeyHandler> | undefined {
  if (!plugins.length) return undefined
  const merged: Record<string, KeyHandler> = {}
  for (const p of plugins) {
    if (p.keyMap) {
      for (const [k, handler] of Object.entries(p.keyMap)) {
        const prev = merged[k]
        merged[k] = prev ? wrapWithOriginal(prev, handler) : handler
      }
    }
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
  pattern: AriaPattern
  plugins?: Plugin[]
  keyMap?: Record<string, KeyHandler>
  onActivate?: (nodeId: string) => void
  focusedId: string
  selectedIdSet: Set<string>
  nodeIdAttr?: string
  isKeyMapOnly?: boolean
  autoFocus?: boolean
  disabled?: boolean
  /** Container ref for scoping DOM queries (e.g. focus sync) */
  containerRef?: React.RefObject<HTMLElement | null>
}

export interface UseAriaViewReturn {
  getNodeProps: (id: string) => Record<string, unknown>
  getNodeState: (id: string) => NodeState
  containerProps: Record<string, unknown>
  patternCtxOptions: { visibilityFilters?: VisibilityFilter[]; ctxFactories?: CtxFactory[] }
  observedEngine: CommandEngine
}

export function useAriaView(options: UseAriaViewOptions): UseAriaViewReturn {
  const {
    engine, store, pattern, plugins = [], keyMap: keyMapOverrides,
    onActivate, focusedId, selectedIdSet,
    nodeIdAttr = 'data-node-id', isKeyMapOnly = false, autoFocus = true,
    disabled = false, containerRef,
  } = options

  const onActivateRef = useRef(onActivate)
  useEffect(() => { onActivateRef.current = onActivate })

  // Wrap engine dispatch to observe core:activate commands → fire onActivate callback
  const observedEngine = useMemo((): CommandEngine => ({
    ...engine,
    dispatch: (command: Command) => {
      const result = engine.dispatch(command)
      // After dispatch, check for activate in the command (including batch)
      const check = (cmd: Command) => {
        if (cmd.type === 'core:activate') {
          const nodeId = (cmd.payload as { nodeId?: string })?.nodeId
          if (nodeId && onActivateRef.current) onActivateRef.current(nodeId)
        }
        if (cmd.type === '__batch__' && 'commands' in cmd) {
          for (const sub of (cmd as { commands: Command[] }).commands) check(sub)
        }
      }
      check(command)
      return result
    },
  }), [engine])

  // ── Plugin handlers ──

  const { pluginKeyMaps, pluginUnhandledKeyHandlers, pluginClipboardHandlers } = useMemo(() => ({
    pluginKeyMaps: collectPluginKeyMaps(plugins),
    pluginUnhandledKeyHandlers: collectPluginUnhandledKeyHandlers(plugins),
    pluginClipboardHandlers: collectPluginClipboardHandlers(plugins),
  }), [plugins])

  const mergedKeyMap = useMemo(() => {
    const base: Record<string, KeyHandler> = { ...pattern.keyMap }
    if (pluginKeyMaps) {
      for (const [k, handler] of Object.entries(pluginKeyMaps)) {
        const patternHandler = base[k]
        base[k] = patternHandler ? wrapWithOriginal(patternHandler, handler) : handler
      }
    }
    if (keyMapOverrides) Object.assign(base, keyMapOverrides)
    return base
  }, [pattern.keyMap, pluginKeyMaps, keyMapOverrides])

  // ── Behavior context options ──

  // Collect visibility filters from pattern (axes) + plugins
  const allVisibilityFilters = useMemo(() => {
    const filters = [...(pattern.visibilityFilters ?? [])]
    for (const p of plugins) {
      if (p.visibilityFilter) filters.push(p.visibilityFilter)
    }
    return filters.length > 0 ? filters : undefined
  }, [pattern.visibilityFilters, plugins])

  // ── Spatial bridge (always called — hooks rules) ──
  const spatialSelector = pattern.spatialSelector as string | (() => string) | undefined
  const spatialCtxFactory = useSpatialBridge(spatialSelector, nodeIdAttr)

  const patternCtxOptions = useMemo(
    () => ({
      visibilityFilters: allVisibilityFilters,
      ctxFactories: spatialCtxFactory
        ? [...(pattern.ctxFactories ?? []), spatialCtxFactory]
        : pattern.ctxFactories,
    }),
    [allVisibilityFilters, pattern.ctxFactories, spatialCtxFactory],
  )

  // ── getNodeState (OCP — axes declare stateGen, no if-else) ──

  const renameEntity = store.entities[RENAME_ID]

  // Collect pattern meta for stateGen context
  const patternMeta = useMemo((): Record<string, unknown> => ({
    expandable: pattern.expandable,
    panelVisibility: pattern.panelVisibility,
    popupType: pattern.popupType,
    selectionMode: pattern.selectionMode,
    colCount: pattern.colCount,
  }), [pattern.expandable, pattern.panelVisibility, pattern.popupType, pattern.selectionMode, pattern.colCount])

  const getNodeState = useCallback(
    (id: string): NodeState => {
      const parentId = getParent(store, id)
      const siblings = parentId ? getChildren(store, parentId) : []
      const children = getChildren(store, id)

      let level = 0
      let current = id
      let _levelGuard = 0
      while (true) {
        _levelGuard++
        if (_levelGuard > 100) { console.error('[useAriaView] getNodeState level loop, id:', id); break }
        const parent = getParent(store, current)
        if (!parent || parent === ROOT_ID) break
        level++
        current = parent
      }

      const renaming = !!(renameEntity?.active && renameEntity?.nodeId === id)

      // Base state — infrastructure, always present
      const state: NodeState = {
        focused: id === focusedId,
        selected: selectedIdSet.has(id),
        disabled: false,
        index: siblings.indexOf(id),
        siblingCount: siblings.length,
        level: level + 1,
        renaming,
      }

      // Axis-contributed state — each axis populates its own fields (OCP)
      for (const gen of pattern.stateGens ?? []) {
        Object.assign(state, gen(id, store, children, patternMeta))
      }

      // Slot props — when pattern declares panelRole, generate ARIA attributes for slot container
      if (pattern.panelRole) {
        const isVisible = pattern.panelVisibility === 'selected' ? state.selected
          : pattern.panelVisibility === 'expanded' ? state.expanded
          : false
        state.slotProps = {
          role: pattern.panelRole,
          id: `panel-${id}`,
          'aria-labelledby': id,
          ...(isVisible ? {} : { hidden: true }),
        }
      }

      return state
    },
    [store, focusedId, selectedIdSet, renameEntity, pattern.stateGens, patternMeta, pattern.panelRole, pattern.panelVisibility],
  )

  // ── Event handlers ──

  // ② 2026-04-04-clipboard-serialize-prd.md
  const handleClipboardEvent = useCallback(
    (event: ClipboardEvent) => {
      if (event.defaultPrevented) return
      if (!pluginClipboardHandlers) return
      if (isEditableElement(event.target as Element)) return

      const ctx = createPatternContext(observedEngine, patternCtxOptions)
      const isPaste = event.type === 'paste'

      // Paste: inject external clipboard text before dispatching
      if (isPaste && hasDeserialize()) {
        const externalText = event.clipboardData?.getData('text/plain') ?? ''
        const lastSerialized = getSerializedText()
        if (externalText && externalText !== lastSerialized) {
          setExternalClipboard(externalText)
        }
      }

      let handler: ClipboardHandler | undefined
      switch (event.type) {
        case 'copy': handler = pluginClipboardHandlers.onCopy; break
        case 'cut': handler = pluginClipboardHandlers.onCut; break
        case 'paste': handler = pluginClipboardHandlers.onPaste; break
      }
      if (!handler) return
      const command = handler(ctx)
      if (command) {
        observedEngine.dispatch(command)

        // Copy/Cut: write serialized text to system clipboard
        if (!isPaste) {
          const text = getSerializedText()
          if (text && event.clipboardData) {
            event.clipboardData.setData('text/plain', text)
          }
        }

        event.preventDefault()
      }
    },
    [pluginClipboardHandlers, observedEngine, patternCtxOptions],
  )

  const handleKeyDown = useCallback(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    (event: KeyboardEvent) => {
      const matchedKey = findMatchingKey(event, mergedKeyMap)
      if (matchedKey) {
        const ctx = createPatternContext(observedEngine, patternCtxOptions)
        const handler = mergedKeyMap[matchedKey]
        if (!handler) return
        const handled = dispatchKeyAction(ctx, handler, observedEngine)
        if (handled) event.preventDefault()
      } else if (pattern.fallbackKey && (pattern.trapModifiers || (!event.ctrlKey && !event.altKey && !event.metaKey))) {
        const ctx = createPatternContext(observedEngine, patternCtxOptions)
        const handled = dispatchKeyAction(ctx, pattern.fallbackKey, observedEngine)
        if (handled) event.preventDefault()
      } else {
        let handled = false
        if (pluginUnhandledKeyHandlers) {
          for (const h of pluginUnhandledKeyHandlers) {
            if (h(event, observedEngine)) {
              event.preventDefault()
              handled = true
              break
            }
          }
        }
        if (!handled) {
          observedEngine.emitUnhandledKey(event)
        }
      }
    },
    [mergedKeyMap, observedEngine, patternCtxOptions, pluginUnhandledKeyHandlers, pattern.fallbackKey],
  )

  // ── getNodeProps ──

  const getNodeProps = useCallback(
    (id: string): Record<string, unknown> => {
      if (isKeyMapOnly) return {}
      const state = getNodeState(id)
      const entity = getEntity(store, id) ?? { id }
      const resolvedRole = typeof pattern.childRole === 'function'
        ? pattern.childRole(entity, state)
        : (pattern.childRole ?? '')

      // Axis-declared ARIA — each axis generates its own aria-* attributes (OCP)
      const autoAria: Record<string, string> = {}
      for (const gen of pattern.ariaGens ?? []) {
        Object.assign(autoAria, gen(state as Record<string, unknown>, entity as Record<string, unknown>, resolvedRole))
      }

      // Structural ARIA — universal, not axis-specific
      if (state.siblingCount > 1) {
        autoAria['aria-posinset'] = String(state.index + 1)
        autoAria['aria-setsize'] = String(state.siblingCount)
      }
      const label = (entity.data as Record<string, unknown>)?.label
      if (typeof label === 'string' && label) autoAria['aria-label'] = label

      const ariaAttrs = pattern.ariaAttributes?.(entity, state)
      const isActivedescendant = pattern.focusStrategy.type === 'aria-activedescendant'

      const baseProps: Record<string, unknown> = {
        role: typeof pattern.childRole === 'function'
          ? pattern.childRole(entity, state)
          : (pattern.childRole ?? 'row'),
        [nodeIdAttr]: id,
        ...autoAria,
        ...ariaAttrs,
      }

      if (state.focused) baseProps['data-focused'] = ''

      baseProps.onFocus = (event: FocusEvent) => {
        if (event.target !== event.currentTarget) {
          const target = event.target as HTMLElement
          // Allow focus from non-item children (e.g. gridcells),
          // but ignore focus from nested node-items.
          if (target.closest(`[${nodeIdAttr}]`) !== event.currentTarget) return
        }
        if (id !== focusedId) {
          observedEngine.dispatch(focusCommands.setFocus(id))
        }
      }

      if (!isActivedescendant) {
        baseProps.tabIndex = pattern.focusStrategy.type === 'natural-tab-order' ? 0 : (id === focusedId ? 0 : -1)
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
    [store, pattern, isKeyMapOnly, observedEngine, focusedId, getNodeState, handleKeyDown, patternCtxOptions, nodeIdAttr],
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
    if (pattern.focusStrategy.type !== 'aria-activedescendant') {
      return {
        tabIndex: -1,
        onPointerDown: (event: PointerEvent) => {
          if (!focusedId) return
          const target = event.target as HTMLElement
          const container = event.currentTarget as HTMLElement
          // Nested guard: if click landed inside a deeper aria-container, let that one handle it
          if (target.closest('.ax-interactive') !== container) return
          // If click was on an Item, onFocus will handle it
          if (target.closest(`[${nodeIdAttr}]`)) return
          // If click was inside a Panel (region/tabpanel), let native focus work
          if (target.closest('[role="region"], [role="tabpanel"]')) return
          // If click was inside a selectable content area, let native text selection work
          if (target.closest('.select-text')) return
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
  }, [disabled, isKeyMapOnly, pattern.focusStrategy.type, focusedId, handleKeyDown, pluginClipboardHandlers, handleClipboardEvent, nodeIdAttr])

  // ── DOM focus sync ──

  useEffect(() => {
    if (disabled) return
    if (isKeyMapOnly) return
    if (!focusedId) return
    if (pattern.focusStrategy.type === 'aria-activedescendant') return
    // Scope querySelector to own container to avoid cross-instance node-id collisions
    const scope = containerRef?.current ?? document
    const el = scope.querySelector<HTMLElement>(`[${nodeIdAttr}="${focusedId}"]`)
    if (!el || el === document.activeElement) return
    const container = el.closest('.ax-interactive')
    const ownsActiveFocus = container?.contains(document.activeElement)
    const focusIsOrphaned = document.activeElement === document.body || document.activeElement === null
    if (!ownsActiveFocus && !focusIsOrphaned) return
    if (focusIsOrphaned && !autoFocus) return
    // Don't steal focus from editable elements inside the container (e.g., search input)
    if (ownsActiveFocus && isEditableElement(document.activeElement as Element)) return
    el.focus({ preventScroll: false })
  }, [disabled, isKeyMapOnly, focusedId, pattern.focusStrategy.type, nodeIdAttr, autoFocus, containerRef])

  // Feed pattern role into engine.inspect()
  useMemo(() => {
    const resolvedChildRole = typeof pattern.childRole === 'string' ? pattern.childRole : undefined
    engine.setInspectRole(pattern.role, resolvedChildRole)
  }, [pattern.role, pattern.childRole, engine])

  // ② 2026-04-04-inspector-zone-keymap-prd.md — feed keyMap description into engine.inspect()
  useMemo(() => {
    const desc: Record<string, import('../engine/types').KeyMapEntry> = {}
    for (const [k, handler] of Object.entries(pattern.keyMap)) {
      desc[k] = { owner: 'pattern', command: handler.commands.join(' | ') }
    }
    if (pluginKeyMaps) {
      for (const [k, handler] of Object.entries(pluginKeyMaps)) {
        if (desc[k]) {
          desc[k] = { ...desc[k]!, owner: `${desc[k]!.owner} + plugin`, command: handler.commands.join(' | ') }
        } else {
          desc[k] = { owner: 'plugin', command: handler.commands.join(' | ') }
        }
      }
    }
    if (keyMapOverrides) {
      for (const [k, handler] of Object.entries(keyMapOverrides)) {
        desc[k] = { owner: 'override', command: handler.commands.join(' | ') }
      }
    }
    engine.setInspectKeyMap(desc)
  }, [pattern.keyMap, pluginKeyMaps, keyMapOverrides, engine])

  // ② 2026-04-05-inspector-aria-xray-prd.md — feed pattern info for node-level ARIA x-ray
  useMemo(() => {
    engine.setInspectPattern({
      childRole: pattern.childRole,
      ariaGens: pattern.ariaGens,
      stateGens: pattern.stateGens,
      ariaAttributes: pattern.ariaAttributes,
      expandable: pattern.expandable,
      panelVisibility: pattern.panelVisibility,
      popupType: pattern.popupType,
      selectionMode: pattern.selectionMode,
      colCount: pattern.colCount,
      panelRole: pattern.panelRole,
    })
  }, [engine, pattern.childRole, pattern.ariaGens, pattern.stateGens, pattern.ariaAttributes, pattern.expandable, pattern.panelVisibility, pattern.popupType, pattern.selectionMode, pattern.colCount, pattern.panelRole])

  return { getNodeProps, getNodeState, containerProps, patternCtxOptions, observedEngine }
}
