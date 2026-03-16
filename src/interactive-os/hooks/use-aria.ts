import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { Command, NormalizedData, Plugin } from '../core/types'
import { ROOT_ID } from '../core/types'
import type { AriaBehavior, NodeState } from '../behaviors/types'
import { createCommandEngine } from '../core/command-engine'
import type { CommandEngine } from '../core/command-engine'
import { getChildren, getParent, getEntity } from '../core/normalized-store'
import { focusCommands } from '../plugins/core'
import { createBehaviorContext } from '../behaviors/create-behavior-context'
import { findMatchingKey } from './use-keyboard'

export interface UseAriaOptions {
  behavior: AriaBehavior
  data: NormalizedData
  plugins?: Plugin[]
  keyMap?: Record<string, (ctx: ReturnType<typeof createBehaviorContext>) => Command | void>
  onChange?: (data: NormalizedData) => void
}

export interface UseAriaReturn {
  dispatch(command: Command): void
  getNodeProps(id: string): Record<string, unknown>
  getNodeState(id: string): NodeState
  focused: string
  selected: string[]
  getStore(): NormalizedData
}

export function useAria(options: UseAriaOptions): UseAriaReturn {
  const { behavior, data, plugins = [], keyMap: keyMapOverrides, onChange } = options
  const [, forceRender] = useState(0)
  const engineRef = useRef<CommandEngine | null>(null)

  if (engineRef.current == null) {
    const middlewares = plugins
      .map((p) => p.middleware)
      .filter((m): m is NonNullable<typeof m> => m != null)

    engineRef.current = createCommandEngine(data, middlewares, (newStore) => {
      onChange?.(newStore)
      forceRender((n) => n + 1)
    })

    const firstVisible = getChildren(data, ROOT_ID)[0]
    if (firstVisible) {
      // eslint-disable-next-line react-hooks/refs
      engineRef.current.dispatch(focusCommands.setFocus(firstVisible))
    }
  }

  const engine = engineRef.current

  const mergedKeyMap = useMemo(
    () => ({ ...behavior.keyMap, ...keyMapOverrides }),
    [behavior.keyMap, keyMapOverrides]
  )

  const dispatch = useCallback(
    (command: Command) => engine.dispatch(command),
    [engine]
  )

  // eslint-disable-next-line react-hooks/refs
  const store = engine.getStore()
  const focusedId = (store.entities['__focus__']?.focusedId as string) ?? ''
  const selectedIds = useMemo(
    () => (store.entities['__selection__']?.selectedIds as string[]) ?? [],
    [store]
  )
  const expandedIds = useMemo(
    () => (store.entities['__expanded__']?.expandedIds as string[]) ?? [],
    [store]
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

      return {
        focused: id === focusedId,
        selected: selectedIds.includes(id),
        disabled: false,
        index: siblings.indexOf(id),
        siblingCount: siblings.length,
        expanded: hasChildren ? expandedIds.includes(id) : undefined,
        level: level + 1,
      }
    },
    [store, focusedId, selectedIds, expandedIds]
  )

  const getNodeProps = useCallback(
    (id: string): Record<string, unknown> => {
      const state = getNodeState(id)
      const entity = getEntity(store, id) ?? { id }
      const ariaAttrs = behavior.ariaAttributes(entity, state)

      return {
        role: behavior.childRole ?? 'row',
        tabIndex: id === focusedId ? 0 : -1,
        'data-node-id': id,
        ...ariaAttrs,
        onKeyDown: (event: KeyboardEvent) => {
          const matchedKey = findMatchingKey(event, mergedKeyMap)
          if (!matchedKey) return
          const ctx = createBehaviorContext(engine)
          const handler = mergedKeyMap[matchedKey]
          if (!handler) return
          const command = handler(ctx)
          if (command) engine.dispatch(command)
          event.preventDefault()
        },
        onFocus: () => {
          if (id !== focusedId) {
            engine.dispatch(focusCommands.setFocus(id))
          }
        },
      }
    },
    [store, behavior, mergedKeyMap, engine, focusedId, getNodeState]
  )

  // Sync DOM focus with data focus
  useEffect(() => {
    if (!focusedId) return
    const el = document.querySelector<HTMLElement>(`[data-node-id="${focusedId}"]`)
    if (el && el !== document.activeElement) {
      el.focus({ preventScroll: false })
    }
  }, [focusedId])

  return {
    dispatch,
    getNodeProps,
    getNodeState,
    focused: focusedId,
    selected: selectedIds,
    getStore: () => engine.getStore(),
  }
}
