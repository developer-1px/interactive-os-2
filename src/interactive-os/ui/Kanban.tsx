import React, { useRef, useEffect, useMemo } from 'react'
import './kanban.css'
import type { NormalizedData, Plugin, Command } from '../core/types'
import { ROOT_ID, createBatchCommand } from '../core/types'
import { useAria } from '../hooks/useAria'
import { AriaInternalContext } from '../components/aria-context'
import { AriaItemContext, Aria } from '../components/aria'
import { kanban as kanbanBehavior, findCardInfo, findCardInfoFor } from '../behaviors/kanban'
import { core } from '../plugins/core'
import { getChildren, getEntity } from '../core/createStore'
import { dndCommands } from '../plugins/dnd'
import { historyCommands } from '../plugins/history'
import { clipboardCommands } from '../plugins/clipboard'
import { crudCommands } from '../plugins/crud'
import { renameCommands } from '../plugins/rename'
import type { BehaviorContext } from '../behaviors/types'

interface KanbanProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  'aria-label'?: string
}

function FocusDiv({ focused, children, ...props }: { focused: boolean; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (focused && ref.current) {
      ref.current.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    }
  }, [focused])
  return <div ref={ref} {...props}>{children}</div>
}

export function Kanban({
  data,
  plugins = [core()],
  onChange,
  'aria-label': ariaLabel,
}: KanbanProps) {
  const pluginKeyMap = useMemo<Record<string, (ctx: BehaviorContext) => Command | void>>(() => ({
    // CRUD
    Delete: (ctx) => crudCommands.remove(ctx.focused),
    'N'(ctx) {
      const info = findCardInfo(ctx)
      if (!info) return
      const parentId = info.columnId
      const insertIndex = info.cardIndex === -1 ? 0 : info.cardIndex + 1
      const newId = `card-${Date.now()}`
      return crudCommands.create({ id: newId, data: { title: 'New card' } }, parentId, insertIndex)
    },
    'Ctrl+Enter'(ctx) {
      const info = findCardInfo(ctx)
      if (!info) return
      const parentId = info.columnId
      const insertIndex = info.cardIndex === -1 ? 0 : info.cardIndex + 1
      const newId = `card-${Date.now()}`
      return crudCommands.create({ id: newId, data: { title: 'New card' } }, parentId, insertIndex)
    },
    // Rename
    Enter: (ctx) => renameCommands.startRename(ctx.focused),
    F2: (ctx) => renameCommands.startRename(ctx.focused),
    // Clipboard
    'Mod+C': (ctx) => clipboardCommands.copy(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
    'Mod+X': (ctx) => clipboardCommands.cut(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
    'Mod+V': (ctx) => clipboardCommands.paste(ctx.focused),
    // History
    'Mod+Z': () => historyCommands.undo(),
    'Mod+Shift+Z': () => historyCommands.redo(),
    // DnD — cross-column move
    'Alt+ArrowRight'(ctx) {
      const info = findCardInfo(ctx)
      if (!info || info.cardIndex === -1) return
      const columns = ctx.getChildren(ROOT_ID)
      if (info.columnIndex >= columns.length - 1) return
      const targetCol = columns[info.columnIndex + 1]!
      if (ctx.selected.length > 1) {
        const cmds = ctx.selected.map((id) => {
          const ci = findCardInfoFor(ctx, id)
          if (!ci || ci.cardIndex === -1) return null
          return dndCommands.moveTo(id, targetCol, Math.min(ci.cardIndex, ctx.getChildren(targetCol).length))
        }).filter(Boolean) as Command[]
        return cmds.length > 0 ? createBatchCommand(cmds) : undefined
      }
      const targetIndex = Math.min(info.cardIndex, ctx.getChildren(targetCol).length)
      return dndCommands.moveTo(ctx.focused, targetCol, targetIndex)
    },
    'Alt+ArrowLeft'(ctx) {
      const info = findCardInfo(ctx)
      if (!info || info.cardIndex === -1) return
      const columns = ctx.getChildren(ROOT_ID)
      if (info.columnIndex <= 0) return
      const targetCol = columns[info.columnIndex - 1]!
      if (ctx.selected.length > 1) {
        const cmds = ctx.selected.map((id) => {
          const ci = findCardInfoFor(ctx, id)
          if (!ci || ci.cardIndex === -1) return null
          return dndCommands.moveTo(id, targetCol, Math.min(ci.cardIndex, ctx.getChildren(targetCol).length))
        }).filter(Boolean) as Command[]
        return cmds.length > 0 ? createBatchCommand(cmds) : undefined
      }
      const targetIndex = Math.min(info.cardIndex, ctx.getChildren(targetCol).length)
      return dndCommands.moveTo(ctx.focused, targetCol, targetIndex)
    },
    // DnD — within-column reorder
    'Alt+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
    'Alt+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),
  }), [])

  const aria = useAria({ behavior: kanbanBehavior, data, plugins, onChange, keyMap: pluginKeyMap })
  const store = aria.getStore()
  const columns = getChildren(store, ROOT_ID)

  return (
    <AriaInternalContext.Provider value={{ ...aria, behavior: kanbanBehavior }}>
      <div
        role={kanbanBehavior.role}
        aria-label={ariaLabel}
        data-aria-container=""
        className="kanban-board"
        {...(aria.containerProps as React.HTMLAttributes<HTMLDivElement>)}
      >
        {columns.map((colId) => {
          const colEntity = getEntity(store, colId)
          if (!colEntity) return null
          const colState = aria.getNodeState(colId)
          const colProps = aria.getNodeProps(colId)
          const cards = getChildren(store, colId)
          const colTitle = (colEntity.data as Record<string, unknown>)?.title as string ?? ''

          return (
            <div key={colId} className="kanban-column">
              {/* Column header */}
              <FocusDiv
                focused={colState.focused}
                className="kanban-column-header"
                {...(colProps as React.HTMLAttributes<HTMLDivElement>)}
              >
                <AriaItemContext.Provider value={{ nodeId: colId, focused: colState.focused, renaming: !!colState.renaming }}>
                  <span>{colTitle}</span>
                  <span className="kanban-column-count">{cards.length}</span>
                </AriaItemContext.Provider>
              </FocusDiv>

              {/* Cards */}
              {cards.map((cardId) => {
                const cardEntity = getEntity(store, cardId)
                if (!cardEntity) return null
                const cardState = aria.getNodeState(cardId)
                const cardProps = aria.getNodeProps(cardId)
                const cardTitle = (cardEntity.data as Record<string, unknown>)?.title as string ?? ''

                return (
                  <FocusDiv
                    key={cardId}
                    focused={cardState.focused}
                    className="kanban-card"
                    {...(cardProps as React.HTMLAttributes<HTMLDivElement>)}
                  >
                    <AriaItemContext.Provider value={{ nodeId: cardId, focused: cardState.focused, renaming: !!cardState.renaming }}>
                      <Aria.Editable field="title">{cardTitle}</Aria.Editable>
                    </AriaItemContext.Provider>
                  </FocusDiv>
                )
              })}
            </div>
          )
        })}
      </div>
    </AriaInternalContext.Provider>
  )
}
