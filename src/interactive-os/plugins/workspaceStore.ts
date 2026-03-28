// ② 2026-03-26-workspace-containers-prd.md
import type { Command } from '../engine/types'
import { createBatchCommand } from '../engine/types'
import type { Entity, NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import {
  createStore,
  addEntity,
  removeEntity,
  getChildren,
  getParent,
  getEntityData,
  updateEntityData,
  moveNode,
} from '../store/createStore'
import { definePlugin } from './definePlugin'
import { focusRecovery } from './focusRecovery'
import type { PaneSize } from '../store/types'

// ── Types ──────────────────────────────────────────────

export interface SplitData extends Record<string, unknown> {
  type: 'split'
  direction: 'horizontal' | 'vertical'
  sizes: PaneSize[]
}

export interface TabGroupData extends Record<string, unknown> {
  type: 'tabgroup'
  activeTabId: string
}

export interface TabData extends Record<string, unknown> {
  type: 'tab'
  label: string
  contentType: string
  contentRef: string
}

// ── UID helpers ────────────────────────────────────────

let uidCounter = 0

function uid(prefix: string): string {
  return `${prefix}-${++uidCounter}`
}

export function resetUidCounter(): void {
  uidCounter = 0
}

// ── Factory ────────────────────────────────────────────

export function createWorkspace(): NormalizedData {
  const tgId = uid('tg')
  const tg: Entity = { id: tgId, data: { type: 'tabgroup', activeTabId: '' } as TabGroupData }
  return addEntity(createStore(), tg, ROOT_ID)
}

// ── Internal helpers ───────────────────────────────────

function snapshotStore(store: NormalizedData): NormalizedData {
  return {
    entities: { ...store.entities },
    relationships: { ...store.relationships },
  }
}

function closePaneInternal(store: NormalizedData, paneId: string): NormalizedData {
  let s = removeEntity(store, paneId)

  // Check if parent split now has only 1 child → collapse
  const parentId = getParent(store, paneId)
  if (!parentId || parentId === ROOT_ID) return s

  const parentData = getEntityData<SplitData>(s, parentId)
  if (!parentData || parentData.type !== 'split') return s

  const remainingChildren = getChildren(s, parentId)
  if (remainingChildren.length === 1) {
    const survivorId = remainingChildren[0]!
    const grandparentId = getParent(s, parentId) ?? ROOT_ID
    const parentIndex = getChildren(s, grandparentId).indexOf(parentId)

    // Move survivor to grandparent at split's position
    s = moveNode(s, survivorId, grandparentId, parentIndex)
    // Remove the now-empty split
    s = removeEntity(s, parentId)
  }

  return s
}

// ── Commands ───────────────────────────────────────────

export const workspaceCommands = {
  setActiveTab(tabgroupId: string, tabId: string): Command {
    let prevActiveTabId: string | undefined

    return {
      type: 'workspace:setActiveTab',
      payload: { tabgroupId, tabId },
      execute(store) {
        prevActiveTabId = getEntityData<TabGroupData>(store, tabgroupId)?.activeTabId
        return updateEntityData(store, tabgroupId, { activeTabId: tabId })
      },
      undo(store) {
        return updateEntityData(store, tabgroupId, { activeTabId: prevActiveTabId ?? '' })
      },
    }
  },

  resize(splitId: string, sizes: PaneSize[]): Command {
    let prevSizes: PaneSize[] | undefined

    return {
      type: 'workspace:resize',
      payload: { splitId, sizes },
      execute(store) {
        prevSizes = getEntityData<SplitData>(store, splitId)?.sizes
        return updateEntityData(store, splitId, { sizes })
      },
      undo(store) {
        return updateEntityData(store, splitId, { sizes: prevSizes ?? [] })
      },
    }
  },

  addTab(tabgroupId: string, tab: Entity): Command {
    const createCmd: Command = {
      type: 'workspace:createTab',
      payload: { tabgroupId, tab },
      execute(store) {
        return addEntity(store, tab, tabgroupId)
      },
      undo(store) {
        return removeEntity(store, tab.id)
      },
    }

    const activateCmd = workspaceCommands.setActiveTab(tabgroupId, tab.id)

    return createBatchCommand([createCmd, activateCmd])
  },

  removeTab(tabId: string): Command {
    let snapshot: NormalizedData | null = null

    return {
      type: 'workspace:removeTab',
      payload: { tabId },
      execute(store) {
        snapshot = snapshotStore(store)

        const parentId = getParent(store, tabId)
        if (!parentId) return removeEntity(store, tabId)

        const siblings = getChildren(store, parentId)
        const idx = siblings.indexOf(tabId)

        let s = removeEntity(store, tabId)

        const remainingSiblings = getChildren(s, parentId)
        if (remainingSiblings.length === 0) {
          // Last tab — close the pane
          s = closePaneInternal(s, parentId)
        } else {
          // Activate adjacent: prefer next, fallback prev
          const nextTab = idx < remainingSiblings.length
            ? remainingSiblings[idx]!
            : remainingSiblings[remainingSiblings.length - 1]!
          s = updateEntityData(s, parentId, { activeTabId: nextTab })
        }

        return s
      },
      undo(store) {
        return snapshot ?? store
      },
    }
  },

  splitPane(paneId: string, direction: 'horizontal' | 'vertical'): Command {
    let snapshot: NormalizedData | null = null
    let splitId: string | undefined
    let newTgId: string | undefined

    return {
      type: 'workspace:splitPane',
      payload: { paneId, direction },
      execute(store) {
        snapshot = snapshotStore(store)

        const parentId = getParent(store, paneId) ?? ROOT_ID
        const siblings = getChildren(store, parentId)
        const paneIndex = siblings.indexOf(paneId)

        // Create split entity
        splitId = uid('split')
        const split: Entity = {
          id: splitId,
          data: { type: 'split', direction, sizes: [0.5, 'flex'] } as SplitData,
        }

        // Create new empty tabgroup
        newTgId = uid('tg')
        const newTg: Entity = {
          id: newTgId,
          data: { type: 'tabgroup', activeTabId: '' } as TabGroupData,
        }

        // Add split at pane's position in parent
        let s = addEntity(store, split, parentId, paneIndex)
        // Move existing pane under split
        s = moveNode(s, paneId, splitId, 0)
        // Add new tabgroup as second child of split
        s = addEntity(s, newTg, splitId)

        return s
      },
      undo(store) {
        return snapshot ?? store
      },
    }
  },

  closePane(paneId: string): Command {
    let snapshot: NormalizedData | null = null

    return {
      type: 'workspace:closePane',
      payload: { paneId },
      execute(store) {
        snapshot = snapshotStore(store)
        return closePaneInternal(store, paneId)
      },
      undo(store) {
        return snapshot ?? store
      },
    }
  },
}

// ── Serialization ──────────────────────────────────────

export function serializeWorkspace(store: NormalizedData): string {
  const filtered: NormalizedData = {
    entities: {},
    relationships: { ...store.relationships },
  }

  for (const [id, entity] of Object.entries(store.entities)) {
    if (!id.startsWith('__')) {
      filtered.entities[id] = entity
    }
  }

  return JSON.stringify(filtered)
}

export function deserializeWorkspace(json: string): NormalizedData {
  try {
    const parsed = JSON.parse(json) as NormalizedData
    if (!parsed.entities || !parsed.relationships) {
      return createWorkspace()
    }
    return parsed
  } catch {
    return createWorkspace()
  }
}

// ── Helpers ────────────────────────────────────────────

/** Walk workspace tree and return the first tabgroup entity id found. */
export function findTabgroup(store: NormalizedData, parentId: string = ROOT_ID): string | undefined {
  for (const childId of getChildren(store, parentId)) {
    const data = getEntityData<{ type: string }>(store, childId)
    if (data?.type === 'tabgroup') return childId
    if (data?.type === 'split') {
      const found = findTabgroup(store, childId)
      if (found) return found
    }
  }
  return undefined
}

/** Open a tab by contentRef — activate existing or create new. */
export function openTab(
  store: NormalizedData,
  tabgroupId: string,
  contentRef: string,
  createTab: () => Entity,
): NormalizedData {
  const tabIds = getChildren(store, tabgroupId)
  const existing = tabIds.find(id => {
    const data = getEntityData<TabData>(store, id)
    return data?.contentRef === contentRef
  })
  if (existing) {
    return workspaceCommands.setActiveTab(tabgroupId, existing).execute(store)
  }
  return workspaceCommands.addTab(tabgroupId, createTab()).execute(store)
}

/** Split a tabgroup and add a tab to the new pane. Returns updated store. */
export function splitAndAddTab(
  store: NormalizedData,
  tabgroupId: string,
  direction: 'horizontal' | 'vertical',
  tab: Entity,
): NormalizedData {
  const ws = workspaceCommands.splitPane(tabgroupId, direction).execute(store)
  const parentId = getParent(ws, tabgroupId) ?? ROOT_ID
  const siblings = getChildren(ws, parentId)
  const newTgId = siblings[siblings.length - 1]
  if (!newTgId || newTgId === tabgroupId) return ws
  return workspaceCommands.addTab(newTgId, tab).execute(ws)
}

// ── Sync ──────────────────────────────────────────────

/** Collect all tab contentRefs from workspace. Returns contentRef → tabId map. */
export function collectContentRefs(
  store: NormalizedData,
  filter?: (tabData: Record<string, unknown>) => boolean,
): Map<string, string> {
  const refs = new Map<string, string>() // contentRef → tabId
  for (const [id, entity] of Object.entries(store.entities)) {
    const d = entity.data as Record<string, unknown> | undefined
    if (d?.type === 'tab' && typeof d.contentRef === 'string') {
      if (!filter || filter(d)) {
        refs.set(d.contentRef, id)
      }
    }
  }
  return refs
}

export interface ExternalItem {
  id: string
}

// ② 2026-03-28-workspace-sync-prd.md
/**
 * Sync workspace tabs with an external items array.
 * - New items → addTab to first tabgroup
 * - Removed items → removeTab (with split collapse)
 * - Layout (splits, sizes, tab order) preserved
 * - Returns same reference if no changes needed
 * - Optional filter: only manage tabs matching the predicate (others untouched)
 */
export function syncFromExternal<T extends ExternalItem>(
  store: NormalizedData,
  items: T[],
  toTab: (item: T) => Entity,
  filter?: (tabData: Record<string, unknown>) => boolean,
): NormalizedData {
  const existingRefs = collectContentRefs(store, filter)
  const itemRefs = new Set(items.map(item => item.id))

  const toAdd = items.filter(item => !existingRefs.has(item.id))
  const toRemove = [...existingRefs.entries()].filter(([ref]) => !itemRefs.has(ref))

  if (toAdd.length === 0 && toRemove.length === 0) {
    return store
  }

  let s = store

  // Remove tabs for items no longer in external list
  for (const [, tabId] of toRemove) {
    s = workspaceCommands.removeTab(tabId).execute(s)
  }

  // Add tabs for new external items — resolve tabgroup once before loop
  if (toAdd.length > 0) {
    const tgId = findTabgroup(s)
    if (tgId) {
      for (const item of toAdd) {
        s = workspaceCommands.addTab(tgId, toTab(item)).execute(s)
      }
    }
  }

  return s
}

// ── Plugin ─────────────────────────────────────────────

export function workspace() {
  return definePlugin({
    name: 'workspace',
    requires: [focusRecovery()],
    commands: {
      setActiveTab: workspaceCommands.setActiveTab,
      resize: workspaceCommands.resize,
      addTab: workspaceCommands.addTab,
      removeTab: workspaceCommands.removeTab,
      splitPane: workspaceCommands.splitPane,
      closePane: workspaceCommands.closePane,
    },
  })
}
