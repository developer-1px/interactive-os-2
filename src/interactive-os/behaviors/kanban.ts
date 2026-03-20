import type { BehaviorContext } from './types'
import type { Command } from '../core/types'
import { ROOT_ID, createBatchCommand } from '../core/types'
import { focusCommands, selectionCommands } from '../plugins/core'
import { dndCommands } from '../plugins/dnd'
import { historyCommands } from '../plugins/history'
import { clipboardCommands } from '../plugins/clipboard'
import { crudCommands } from '../plugins/crud'
import { renameCommands } from '../plugins/rename'
import { composePattern, type Axis } from '../axes/compose-pattern'
import { selectToggle } from '../axes/select-toggle'

// ── Shared helpers ──

interface CardInfo {
  columnId: string
  columnIndex: number
  cardIndex: number // -1 if focused on column header
}

export function findCardInfoFor(ctx: BehaviorContext, nodeId: string): CardInfo | null {
  const columns = ctx.getChildren(ROOT_ID)
  const colIdx = columns.indexOf(nodeId)
  if (colIdx !== -1) return { columnId: nodeId, columnIndex: colIdx, cardIndex: -1 }
  for (let i = 0; i < columns.length; i++) {
    const cards = ctx.getChildren(columns[i]!)
    const cardIdx = cards.indexOf(nodeId)
    if (cardIdx !== -1) return { columnId: columns[i]!, columnIndex: i, cardIndex: cardIdx }
  }
  return null
}

export function findCardInfo(ctx: BehaviorContext): CardInfo | null {
  return findCardInfoFor(ctx, ctx.focused)
}

export function focusInColumn(ctx: BehaviorContext, columnId: string, targetIndex: number): Command {
  const cards = ctx.getChildren(columnId)
  if (cards.length === 0) return focusCommands.setFocus(columnId)
  const clamped = Math.min(Math.max(targetIndex, 0), cards.length - 1)
  return focusCommands.setFocus(cards[clamped]!)
}

// ── Axis: column-aware vertical navigation ──

const kanbanNavV: Axis = {
  ArrowDown(ctx) {
    const info = findCardInfo(ctx)
    if (!info) return ctx.focusNext()
    if (info.cardIndex === -1) return ctx.focusChild() // column header -> first card
    const cards = ctx.getChildren(info.columnId)
    if (info.cardIndex >= cards.length - 1) return focusCommands.setFocus(ctx.focused) // stay
    return focusCommands.setFocus(cards[info.cardIndex + 1]!)
  },

  ArrowUp(ctx) {
    const info = findCardInfo(ctx)
    if (!info) return ctx.focusPrev()
    if (info.cardIndex <= 0) return focusCommands.setFocus(ctx.focused) // stay (first card or header)
    return focusCommands.setFocus(ctx.getChildren(info.columnId)[info.cardIndex - 1]!)
  },
}

// ── Axis: cross-column horizontal navigation ──

const kanbanCrossH: Axis = {
  ArrowRight(ctx) {
    const info = findCardInfo(ctx)
    if (!info) return ctx.focusNext()
    const columns = ctx.getChildren(ROOT_ID)
    if (info.columnIndex >= columns.length - 1) return focusCommands.setFocus(ctx.focused)
    const nextColId = columns[info.columnIndex + 1]!
    return focusInColumn(ctx, nextColId, info.cardIndex === -1 ? 0 : info.cardIndex)
  },

  ArrowLeft(ctx) {
    const info = findCardInfo(ctx)
    if (!info) return ctx.focusPrev()
    const columns = ctx.getChildren(ROOT_ID)
    if (info.columnIndex <= 0) return focusCommands.setFocus(ctx.focused)
    const prevColId = columns[info.columnIndex - 1]!
    return focusInColumn(ctx, prevColId, info.cardIndex === -1 ? 0 : info.cardIndex)
  },

  Home(ctx) {
    const info = findCardInfo(ctx)
    if (!info) return ctx.focusFirst()
    return focusInColumn(ctx, info.columnId, 0)
  },

  End(ctx) {
    const info = findCardInfo(ctx)
    if (!info) return ctx.focusLast()
    const cards = ctx.getChildren(info.columnId)
    return focusInColumn(ctx, info.columnId, cards.length - 1)
  },

  'Mod+Home'(ctx) {
    const columns = ctx.getChildren(ROOT_ID)
    if (columns.length === 0) return focusCommands.setFocus(ctx.focused)
    return focusInColumn(ctx, columns[0]!, 0)
  },

  'Mod+End'(ctx) {
    const columns = ctx.getChildren(ROOT_ID)
    if (columns.length === 0) return focusCommands.setFocus(ctx.focused)
    const lastCol = columns[columns.length - 1]!
    const cards = ctx.getChildren(lastCol)
    return focusInColumn(ctx, lastCol, cards.length - 1)
  },
}

// ── Axis: kanban-specific ARIA editing behaviors ──

const kanbanEditing: Axis = {
  'Mod+A'(ctx) {
    const info = findCardInfo(ctx)
    if (!info) return
    const cards = ctx.getChildren(info.columnId)
    if (cards.length === 0) return
    return selectionCommands.selectRange(cards)
  },

  Escape(ctx) {
    if (ctx.selected.length > 0) return selectionCommands.clearSelection()
  },
}

// ── Axis: plugin keybindings (CRUD, rename, clipboard, history, DnD) ──

const kanbanPlugins: Axis = {
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

  Enter: (ctx) => renameCommands.startRename(ctx.focused),
  F2: (ctx) => renameCommands.startRename(ctx.focused),

  'Mod+C': (ctx) => clipboardCommands.copy(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
  'Mod+X': (ctx) => clipboardCommands.cut(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
  'Mod+V': (ctx) => clipboardCommands.paste(ctx.focused),

  'Mod+Z': () => historyCommands.undo(),
  'Mod+Shift+Z': () => historyCommands.redo(),

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

  'Alt+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
  'Alt+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),
}

// ── Compose all axes into the behavior ──

export const kanban = composePattern(
  {
    role: 'group',
    childRole: 'group',
    focusStrategy: { type: 'roving-tabindex', orientation: 'both' },
    ariaAttributes: (_node, state) => ({
      'aria-rowindex': String(state.index + 1),
      'aria-level': String((state.level ?? 0) + 1),
      'aria-selected': String(state.selected),
    }),
  },
  selectToggle,
  kanbanEditing,
  kanbanCrossH,
  kanbanNavV,
  kanbanPlugins,
)
