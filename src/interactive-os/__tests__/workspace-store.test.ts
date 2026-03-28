// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import {
  createWorkspace,
  workspaceCommands,
  serializeWorkspace,
  deserializeWorkspace,
  resetUidCounter,
  workspace,
  type SplitData,
  type TabGroupData,
  type TabData,
} from '../plugins/workspaceStore'
import { ROOT_ID } from '../store/types'
import type { Entity, NormalizedData } from '../store/types'
import { getChildren, getEntityData } from '../store/createStore'

beforeEach(() => {
  resetUidCounter()
})

// V3: 2026-03-26-workspace-containers-prd.md
describe('createWorkspace', () => {
  it('creates a store with one tabgroup under ROOT', () => {
    const store = createWorkspace()
    const rootChildren = getChildren(store, ROOT_ID)
    expect(rootChildren).toHaveLength(1)

    const tgId = rootChildren[0]!
    const tgData = getEntityData<TabGroupData>(store, tgId)
    expect(tgData).toEqual({ type: 'tabgroup', activeTabId: '' })
  })
})

// V6: 2026-03-26-workspace-containers-prd.md
describe('workspaceCommands.setActiveTab', () => {
  it('sets activeTabId on tabgroup', () => {
    const store = createWorkspace()
    const tgId = getChildren(store, ROOT_ID)[0]!
    const after = workspaceCommands.setActiveTab.reduce(store, tgId, 'tab-1')
    const data = getEntityData<TabGroupData>(after, tgId)
    expect(data?.activeTabId).toBe('tab-1')
  })
})

// V6: 2026-03-26-workspace-containers-prd.md
describe('workspaceCommands.resize', () => {
  it('updates sizes on a split entity', () => {
    const store = createWorkspace()
    const tgId = getChildren(store, ROOT_ID)[0]!
    const withSplit = workspaceCommands.splitPane.reduce(store, tgId, 'horizontal')
    const splitId = getChildren(withSplit, ROOT_ID)[0]!
    const splitData = getEntityData<SplitData>(withSplit, splitId)
    expect(splitData?.sizes).toEqual([0.5, 'flex'])

    const resized = workspaceCommands.resize.reduce(withSplit, splitId, [0.3, 'flex'])
    expect(getEntityData<SplitData>(resized, splitId)?.sizes).toEqual([0.3, 'flex'])
  })
})

// V7: 2026-03-26-workspace-containers-prd.md
describe('workspaceCommands.addTab', () => {
  it('adds a tab and sets it as active', () => {
    const store = createWorkspace()
    const tgId = getChildren(store, ROOT_ID)[0]!
    const tab: Entity = { id: 'tab-1', data: { type: 'tab', label: 'File.ts', contentType: 'editor', contentRef: '/file.ts' } }
    let after = workspaceCommands.createTab.reduce(store, tgId, tab)
    after = workspaceCommands.setActiveTab.reduce(after, tgId, tab.id)

    expect(getChildren(after, tgId)).toContain('tab-1')
    expect(getEntityData<TabGroupData>(after, tgId)?.activeTabId).toBe('tab-1')
    expect(getEntityData<TabData>(after, 'tab-1')?.label).toBe('File.ts')
  })
})

// V8: 2026-03-26-workspace-containers-prd.md
describe('workspaceCommands.removeTab', () => {
  it('removes tab and activates next sibling', () => {
    const store = createWorkspace()
    const tgId = getChildren(store, ROOT_ID)[0]!
    const tab1: Entity = { id: 'tab-1', data: { type: 'tab', label: 'A', contentType: 'editor', contentRef: '/a' } }
    const tab2: Entity = { id: 'tab-2', data: { type: 'tab', label: 'B', contentType: 'editor', contentRef: '/b' } }
    const tab3: Entity = { id: 'tab-3', data: { type: 'tab', label: 'C', contentType: 'editor', contentRef: '/c' } }
    let s = workspaceCommands.createTab.reduce(store, tgId, tab1)
    s = workspaceCommands.setActiveTab.reduce(s, tgId, tab1.id)
    s = workspaceCommands.createTab.reduce(s, tgId, tab2)
    s = workspaceCommands.setActiveTab.reduce(s, tgId, tab2.id)
    s = workspaceCommands.createTab.reduce(s, tgId, tab3)
    s = workspaceCommands.setActiveTab.reduce(s, tgId, tab3.id)

    const after = workspaceCommands.removeTab.reduce(s, 'tab-2')
    expect(getChildren(after, tgId)).not.toContain('tab-2')
    expect(getEntityData<TabGroupData>(after, tgId)?.activeTabId).toBe('tab-3')
  })

  it('removes last tab and activates previous sibling', () => {
    const store = createWorkspace()
    const tgId = getChildren(store, ROOT_ID)[0]!
    const tab1: Entity = { id: 'tab-1', data: { type: 'tab', label: 'A', contentType: 'editor', contentRef: '/a' } }
    const tab2: Entity = { id: 'tab-2', data: { type: 'tab', label: 'B', contentType: 'editor', contentRef: '/b' } }
    let s = workspaceCommands.createTab.reduce(store, tgId, tab1)
    s = workspaceCommands.setActiveTab.reduce(s, tgId, tab1.id)
    s = workspaceCommands.createTab.reduce(s, tgId, tab2)
    s = workspaceCommands.setActiveTab.reduce(s, tgId, tab2.id)

    const after = workspaceCommands.removeTab.reduce(s, 'tab-2')
    expect(getEntityData<TabGroupData>(after, tgId)?.activeTabId).toBe('tab-1')
  })

  it('removes sole tab and closes the pane', () => {
    const store = createWorkspace()
    const tgId = getChildren(store, ROOT_ID)[0]!
    const tab1: Entity = { id: 'tab-1', data: { type: 'tab', label: 'A', contentType: 'editor', contentRef: '/a' } }
    let s = workspaceCommands.createTab.reduce(store, tgId, tab1)
    s = workspaceCommands.setActiveTab.reduce(s, tgId, tab1.id)

    const after = workspaceCommands.removeTab.reduce(s, 'tab-1')
    expect(getChildren(after, ROOT_ID)).not.toContain(tgId)
  })
})

// V3: 2026-03-26-workspace-containers-prd.md
describe('workspaceCommands.splitPane', () => {
  it('wraps a pane in a split with a new empty tabgroup', () => {
    const store = createWorkspace()
    const tgId = getChildren(store, ROOT_ID)[0]!

    const after = workspaceCommands.splitPane.reduce(store, tgId, 'horizontal')

    const rootChildren = getChildren(after, ROOT_ID)
    expect(rootChildren).toHaveLength(1)
    const splitId = rootChildren[0]!
    const splitData = getEntityData<SplitData>(after, splitId)
    expect(splitData?.type).toBe('split')
    expect(splitData?.direction).toBe('horizontal')
    expect(splitData?.sizes).toEqual([0.5, 'flex'])

    const splitChildren = getChildren(after, splitId)
    expect(splitChildren).toHaveLength(2)
    expect(splitChildren[0]).toBe(tgId)
    const newTgData = getEntityData<TabGroupData>(after, splitChildren[1]!)
    expect(newTgData?.type).toBe('tabgroup')
  })
})

// V8: 2026-03-26-workspace-containers-prd.md
describe('workspaceCommands.closePane', () => {
  it('removes pane and collapses parent split if 1 child left', () => {
    const store = createWorkspace()
    const tgId = getChildren(store, ROOT_ID)[0]!

    const withSplit = workspaceCommands.splitPane.reduce(store, tgId, 'horizontal')
    const splitId = getChildren(withSplit, ROOT_ID)[0]!
    const newTgId = getChildren(withSplit, splitId)[1]!

    const after = workspaceCommands.closePane.reduce(withSplit, newTgId)

    expect(getChildren(after, ROOT_ID)).toEqual([tgId])
    expect(after.entities[splitId]).toBeUndefined()
  })
})

// V13: 2026-03-26-workspace-containers-prd.md
describe('serialization', () => {
  it('serializeWorkspace filters meta entities', () => {
    const store = createWorkspace()
    const json = serializeWorkspace(store)
    const parsed = JSON.parse(json) as NormalizedData
    for (const id of Object.keys(parsed.entities)) {
      expect(id.startsWith('__')).toBe(false)
    }
  })

  it('deserializeWorkspace roundtrips correctly', () => {
    const store = createWorkspace()
    const tgId = getChildren(store, ROOT_ID)[0]!
    const tab: Entity = { id: 'tab-1', data: { type: 'tab', label: 'A', contentType: 'editor', contentRef: '/a' } }
    let withTab = workspaceCommands.createTab.reduce(store, tgId, tab)
    withTab = workspaceCommands.setActiveTab.reduce(withTab, tgId, tab.id)

    const json = serializeWorkspace(withTab)
    const restored = deserializeWorkspace(json)

    expect(getChildren(restored, ROOT_ID)).toEqual(getChildren(withTab, ROOT_ID))
    expect(getEntityData<TabData>(restored, 'tab-1')?.label).toBe('A')
  })

  it('deserializeWorkspace falls back to createWorkspace on invalid input', () => {
    const restored = deserializeWorkspace('invalid json{{{')
    const rootChildren = getChildren(restored, ROOT_ID)
    expect(rootChildren).toHaveLength(1)
    expect(getEntityData<TabGroupData>(restored, rootChildren[0]!)?.type).toBe('tabgroup')
  })
})

// V3: 2026-03-26-workspace-containers-prd.md
describe('workspace plugin', () => {
  it('returns a plugin with name and commands', () => {
    const plugin = workspace()
    expect(plugin.name).toBe('workspace')
    expect(plugin.commands).toBeDefined()
    expect(plugin.commands!.setActiveTab).toBeDefined()
    expect(plugin.commands!.resize).toBeDefined()
    expect(plugin.commands!.addTab).toBeDefined()
    expect(plugin.commands!.removeTab).toBeDefined()
    expect(plugin.commands!.splitPane).toBeDefined()
    expect(plugin.commands!.closePane).toBeDefined()
  })
})
