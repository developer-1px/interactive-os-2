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
  behavior: AriaPattern
  store: NormalizedData
  plugins?: Plugin[]
  onDispatch: (command: Command) => void
}

export function useControlledAria(options: UseControlledAriaOptions): UseAriaReturn {
  const { behavior, store, onDispatch } = options

  // Minimal virtual engine adapter — no internal state
  const virtualEngine = useMemo<CommandEngine>(
    () => ({
      dispatch: onDispatch,
      getStore: () => store,
      syncStore: () => { /* no-op for controlled mode */ },
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

  const expandedIds = useMemo(
    () => (store.entities['__expanded__']?.expandedIds as string[]) ?? [],
    [store]
  )

  const dispatch = useCallback(
    (command: Command) => onDispatch(command),
    [onDispatch]
  )

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
    [store, focusedId, selectedIdSet, expandedIds, behavior.expandable]
  )

  const behaviorCtxOptions = useMemo(
    () => ({
      expandable: behavior.expandable,
      selectionMode: behavior.selectionMode,
      colCount: behavior.colCount,
    }),
    [behavior.expandable, behavior.selectionMode, behavior.colCount]
  )

  const mergedKeyMap = useMemo(
    () => ({ ...behavior.keyMap }),
    [behavior.keyMap]
  )

  const getNodeProps = useCallback(
    (id: string): Record<string, unknown> => {
      const state = getNodeState(id)
      const entity = getEntity(store, id) ?? { id }
      const ariaAttrs = behavior.ariaAttributes(entity, state)
      const isActivedescendant = behavior.focusStrategy.type === 'aria-activedescendant'

      const baseProps: Record<string, unknown> = {
        role: behavior.childRole ?? 'row',
        'data-node-id': id,
        ...ariaAttrs,
        onClick: () => {
          if (behavior.activateOnClick) {
            const ctx = createPatternContext(virtualEngine, behaviorCtxOptions)
            const command = ctx.activate()
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
        baseProps.tabIndex = behavior.focusStrategy.type === 'natural-tab-order' ? 0 : (id === focusedId ? 0 : -1)
        baseProps.onKeyDown = (event: KeyboardEvent) => {
          const matchedKey = findMatchingKey(event, mergedKeyMap)
          if (!matchedKey) return
          const ctx = createPatternContext(virtualEngine, behaviorCtxOptions)
          const handler = mergedKeyMap[matchedKey]
          if (!handler) return
          const command = handler(ctx)
          if (command) onDispatch(command)
          event.preventDefault()
        }
      }

      return baseProps
    },
    [store, behavior, mergedKeyMap, virtualEngine, focusedId, getNodeState, behaviorCtxOptions, onDispatch]
  )

  const containerProps = useMemo((): Record<string, unknown> => {
    if (behavior.focusStrategy.type !== 'aria-activedescendant') return { tabIndex: -1 }
    return {
      tabIndex: 0,
      'aria-activedescendant': focusedId || undefined,
      onKeyDown: (event: KeyboardEvent) => {
        const matchedKey = findMatchingKey(event, mergedKeyMap)
        if (!matchedKey) return
        const ctx = createPatternContext(virtualEngine, behaviorCtxOptions)
        const handler = mergedKeyMap[matchedKey]
        if (!handler) return
        const command = handler(ctx)
        if (command) onDispatch(command)
        event.preventDefault()
      },
    }
  }, [behavior.focusStrategy.type, focusedId, mergedKeyMap, virtualEngine, behaviorCtxOptions, onDispatch])

  // Sync DOM focus with data focus (skip for aria-activedescendant — container holds focus)
  // Only move DOM focus if this widget already owns it (prevents stealing focus from other widgets)
  useEffect(() => {
    if (!focusedId) return
    if (behavior.focusStrategy.type === 'aria-activedescendant') return
    const el = document.querySelector<HTMLElement>(`[data-node-id="${focusedId}"]`)
    if (!el || el === document.activeElement) return
    const container = el.closest(`[role="${behavior.role}"]`)
    if (!container?.contains(document.activeElement)) return
    el.focus({ preventScroll: false })
  }, [focusedId, behavior.focusStrategy.type, behavior.role])

  return {
    dispatch,
    getNodeProps,
    getNodeState,
    focused: focusedId,
    selected: selectedIds,
    getStore: () => store,
    containerProps,
  }
}
