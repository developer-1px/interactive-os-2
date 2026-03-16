import type { Command, Entity } from '../core/types'
import type { CommandEngine } from '../core/command-engine'
import type { BehaviorContext, SelectionMode } from './types'
import { getEntity, getChildren, getParent } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import { focusCommands, selectionCommands, expandCommands } from '../plugins/core'

function getFocusedId(engine: CommandEngine): string {
  return (engine.getStore().entities['__focus__']?.focusedId as string) ?? ''
}

function getSelectedIds(engine: CommandEngine): string[] {
  return (engine.getStore().entities['__selection__']?.selectedIds as string[]) ?? []
}

function getExpandedIds(engine: CommandEngine): string[] {
  return (engine.getStore().entities['__expanded__']?.expandedIds as string[]) ?? []
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
}

export function createBehaviorContext(engine: CommandEngine, options?: BehaviorContextOptions): BehaviorContext {
  const store = engine.getStore()
  const focusedId = getFocusedId(engine)

  return {
    focused: focusedId,
    selected: getSelectedIds(engine),
    isExpanded: isExpanded(engine, focusedId),

    focusNext(options?: { wrap?: boolean }): Command {
      const visible = getVisibleNodes(engine)
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
      const visible = getVisibleNodes(engine)
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
      const visible = getVisibleNodes(engine)
      return focusCommands.setFocus(visible[0] ?? focusedId)
    },

    focusLast(): Command {
      const visible = getVisibleNodes(engine)
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

    dispatch(command: Command): void {
      engine.dispatch(command)
    },

    getEntity(id: string): Entity | undefined {
      return getEntity(store, id)
    },

    getChildren(id: string): string[] {
      return getChildren(store, id)
    },
  }
}
