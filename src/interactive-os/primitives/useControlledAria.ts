import { useCallback, useEffect, useMemo } from 'react'
import type { Command } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { AriaPattern, NodeState } from '../pattern/types'
import type { CommandEngine } from '../engine/createCommandEngine'
import { getChildren, getParent, getEntity } from '../store/createStore'
import { focusCommands } from '../axis/navigate'
import { createPatternContext } from '../pattern/createPatternContext'
import { findMatchingKey } from './useKeyboard'
import type { UseAriaReturn } from './useAria'

export interface UseControlledAriaOptions {
  pattern: AriaPattern
  store: NormalizedData
  plugins?: Plugin[]
  onDispatch: (command: Command) => void
}

export function useControlledAria(options: UseControlledAriaOptions): UseAriaReturn {
  const { pattern, store, onDispatch } = options

  // Minimal virtual engine adapter — no internal state
  const virtualEngine = useMemo<CommandEngine>(
    () => ({
      dispatch: onDispatch,
      getStore: () => store,
      syncStore: () => { /* no-op for controlled mode */ },
      inspect: () => ({ commands: [], keyMap: {}, plugins: [], state: store, extras: {} }),
      setInspectKeyMap: () => { /* no-op for controlled mode */ },
      setInspectRole: () => { /* no-op for controlled mode */ },
      setInspectPattern: () => { /* no-op for controlled mode */ },
      subscribe: () => () => { /* no-op for controlled mode */ },
      emitUnhandledKey: () => { /* no-op for controlled mode */ },
    }),
    // Re-create whenever store or onDispatch changes so the engine always
    // reflects the latest props.
    [store, onDispatch]
  )

  const focusedId = (store.entities['__focus__']?.focusedId as string) ?? ''

  const selectedIdSet = useMemo(() => {
    const ids = (store.entities['__selection__']?.selectedIds as string[]) ?? []
    return new Set(ids)
  }, [store])

  const selectedIds = useMemo(() => Array.from(selectedIdSet), [selectedIdSet])

  const dispatch = useCallback(
    (command: Command) => onDispatch(command),
    [onDispatch]
  )

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
      while (true) {
        const parent = getParent(store, current)
        if (!parent || parent === ROOT_ID) break
        level++
        current = parent
      }

      const state: NodeState = {
        focused: id === focusedId,
        selected: selectedIdSet.has(id),
        disabled: false,
        index: siblings.indexOf(id),
        siblingCount: siblings.length,
        level: level + 1,
      }

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
    [store, focusedId, selectedIdSet, pattern.stateGens, patternMeta, pattern.panelRole, pattern.panelVisibility]
  )

  const patternCtxOptions = useMemo(
    () => ({
      visibilityFilters: pattern.visibilityFilters,
      ctxFactories: pattern.ctxFactories,
    }),
    [pattern.visibilityFilters, pattern.ctxFactories]
  )

  const mergedKeyMap = useMemo(
    () => ({ ...pattern.keyMap }),
    [pattern.keyMap]
  )

  const getNodeProps = useCallback(
    (id: string): Record<string, unknown> => {
      const state = getNodeState(id)
      const entity = getEntity(store, id) ?? { id }
      const resolvedRole = typeof pattern.childRole === 'function'
        ? pattern.childRole(entity, state)
        : (pattern.childRole ?? '')

      // Axis-declared ARIA (OCP)
      const autoAria: Record<string, string> = {}
      for (const gen of pattern.ariaGens ?? []) {
        Object.assign(autoAria, gen(state as Record<string, unknown>, entity as Record<string, unknown>, resolvedRole))
      }
      if (state.siblingCount > 1) {
        autoAria['aria-posinset'] = String(state.index + 1)
        autoAria['aria-setsize'] = String(state.siblingCount)
      }

      const ariaAttrs = pattern.ariaAttributes?.(entity, state)
      const isActivedescendant = pattern.focusStrategy.type === 'aria-activedescendant'

      const baseProps: Record<string, unknown> = {
        role: resolvedRole || 'row',
        'data-node-id': id,
        ...autoAria,
        ...ariaAttrs,
        onClick: () => {
          if (pattern.clickMap?.['Click']) {
            const ctx = createPatternContext(virtualEngine, patternCtxOptions)
            const command = pattern.clickMap['Click'](ctx)
            if (command) onDispatch(command)
          }
        },
        onFocus: () => {
          if (id !== focusedId) {
            onDispatch(focusCommands.setFocus(id))
          }
        },
      }

      if (!isActivedescendant) {
        baseProps.tabIndex = pattern.focusStrategy.type === 'natural-tab-order' ? 0 : (id === focusedId ? 0 : -1)
        baseProps.onKeyDown = (event: KeyboardEvent) => {
          const matchedKey = findMatchingKey(event, mergedKeyMap)
          const handler = matchedKey
            ? mergedKeyMap[matchedKey]
            : (pattern.trapModifiers || (!event.ctrlKey && !event.altKey && !event.metaKey) ? pattern.fallbackKey : undefined)
          if (!handler) return
          const ctx = createPatternContext(virtualEngine, patternCtxOptions)
          const command = handler(ctx)
          if (command) onDispatch(command)
          event.preventDefault()
        }
      }

      return baseProps
    },
    [store, pattern, mergedKeyMap, virtualEngine, focusedId, getNodeState, patternCtxOptions, onDispatch]
  )

  const containerProps = useMemo((): Record<string, unknown> => {
    if (pattern.focusStrategy.type !== 'aria-activedescendant') return { tabIndex: -1 }
    return {
      tabIndex: 0,
      'aria-activedescendant': focusedId || undefined,
      onKeyDown: (event: KeyboardEvent) => {
        const matchedKey = findMatchingKey(event, mergedKeyMap)
        const handler = matchedKey
          ? mergedKeyMap[matchedKey]
          : (pattern.trapModifiers || (!event.ctrlKey && !event.altKey && !event.metaKey) ? pattern.fallbackKey : undefined)
        if (!handler) return
        const ctx = createPatternContext(virtualEngine, patternCtxOptions)
        const command = handler(ctx)
        if (command) onDispatch(command)
        event.preventDefault()
      },
    }
  }, [pattern.focusStrategy.type, pattern.fallbackKey, focusedId, mergedKeyMap, virtualEngine, patternCtxOptions, onDispatch])

  // Sync DOM focus with data focus (skip for aria-activedescendant — container holds focus)
  // Only move DOM focus if this widget already owns it (prevents stealing focus from other widgets)
  useEffect(() => {
    if (!focusedId) return
    if (pattern.focusStrategy.type === 'aria-activedescendant') return
    const el = document.querySelector<HTMLElement>(`[data-node-id="${focusedId}"]`)
    if (!el || el === document.activeElement) return
    const container = el.closest(`[role="${pattern.role}"]`)
    if (!container?.contains(document.activeElement)) return
    el.focus({ preventScroll: false })
  }, [focusedId, pattern.focusStrategy.type, pattern.role])

  return {
    dispatch,
    getNodeProps,
    getNodeState,
    focused: focusedId,
    selected: selectedIds,
    getStore: () => store,
    inspect: () => virtualEngine.inspect(),
    containerProps,
  }
}
