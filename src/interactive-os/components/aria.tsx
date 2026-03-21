import React, { useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { NormalizedData, Plugin, Command } from '../core/types'
import { ROOT_ID } from '../core/types'
import type { AriaBehavior, BehaviorContext, NodeState } from '../behaviors/types'
import { useAria } from '../hooks/useAria'
import { AriaInternalContext } from './AriaInternalContext'
import { getChildren } from '../core/createStore'
import { EXPANDED_ID, GRID_COL_ID } from '../plugins/core'
import { renameCommands } from '../plugins/rename'
import { registerAria, unregisterAria } from './ariaRegistry'

interface AriaProps {
  id?: string
  behavior: AriaBehavior
  data: NormalizedData
  plugins: Plugin[]
  keyMap?: Record<string, (ctx: BehaviorContext) => Command | void>
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  'aria-label'?: string
  children: ReactNode
}

interface AriaItemProps {
  render: (node: Record<string, unknown>, state: NodeState) => ReactNode
}

const horizontalStyle = { display: 'flex' } as const

const ROLES_WITH_ORIENTATION = new Set(['listbox', 'menu', 'menubar', 'tablist', 'toolbar', 'treegrid'])

const AriaItemContext = React.createContext<{ nodeId: string; focused: boolean; renaming: boolean } | null>(null)

function AriaRoot({ id, behavior, data, plugins, keyMap, onChange, onActivate, 'aria-label': ariaLabel, children }: AriaProps) {
  const aria = useAria({ behavior, data, plugins, keyMap, onChange, onActivate })

  useEffect(() => {
    if (!id) return
    registerAria(id, { dispatch: aria.dispatch, getStore: aria.getStore })
    return () => unregisterAria(id)
  }, [id, aria.dispatch, aria.getStore])

  const { orientation } = behavior.focusStrategy
  return (
    <AriaInternalContext.Provider value={{ ...aria, behavior }}>
      <div
        role={behavior.role}
        aria-label={ariaLabel}
        aria-orientation={ROLES_WITH_ORIENTATION.has(behavior.role) && orientation !== 'both' ? orientation : undefined}
        style={orientation === 'horizontal' ? horizontalStyle : undefined}
        data-aria-container=""
        {...(aria.containerProps as React.HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    </AriaInternalContext.Provider>
  )
}

function FocusScrollDiv({ focused, children, ...props }: { focused: boolean; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (focused && ref.current) {
      ref.current.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    }
  }, [focused])
  return <div ref={ref} {...props}>{children}</div>
}

function AriaItem({ render }: AriaItemProps) {
  return (
    <AriaInternalContext.Consumer>
      {(aria) => {
        if (!aria) throw new Error('<Aria.Item> must be inside <Aria>')
        const store = aria.getStore()
        const expandedIds = (store.entities[EXPANDED_ID]?.expandedIds as string[]) ?? []
        // If behavior has colCount, consumer uses <Aria.Cell> — skip auto gridcell wrapping
        const hasColCount = !!(aria.behavior.colCount && aria.behavior.colCount > 0)

        const renderNodes = (parentId: string): ReactNode[] => {
          const children = getChildren(store, parentId)
          const nodes: ReactNode[] = []
          for (const childId of children) {
            const entity = store.entities[childId]
            if (!entity) continue
            const state = aria.getNodeState(childId)
            const props = aria.getNodeProps(childId)
            const hasChildren = getChildren(store, childId).length > 0
            const isExpanded = expandedIds.includes(childId)
            // For treegrid rows, content must be wrapped in gridcell (but not for grid with colCount)
            const needsGridcell = !hasColCount && (props as Record<string, unknown>).role === 'row'
            nodes.push(
              <FocusScrollDiv key={childId} focused={state.focused} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
                <AriaItemContext.Provider value={{ nodeId: childId, focused: state.focused, renaming: !!state.renaming }}>
                  {needsGridcell
                    ? <div role="gridcell">{render(entity, state)}</div>
                    : render(entity, state)
                  }
                </AriaItemContext.Provider>
              </FocusScrollDiv>
            )
            if (hasChildren && isExpanded) {
              nodes.push(...renderNodes(childId))
            }
          }
          return nodes
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

function AriaEditable({ field, placeholder, selection = 'all', children }: { field: string; placeholder?: string; selection?: 'all' | 'end'; children: React.ReactNode }) {
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
      const range = document.createRange()
      range.selectNodeContents(el)
      if (selection === 'end') range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
      el.focus()
    } else if (wasRenamingRef.current) {
      // Exiting rename mode — restore focus to node
      wasRenamingRef.current = false
      if (nodeCtx) {
        const nodeEl = document.querySelector<HTMLElement>(`[data-node-id="${nodeCtx.nodeId}"]`)
        nodeEl?.focus()
      }
    }
  }, [renaming, nodeCtx])

  if (!renaming) {
    return (
      <span data-placeholder={placeholder} onDoubleClick={(e) => {
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
    if (newValue === '' || newValue === originalValueRef.current) {
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
      ref={editRef}
      contentEditable
      suppressContentEditableWarning
      onCompositionStart={() => { composingRef.current = true }}
      onCompositionEnd={() => { composingRef.current = false }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !composingRef.current) {
          e.preventDefault()
          confirm()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          cancel()
        } else if (e.key === 'Tab') {
          e.preventDefault()
          confirm()
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

export { AriaItemContext }
// eslint-disable-next-line react-refresh/only-export-components
export const Aria = Object.assign(AriaRoot, { Item: AriaItem, Cell: AriaCell, Editable: AriaEditable })
