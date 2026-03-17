import type { Command, Entity } from '../core/types'
import { createBatchCommand } from '../core/types'
import type { CommandEngine } from '../core/createCommandEngine'
import type { BehaviorContext, GridNav, SelectionMode } from './types'
import { getEntity, getChildren, getParent } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import { focusCommands, selectionCommands, expandCommands, gridColCommands, FOCUS_ID, SELECTION_ID, SELECTION_ANCHOR_ID, EXPANDED_ID, GRID_COL_ID } from '../plugins/core'

function getFocusedId(engine: CommandEngine): string {
  return (engine.getStore().entities[FOCUS_ID]?.focusedId as string) ?? ''
}

function getSelectedIds(engine: CommandEngine): string[] {
  return (engine.getStore().entities[SELECTION_ID]?.selectedIds as string[]) ?? []
}

function getExpandedIds(engine: CommandEngine): string[] {
  return (engine.getStore().entities[EXPANDED_ID]?.expandedIds as string[]) ?? []
}

function isExpanded(engine: CommandEngine, nodeId: string): boolean {
  return getExpandedIds(engine).includes(nodeId)
}

/**
 * Build flat list of visible node IDs respecting expanded/collapsed state.
 * Walks depth-first from __root__, only descends into expanded nodes.
 */
function getVisibleNodes(engine: CommandEngine): string[] {
  const store = engine.getStore()
  const expandedIds = getExpandedIds(engine)
  const visible: string[] = []

  const walk = (parentId: string) => {
    const children = getChildren(store, parentId)
    for (const childId of children) {
      visible.push(childId)
      if (expandedIds.includes(childId)) {
        walk(childId)
      }
    }
  }

  walk(ROOT_ID)
  return visible
}

export interface BehaviorContextOptions {
  expandable?: boolean
  selectionMode?: SelectionMode
  colCount?: number
}

export function createBehaviorContext(engine: CommandEngine, options?: BehaviorContextOptions): BehaviorContext {
  const store = engine.getStore()
  const focusedId = getFocusedId(engine)

  // Lazy-cached visible nodes — computed at most once per context
  let _visibleNodes: string[] | null = null
  const visibleNodes = (): string[] => {
    if (!_visibleNodes) _visibleNodes = getVisibleNodes(engine)
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

  return {
    focused: focusedId,
    selected: getSelectedIds(engine),
    isExpanded: isExpanded(engine, focusedId),

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
      if (children.length > 0 || options?.expandable) return expandCommands.toggleExpand(focusedId)
      return selectionCommands.select(focusedId)
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
  }
}
