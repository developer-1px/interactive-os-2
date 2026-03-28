import React, { useRef, useEffect, cloneElement } from 'react'
import type { ReactNode, ReactElement } from 'react'
import type { Command } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { AriaPattern, PatternContext, NodeState } from '../pattern/types'
import { useAria } from './useAria'
import { AriaInternalContext } from './AriaInternalContext'
import { getChildren } from '../store/createStore'
import { focusCommands, FOCUS_ID, GRID_COL_ID } from '../axis/navigate'
import { EXPANDED_ID } from '../axis/expand'
import { renameCommands, RENAME_ID } from '../plugins/rename'
import { registerAria, unregisterAria } from './ariaRegistry'
import { SEARCH_ID, searchCommands, matchesSearchFilter } from '../plugins/search'
import { createPatternContext } from '../pattern/createPatternContext'
import { findMatchingKey } from './useKeyboard'

interface AriaProps {
  id?: string
  pattern?: AriaPattern
  data: NormalizedData
  plugins: Plugin[]
  keyMap?: Record<string, (ctx: PatternContext) => Command | void>
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  'aria-label'?: string
  logger?: import('../engine/dispatchLogger').EngineOptions['logger']
  autoFocus?: boolean
  disabled?: boolean
  children: ReactNode
}

// ② 2026-03-28-aria-item-children-prd.md
interface AriaItemProps {
  ids?: string[]
  asChild?: boolean
  render: (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState, children?: ReactNode) => ReactElement
}

const horizontalStyle = { display: 'flex' } as const

const ROLES_WITH_ORIENTATION = new Set(['listbox', 'menu', 'menubar', 'tablist', 'toolbar', 'treegrid'])

const AriaItemContext = React.createContext<{ nodeId: string; focused: boolean; renaming: boolean } | null>(null)

/** Sentinel to detect whether <Aria.Panel> is a child of <Aria> */
const ARIA_PANEL_TYPE = Symbol('AriaPanel')

function AriaRoot({ id, pattern, data, plugins, keyMap, onChange, onActivate, 'aria-label': ariaLabel, logger, autoFocus, disabled, children }: AriaProps) {
  const aria = useAria({ pattern, data, plugins, keyMap, onChange, onActivate, logger, autoFocus, disabled })

  useEffect(() => {
    if (!id) return
    registerAria(id, { dispatch: aria.dispatch, getStore: aria.getStore })
    return () => unregisterAria(id)
  }, [id, aria.dispatch, aria.getStore])

  const hasPanels = React.Children.toArray(children).some(
    (child) => React.isValidElement(child) && (child.type as { _ariaPanelType?: symbol })._ariaPanelType === ARIA_PANEL_TYPE
  )

  const role = pattern?.role || undefined
  const orientation = pattern?.focusStrategy?.orientation
  return (
    <AriaInternalContext.Provider value={{ ...aria, pattern, hasPanels }}>
      <div
        role={role}
        aria-label={ariaLabel}
        aria-orientation={role && ROLES_WITH_ORIENTATION.has(role) && orientation !== 'both' ? orientation : undefined}
        style={orientation === 'horizontal' ? horizontalStyle : undefined}
        data-aria-container=""
        {...(aria.containerProps as React.HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    </AriaInternalContext.Provider>
  )
}

function useFocusScroll(focused: boolean) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!focused || !ref.current) return
    const container = ref.current.closest('[data-aria-container]')
    if (!container || container.scrollHeight <= container.clientHeight) return
    const itemRect = ref.current.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    if (itemRect.top < containerRect.top) {
      container.scrollTop -= containerRect.top - itemRect.top
    } else if (itemRect.bottom > containerRect.bottom) {
      container.scrollTop += itemRect.bottom - containerRect.bottom
    }
  }, [focused])
  return ref
}

// ② 2026-03-28-aria-item-children-prd.md
function AriaItemNode({ childId, render, children }: { childId: string; render: AriaItemProps['render']; children?: ReactNode }) {
  const aria = React.useContext(AriaInternalContext)
  if (!aria) throw new Error('<Aria.Item> must be inside <Aria>')
  const store = aria.getStore()
  const entity = store.entities[childId]
  const state = entity ? aria.getNodeState(childId) : { focused: false } as ReturnType<typeof aria.getNodeState>
  const scrollRef = useFocusScroll(entity ? state.focused : false)
  if (!entity) return null
  const props = aria.getNodeProps(childId) as React.HTMLAttributes<HTMLElement>

  // ② 2026-03-28-aria-panel-trigger-prd.md — Panel cross-reference
  if (aria.pattern?.panelRole && aria.hasPanels) {
    (props as Record<string, unknown>)['aria-controls'] = `panel-${childId}`
  }

  return (
    <AriaItemContext.Provider value={{ nodeId: childId, focused: state.focused, renaming: !!state.renaming }}>
      {cloneElement(render(props, entity, state, children) as React.ReactElement<Record<string, unknown>>, { key: childId, ref: scrollRef })}
    </AriaItemContext.Provider>
  )
}

function AriaItem({ ids, render }: AriaItemProps) {
  return (
    <AriaInternalContext.Consumer>
      {(aria) => {
        if (!aria) throw new Error('<Aria.Item> must be inside <Aria>')
        const store = aria.getStore()
        const expandEntity = store.entities[EXPANDED_ID]
        // No expand entity → all containers open (matches expand axis shouldDescend)
        const expandedIds = expandEntity ? ((expandEntity.expandedIds as string[]) ?? []) : null

        const searchEntity = store.entities[SEARCH_ID] as Record<string, unknown> | undefined
        const filterText = (searchEntity?.filterText as string) ?? ''

        // ② 2026-03-28-aria-item-children-prd.md
        const renderNodes = (parentId: string): ReactNode[] => {
          const childIds = getChildren(store, parentId)
          const nodes: ReactNode[] = []
          for (const childId of childIds) {
            if (filterText && !matchesSearchFilter(store.entities[childId], filterText)) continue
            if (!store.entities[childId]) continue
            const hasChildren = getChildren(store, childId).length > 0
            const isExpanded = expandedIds === null || expandedIds.includes(childId)

            // Non-expandable container (group): wrap children inside container node
            // expandedIds === null means no expand tracking → always-open groups
            // render.length >= 4: opt-in — only when render callback declares children param
            if (hasChildren && expandedIds === null && render.length >= 4) {
              const childNodes = renderNodes(childId)
              nodes.push(
                <AriaItemNode key={childId} childId={childId} render={render}>
                  {childNodes}
                </AriaItemNode>,
              )
            } else {
              // Leaf, expandable container, or collapsed: flat rendering (existing behavior)
              nodes.push(
                <AriaItemNode key={childId} childId={childId} render={render} />,
              )
              if (hasChildren && isExpanded) {
                nodes.push(...renderNodes(childId))
              }
            }
          }
          return nodes
        }
        // ids mode: flat rendering only (no recursion into children). See PRD F4.
        if (ids) {
          return <>{ids.filter(id => !filterText || matchesSearchFilter(store.entities[id], filterText)).map(id =>
            store.entities[id] ? <AriaItemNode key={id} childId={id} render={render} /> : null,
          ).filter(Boolean)}</>
        }
        return <>{renderNodes(ROOT_ID)}</>
      }}
    </AriaInternalContext.Consumer>
  )
}

function AriaCell({ index, children }: { index: number; children: React.ReactNode }) {
  const nodeCtx = React.useContext(AriaItemContext)
  return (
    <AriaInternalContext.Consumer>
      {(aria) => {
        if (!aria || !nodeCtx) throw new Error('<Aria.Cell> must be inside <Aria.Item>')
        const store = aria.getStore()
        const focusedCol = (store.entities[GRID_COL_ID]?.colIndex as number) ?? 0
        const isFocusedCell = nodeCtx.focused && index === focusedCol
        return (
          <div role="gridcell" aria-colindex={index + 1} tabIndex={isFocusedCell ? 0 : -1}>
            {children}
          </div>
        )
      }}
    </AriaInternalContext.Consumer>
  )
}

function placeCaret(el: HTMLElement, atEnd: boolean) {
  const range = document.createRange()
  range.selectNodeContents(el)
  if (atEnd) range.collapse(false)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

function AriaEditable({ field, placeholder, selection = 'all', allowEmpty = false, tabContinue = false, enterContinue = false, children, ...restProps }: { field: string; placeholder?: string; selection?: 'all' | 'end'; allowEmpty?: boolean; tabContinue?: boolean; enterContinue?: boolean; children: React.ReactNode } & React.HTMLAttributes<HTMLSpanElement>) {
  const nodeCtx = React.useContext(AriaItemContext)
  const ariaCtx = React.useContext(AriaInternalContext)
  const editRef = useRef<HTMLSpanElement>(null)
  const originalValueRef = useRef<string>('')
  const composingRef = useRef(false)
  const committedRef = useRef(false)
  const wasRenamingRef = useRef(false)

  const renaming = nodeCtx?.renaming ?? false

  useEffect(() => {
    if (renaming) {
      // Entering rename mode
      wasRenamingRef.current = true
      committedRef.current = false
      composingRef.current = false
      if (!editRef.current) return
      const el = editRef.current
      originalValueRef.current = el.textContent ?? ''

      const store = ariaCtx?.getStore()
      const renameEntity = store?.entities[RENAME_ID] as Record<string, unknown> | undefined
      const isReplace = renameEntity?.replace === true
      const initialChar = renameEntity?.initialChar as string | undefined

      if (isReplace) {
        el.textContent = initialChar ?? ''
      }
      placeCaret(el, isReplace || selection === 'end')
      el.focus()
    } else if (wasRenamingRef.current) {
      // Exiting rename mode — restore focus to node
      wasRenamingRef.current = false
      if (nodeCtx) {
        const nodeEl = document.querySelector<HTMLElement>(`[data-node-id="${nodeCtx.nodeId}"]`)
        nodeEl?.focus()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- selection prop is stable, only needed on rename entry
  }, [renaming, nodeCtx])

  if (!renaming) {
    return (
      <span {...restProps} data-placeholder={placeholder} onDoubleClick={(e) => {
        if (!nodeCtx || !ariaCtx) return
        e.stopPropagation()
        ariaCtx.dispatch(renameCommands.startRename(nodeCtx.nodeId))
      }}>
        {children}
      </span>
    )
  }

  const confirm = () => {
    if (committedRef.current || !nodeCtx || !ariaCtx) return
    committedRef.current = true
    const el = editRef.current
    const newValue = el?.textContent?.trim() ?? ''
    if ((!allowEmpty && newValue === '') || newValue === originalValueRef.current) {
      // Restore DOM before React reconciles — prevents stale DOM from external mutation
      if (el) el.textContent = originalValueRef.current
      ariaCtx.dispatch(renameCommands.cancelRename())
    } else {
      ariaCtx.dispatch(renameCommands.confirmRename(nodeCtx.nodeId, field, newValue))
    }
  }

  const cancel = () => {
    if (committedRef.current || !ariaCtx || !editRef.current) return
    committedRef.current = true
    editRef.current.textContent = originalValueRef.current
    ariaCtx.dispatch(renameCommands.cancelRename())
  }

  return (
    <span
      {...restProps}
      ref={editRef}
      contentEditable
      suppressContentEditableWarning
      onCompositionStart={() => { composingRef.current = true }}
      onCompositionEnd={() => { composingRef.current = false }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !composingRef.current) {
          e.preventDefault()
          const shiftKey = e.shiftKey
          confirm()
          if (enterContinue && nodeCtx && ariaCtx) {
            setTimeout(() => {
              const nodeEl = document.querySelector<HTMLElement>(`[data-node-id="${nodeCtx.nodeId}"]`)
              if (nodeEl) {
                nodeEl.dispatchEvent(new KeyboardEvent('keydown', {
                  key: shiftKey ? 'ArrowUp' : 'ArrowDown',
                  code: shiftKey ? 'ArrowUp' : 'ArrowDown',
                  bubbles: true, cancelable: true,
                }))
              }
              // No auto-rename — Google Sheets standard: return to cell mode
            }, 0)
          }
        } else if (e.key === 'Escape') {
          e.preventDefault()
          cancel()
        } else if (e.key === 'Tab') {
          e.preventDefault()
          e.stopPropagation()
          const shiftKey = e.shiftKey
          confirm()
          if (tabContinue && nodeCtx && ariaCtx) {
            // After confirm, dispatch synthetic Tab on the row node
            // to trigger grid navigation, then auto-start rename on new cell.
            // Use setTimeout(0) — synchronous dispatch won't work because
            // the DOM hasn't re-rendered yet after confirm().
            setTimeout(() => {
              const nodeEl = document.querySelector<HTMLElement>(`[data-node-id="${nodeCtx.nodeId}"]`)
              if (nodeEl) {
                nodeEl.dispatchEvent(new KeyboardEvent('keydown', {
                  key: 'Tab', code: 'Tab', bubbles: true, cancelable: true, shiftKey,
                }))
              }
              // After navigation, start rename on new focused node
              setTimeout(() => {
                const store = ariaCtx.getStore()
                const focusedId = (store.entities[FOCUS_ID]?.focusedId as string) ?? ''
                if (focusedId) {
                  ariaCtx.dispatch(renameCommands.startRename(focusedId))
                }
              }, 0)
            }, 0)
          }
        }
      }}
      onBlur={confirm}
      data-renaming=""
      data-placeholder={placeholder}
    >
      {children}
    </span>
  )
}

interface AriaPanelProps {
  ids?: string[]
  render: (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState) => ReactElement
}

function AriaPanelNode({ childId, render, panelRole, panelVisibility }: {
  childId: string
  render: AriaPanelProps['render']
  panelRole: string
  panelVisibility: 'selected' | 'expanded'
}) {
  const aria = React.useContext(AriaInternalContext)
  if (!aria) return null
  const store = aria.getStore()
  const entity = store.entities[childId]
  if (!entity) return null

  const state = aria.getNodeState(childId)
  const panelId = `panel-${childId}`
  const isVisible = panelVisibility === 'selected' ? state.selected
    : panelVisibility === 'expanded' ? state.expanded
    : false

  const props: React.HTMLAttributes<HTMLElement> = {
    role: panelRole,
    id: panelId,
    'aria-labelledby': childId,
    ...(isVisible ? {} : { hidden: true }),
  }

  return cloneElement(
    render(props, entity, state) as React.ReactElement<Record<string, unknown>>,
    { key: panelId },
  )
}

function AriaPanel({ ids, render }: AriaPanelProps) {
  return (
    <AriaInternalContext.Consumer>
      {(aria) => {
        if (!aria) throw new Error('<Aria.Panel> must be inside <Aria>')
        const pattern = aria.pattern
        if (!pattern?.panelRole || !pattern?.panelVisibility) return null
        const store = aria.getStore()
        const children = ids ?? getChildren(store, ROOT_ID)
        return (
          <>
            {children.map((childId) => (
              <AriaPanelNode
                key={childId}
                childId={childId}
                render={render}
                panelRole={pattern.panelRole!}
                panelVisibility={pattern.panelVisibility!}
              />
            ))}
          </>
        )
      }}
    </AriaInternalContext.Consumer>
  )
}
;(AriaPanel as { _ariaPanelType?: symbol })._ariaPanelType = ARIA_PANEL_TYPE

interface AriaTriggerProps {
  render: (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState) => ReactElement
}

function AriaTrigger({ render }: AriaTriggerProps) {
  const aria = React.useContext(AriaInternalContext)
  if (!aria) throw new Error('<Aria.Trigger> must be inside <Aria>')
  const store = aria.getStore()
  const pattern = aria.pattern

  // Trigger = first root child that has children (popup parent)
  const rootChildren = getChildren(store, ROOT_ID)
  const triggerId = rootChildren.find((id) => getChildren(store, id).length > 0)
  if (!triggerId) return null

  const entity = store.entities[triggerId]
  if (!entity) return null

  const state = aria.getNodeState(triggerId)
  const isOpen = state.open ?? false

  // Build a minimal engine-like object for createPatternContext
  const engineLike = {
    dispatch: aria.dispatch,
    getStore: aria.getStore,
    syncStore: () => { /* unused by createPatternContext */ },
  }

  const makeCtx = () => createPatternContext(engineLike, {
    visibilityFilters: pattern?.visibilityFilters,
    popupType: pattern?.popupType,
  })

  const props: React.HTMLAttributes<HTMLElement> & Record<string, unknown> = {
    'data-node-id': triggerId,
    tabIndex: 0,
    ...(pattern?.popupType && { 'aria-haspopup': pattern.popupType }),
    'aria-expanded': isOpen,
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.defaultPrevented) return
      const triggerKeyMap = pattern?.triggerKeyMap
      if (!triggerKeyMap) return

      const nativeEvent = event.nativeEvent
      const matchedKey = findMatchingKey(nativeEvent, triggerKeyMap)
      if (!matchedKey) return

      event.preventDefault()
      event.stopPropagation()

      const ctx = makeCtx()
      const handler = triggerKeyMap[matchedKey]
      if (!handler) return
      const command = handler(ctx)
      if (command) aria.dispatch(command)
    },
    onClick: (event: React.MouseEvent) => {
      if (event.defaultPrevented) return
      event.stopPropagation()

      const ctx = makeCtx()
      const command = isOpen ? ctx.close() : ctx.open()
      if (command) aria.dispatch(command)
    },
    onFocus: () => {
      const currentStore = aria.getStore()
      const currentFocusedId = (currentStore.entities[FOCUS_ID]?.focusedId as string) ?? ''
      if (triggerId !== currentFocusedId) {
        aria.dispatch(focusCommands.setFocus(triggerId))
      }
    },
  }

  return cloneElement(
    render(props as React.HTMLAttributes<HTMLElement>, entity, state) as React.ReactElement<Record<string, unknown>>,
    { key: `trigger-${triggerId}` },
  )
}

function AriaSearch({ placeholder, className }: { placeholder?: string; className?: string }) {
  const ariaCtx = React.useContext(AriaInternalContext)
  if (!ariaCtx) throw new Error('<Aria.Search> must be inside <Aria>')

  const inputRef = useRef<HTMLInputElement>(null)

  const store = ariaCtx.getStore()
  const searchEntity = store.entities[SEARCH_ID] as Record<string, unknown> | undefined
  const active = !!(searchEntity?.active)
  const filterText = (searchEntity?.filterText as string) ?? ''

  useEffect(() => {
    if (active && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [active])

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      className={className}
      value={filterText}
      onChange={(e) => {
        ariaCtx.dispatch(searchCommands.setFilter(e.target.value))
      }}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Escape') {
          e.preventDefault()
          ariaCtx.dispatch(searchCommands.clearFilter())
          // Find the Aria container and focus a collection item
          const container = inputRef.current?.closest('[data-aria-container]') as HTMLElement | null
          if (container) {
            const firstItem = container.querySelector<HTMLElement>('[role="row"],[role="option"],[role="treeitem"],[role="menuitem"],[tabindex="0"]')
            firstItem?.focus()
          }
        } else if (e.key === 'Enter') {
          e.preventDefault()
          // Focus first visible item without clearing filter
          const container = inputRef.current?.closest('[data-aria-container]') as HTMLElement | null
          if (container) {
            const firstItem = container.querySelector<HTMLElement>('[role="row"],[role="option"],[role="treeitem"],[role="menuitem"]')
            firstItem?.focus()
          }
        }
      }}
    />
  )
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text
  const lower = text.toLowerCase()
  const queryLower = query.toLowerCase()
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let index = lower.indexOf(queryLower)
  while (index !== -1) {
    if (index > lastIndex) parts.push(text.slice(lastIndex, index))
    parts.push(<mark key={index}>{text.slice(index, index + query.length)}</mark>)
    lastIndex = index + query.length
    index = lower.indexOf(queryLower, lastIndex)
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts.length > 0 ? <>{parts}</> : text
}

function AriaSearchHighlight({ children }: { children: React.ReactNode }) {
  const ariaCtx = React.useContext(AriaInternalContext)
  const store = ariaCtx?.getStore()
  const filterText = (store?.entities[SEARCH_ID]?.filterText as string) ?? ''

  if (!filterText) return <>{children}</>

  return <>{React.Children.map(children, child => {
    if (typeof child === 'string') return highlightText(child, filterText)
    if (React.isValidElement(child) && (child.props as { children?: React.ReactNode }).children) {
      return React.cloneElement(child as React.ReactElement<{ children?: React.ReactNode }>, {},
        <AriaSearchHighlight>{(child.props as { children?: React.ReactNode }).children}</AriaSearchHighlight>
      )
    }
    return child
  })}</>
}

export { AriaItemContext }
// eslint-disable-next-line react-refresh/only-export-components
export const Aria = Object.assign(AriaRoot, { Item: AriaItem, Cell: AriaCell, Panel: AriaPanel, Trigger: AriaTrigger, Editable: AriaEditable, Search: AriaSearch, SearchHighlight: AriaSearchHighlight })
