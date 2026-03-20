import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { Command, NormalizedData, Plugin } from '../core/types'
import { ROOT_ID } from '../core/types'
import type { AriaBehavior, NodeState } from '../behaviors/types'
import { createCommandEngine } from '../core/createCommandEngine'
import type { CommandEngine } from '../core/createCommandEngine'
import { getChildren, getParent, getEntity, getEntityData } from '../core/createStore'
import { focusCommands } from '../plugins/core'
import { RENAME_ID } from '../plugins/rename'
import { createBehaviorContext } from '../behaviors/createBehaviorContext'
import { findMatchingKey } from './useKeyboard'

function isEditableElement(el: Element): boolean {
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true
  if (el.getAttribute('contenteditable') != null) return true
  return false
}

/** Dispatch a keyMap handler, intercepting activate() when onActivate is provided. */
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

export interface UseAriaOptions {
  behavior: AriaBehavior
  data: NormalizedData
  plugins?: Plugin[]
  keyMap?: Record<string, (ctx: ReturnType<typeof createBehaviorContext>) => Command | void>
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  /** Focus this node on mount instead of the first child */
  initialFocus?: string
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
  const { behavior, data, plugins = [], keyMap: keyMapOverrides, onChange, onActivate, initialFocus } = options
  const [, forceRender] = useState(0)
  const engineRef = useRef<CommandEngine | null>(null)
  const onActivateRef = useRef(onActivate)
  onActivateRef.current = onActivate
  const behaviorRef = useRef(behavior)
  behaviorRef.current = behavior
  const prevFocusRef = useRef<string>('')

  if (engineRef.current == null) {
    const middlewares = plugins
      .map((p) => p.middleware)
      .filter((m): m is NonNullable<typeof m> => m != null)

    engineRef.current = createCommandEngine(data, middlewares, (newStore) => {
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
    })

    const focusTarget = (initialFocus && data.entities[initialFocus]) ? initialFocus : getChildren(data, ROOT_ID)[0]
    if (focusTarget) {
      // eslint-disable-next-line react-hooks/refs
      engineRef.current.dispatch(focusCommands.setFocus(focusTarget))
    }
  }

  // eslint-disable-next-line react-hooks/refs
  const engine = engineRef.current

  // Gap 1 fix: sync external data changes into the engine
  // Merge external data while preserving internal meta-entities (__focus__, __selection__, etc.)
  useEffect(() => {
    const currentStore = engine.getStore()
    // Check if content entities actually differ (skip meta-only diffs)
    const contentChanged = data.relationships !== currentStore.relationships ||
      Object.keys(data.entities).some(key => !key.startsWith('__') && data.entities[key] !== currentStore.entities[key]) ||
      Object.keys(currentStore.entities).some(key => !key.startsWith('__') && !(key in data.entities))
    if (!contentChanged) return

    const mergedEntities = { ...data.entities }
    for (const [key, value] of Object.entries(currentStore.entities)) {
      if (key.startsWith('__')) {
        mergedEntities[key] = value
      }
    }
    engine.syncStore({ entities: mergedEntities, relationships: data.relationships })
    forceRender(n => n + 1)
  }, [data, engine])

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
      }
    },
    [store, focusedId, selectedIdSet, expandedIds, behavior.expandable, renameEntity]
  )

  const behaviorCtxOptions = useMemo(
    () => ({
      expandable: behavior.expandable,
      selectionMode: behavior.selectionMode,
      colCount: behavior.colCount,
    }),
    [behavior.expandable, behavior.selectionMode, behavior.colCount]
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
      }

      if (state.focused) baseProps['data-focused'] = ''

      baseProps.onClick = () => {
        if (behavior.activateOnClick) {
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
          // Only handle on the directly focused element, not bubbled from children
          if (event.target !== event.currentTarget) return
          const matchedKey = findMatchingKey(event, mergedKeyMap)
          if (!matchedKey) return
          const ctx = createBehaviorContext(engine, behaviorCtxOptions)
          const handler = mergedKeyMap[matchedKey]
          if (!handler) return
          dispatchKeyAction(ctx, handler, engine, onActivateRef.current)
          event.preventDefault()
        }
      }

      return baseProps
    },
    [store, behavior, mergedKeyMap, engine, focusedId, getNodeState, behaviorCtxOptions]
  )

  const containerProps = useMemo((): Record<string, unknown> => {
    if (behavior.focusStrategy.type !== 'aria-activedescendant') return {}
    return {
      tabIndex: 0,
      'aria-activedescendant': focusedId || undefined,
      onKeyDown: (event: KeyboardEvent) => {
        // Skip keyMap if a child editable element has focus (not the container itself)
        if (event.target !== event.currentTarget && isEditableElement(event.target as Element)) return
        const matchedKey = findMatchingKey(event, mergedKeyMap)
        if (!matchedKey) return
        const ctx = createBehaviorContext(engine, behaviorCtxOptions)
        const handler = mergedKeyMap[matchedKey]
        if (!handler) return
        dispatchKeyAction(ctx, handler, engine, onActivateRef.current)
        event.preventDefault()
      },
    }
  }, [behavior.focusStrategy.type, focusedId, mergedKeyMap, engine, behaviorCtxOptions])

  // Sync DOM focus with data focus (skip for aria-activedescendant — container holds focus)
  // Only move DOM focus if this widget already owns it (prevents stealing focus from other widgets)
  useEffect(() => {
    if (!focusedId) return
    if (behavior.focusStrategy.type === 'aria-activedescendant') return
    const el = document.querySelector<HTMLElement>(`[data-node-id="${focusedId}"]`)
    if (!el || el === document.activeElement) return
    const container = el.closest('[data-aria-container]')
    const ownsActiveFocus = container?.contains(document.activeElement)
    const focusIsOrphaned = document.activeElement === document.body || document.activeElement === null
    if (!ownsActiveFocus && !focusIsOrphaned) return
    el.focus({ preventScroll: false })
  }, [focusedId, behavior.focusStrategy.type, behavior.role])

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
