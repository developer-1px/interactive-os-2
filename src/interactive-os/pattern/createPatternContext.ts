import type { Entity } from '../store/types'
import { ROOT_ID } from '../store/types'
import type { Command } from '../engine/types'
import { createBatchCommand } from '../engine/types'
import type { CommandEngine } from '../engine/createCommandEngine'
import { getVisibleNodes } from '../engine/getVisibleNodes'
import type { VisibilityFilter } from '../engine/types'
import type { PatternContext, GridNav, SelectionMode, ValueNav } from './types'
import { getEntity, getChildren, getParent } from '../store/createStore'
// ② 2026-03-26-core-absorption-prd.md
import { focusCommands, FOCUS_ID, gridColCommands, GRID_COL_ID } from '../axis/navigate'
import { selectionCommands, SELECTION_ID, SELECTION_ANCHOR_ID } from '../axis/select'
import { expandCommands, EXPANDED_ID } from '../axis/expand'
import { checkedCommands, CHECKED_ID } from '../axis/checked'
import { valueCommands, VALUE_ID } from '../axis/value'
import type { ValueRange } from '../axis/value'
import { popupCommands, POPUP_ID } from '../axis/popup'

function getFocusedId(engine: CommandEngine): string {
  return (engine.getStore().entities[FOCUS_ID]?.focusedId as string) ?? ''
}

function getSelectedIds(engine: CommandEngine): string[] {
  return (engine.getStore().entities[SELECTION_ID]?.selectedIds as string[]) ?? []
}

function isExpanded(engine: CommandEngine, nodeId: string): boolean {
  const expandedIds = (engine.getStore().entities[EXPANDED_ID]?.expandedIds as string[]) ?? []
  return expandedIds.includes(nodeId)
}

function isChecked(engine: CommandEngine, nodeId: string): boolean {
  const checkedIds = (engine.getStore().entities[CHECKED_ID]?.checkedIds as string[]) ?? []
  return checkedIds.includes(nodeId)
}

function isPopupOpen(engine: CommandEngine): boolean {
  return (engine.getStore().entities[POPUP_ID]?.isOpen as boolean) ?? false
}

export interface PatternContextOptions {
  expandable?: boolean
  selectionMode?: SelectionMode
  colCount?: number
  valueRange?: ValueRange
  checkedTracking?: boolean
  visibilityFilters?: VisibilityFilter[]
  popupType?: string
  /** Override focused node — used by clickMap to set ctx.focused to the clicked node */
  overrideFocused?: string
}

export function createPatternContext(engine: CommandEngine, options?: PatternContextOptions): PatternContext {
  const store = engine.getStore()
  const focusedId = options?.overrideFocused ?? getFocusedId(engine)

  // Lazy-cached visible nodes — computed at most once per context
  let _visibleNodes: string[] | null = null
  const visibleNodes = (): string[] => {
    if (!_visibleNodes) _visibleNodes = getVisibleNodes(store, options?.visibilityFilters)
    return _visibleNodes
  }

  const colCount = options?.colCount
  const grid: GridNav | undefined = colCount && colCount > 1 ? (() => {
    const currentCol = (store.entities[GRID_COL_ID]?.colIndex as number) ?? 0
    return {
      colIndex: currentCol,
      colCount,
      focusNextCol: () => gridColCommands.setColIndex(Math.min(currentCol + 1, colCount - 1)),
      focusPrevCol: () => gridColCommands.setColIndex(Math.max(currentCol - 1, 0)),
      focusFirstCol: () => gridColCommands.setColIndex(0),
      focusLastCol: () => gridColCommands.setColIndex(colCount - 1),
    }
  })() : undefined

  const valueRange = options?.valueRange
  const value: ValueNav | undefined = valueRange ? (() => {
    const currentValue = ((store.entities[VALUE_ID] as Record<string, unknown>)?.value as number) ?? valueRange.min
    return {
      current: currentValue,
      min: valueRange.min,
      max: valueRange.max,
      step: valueRange.step,
      increment: (s?: number) => valueCommands.increment(s ?? valueRange.step, valueRange),
      decrement: (s?: number) => valueCommands.decrement(s ?? valueRange.step, valueRange),
      setToMin: () => valueCommands.setValue(valueRange.min, valueRange),
      setToMax: () => valueCommands.setValue(valueRange.max, valueRange),
      setValue: (v: number) => valueCommands.setValue(v, valueRange),
    }
  })() : undefined

  return {
    focused: focusedId,
    selected: getSelectedIds(engine),
    isExpanded: isExpanded(engine, focusedId),
    isChecked: isChecked(engine, focusedId),
    isOpen: isPopupOpen(engine),

    focusNext(options?: { wrap?: boolean }): Command {
      const visible = visibleNodes()
      const idx = visible.indexOf(focusedId)
      let nextId: string
      if (options?.wrap) {
        nextId = visible[(idx + 1) % visible.length] ?? focusedId
      } else {
        nextId = visible[idx + 1] ?? focusedId
      }
      return focusCommands.setFocus(nextId)
    },

    focusPrev(options?: { wrap?: boolean }): Command {
      const visible = visibleNodes()
      const idx = visible.indexOf(focusedId)
      let prevId: string
      if (options?.wrap) {
        prevId = visible[(idx - 1 + visible.length) % visible.length] ?? focusedId
      } else {
        prevId = visible[idx - 1] ?? focusedId
      }
      return focusCommands.setFocus(prevId)
    },

    focusFirst(): Command {
      const visible = visibleNodes()
      return focusCommands.setFocus(visible[0] ?? focusedId)
    },

    focusLast(): Command {
      const visible = visibleNodes()
      return focusCommands.setFocus(visible[visible.length - 1] ?? focusedId)
    },

    focusParent(): Command {
      const parentId = getParent(store, focusedId)
      if (!parentId || parentId === ROOT_ID) return focusCommands.setFocus(focusedId)
      return focusCommands.setFocus(parentId)
    },

    focusChild(): Command {
      const children = getChildren(store, focusedId)
      if (children.length === 0) return focusCommands.setFocus(focusedId)
      return focusCommands.setFocus(children[0]!)
    },

    expand(): Command {
      return expandCommands.expand(focusedId)
    },

    collapse(): Command {
      return expandCommands.collapse(focusedId)
    },

    activate(): Command {
      const children = getChildren(store, focusedId)
      if (options?.checkedTracking) return checkedCommands.toggleCheck(focusedId)
      if (children.length > 0 || options?.expandable) return expandCommands.toggleExpand(focusedId)
      return selectionCommands.select(focusedId)
    },

    toggleCheck(): Command {
      return checkedCommands.toggleCheck(focusedId)
    },

    open(): Command {
      const children = getChildren(store, focusedId)
      const cmds: Command[] = [popupCommands.open(focusedId)]
      if (children.length > 0) cmds.push(focusCommands.setFocus(children[0]!))
      return createBatchCommand(cmds)
    },

    close(): Command {
      const popupEntity = store.entities[POPUP_ID] as Record<string, unknown> | undefined
      const triggerId = (popupEntity?.triggerId as string) ?? focusedId
      return createBatchCommand([
        popupCommands.close(),
        focusCommands.setFocus(triggerId),
      ])
    },

    toggleSelect(): Command {
      if (options?.selectionMode === 'single') {
        return selectionCommands.select(focusedId)
      }
      return selectionCommands.toggleSelect(focusedId)
    },

    extendSelection(direction: 'next' | 'prev' | 'first' | 'last'): Command {
      const visible = visibleNodes()
      const idx = visible.indexOf(focusedId)

      // Determine the target node
      let targetId: string
      switch (direction) {
        case 'next': targetId = visible[idx + 1] ?? focusedId; break
        case 'prev': targetId = visible[idx - 1] ?? focusedId; break
        case 'first': targetId = visible[0] ?? focusedId; break
        case 'last': targetId = visible[visible.length - 1] ?? focusedId; break
      }

      // Single selection mode: just move focus (no range)
      if (options?.selectionMode === 'single') {
        return focusCommands.setFocus(targetId)
      }

      // Get or initialize anchor
      const anchorId = (store.entities[SELECTION_ANCHOR_ID]?.anchorId as string) ?? focusedId

      // Compute range between anchor and target
      const anchorIdx = visible.indexOf(anchorId)
      const targetIdx = visible.indexOf(targetId)
      const start = Math.min(anchorIdx, targetIdx)
      const end = Math.max(anchorIdx, targetIdx)
      const rangeIds = visible.slice(start, end + 1)

      const commands: Command[] = []
      // Set anchor if not already set
      if (!store.entities[SELECTION_ANCHOR_ID]) {
        commands.push(selectionCommands.setAnchor(focusedId))
      }
      commands.push(focusCommands.setFocus(targetId))
      commands.push(selectionCommands.selectRange(rangeIds))
      return createBatchCommand(commands)
    },

    extendSelectionTo(targetId: string, navigableIds?: string[]): Command {
      const nodeList = navigableIds ?? visibleNodes()
      const anchorId = (store.entities[SELECTION_ANCHOR_ID]?.anchorId as string) ?? focusedId

      const anchorIdx = nodeList.indexOf(anchorId)
      const targetIdx = nodeList.indexOf(targetId)
      if (targetIdx === -1) return focusCommands.setFocus(focusedId)

      const start = Math.min(anchorIdx, targetIdx)
      const end = Math.max(anchorIdx, targetIdx)
      const rangeIds = nodeList.slice(start, end + 1)

      const commands: Command[] = []
      if (!store.entities[SELECTION_ANCHOR_ID]) {
        commands.push(selectionCommands.setAnchor(focusedId))
      }
      commands.push(focusCommands.setFocus(targetId))
      commands.push(selectionCommands.selectRange(rangeIds))
      return createBatchCommand(commands)
    },

    dispatch(command: Command): void {
      engine.dispatch(command)
    },

    getEntity(id: string): Entity | undefined {
      return getEntity(store, id)
    },

    getChildren(id: string): string[] {
      return getChildren(store, id)
    },

    grid,
    value,
  }
}
