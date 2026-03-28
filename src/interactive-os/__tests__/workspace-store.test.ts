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
    const cmd = workspaceCommands.setActiveTab(tgId, 'tab-1')
    const after = cmd.execute(store)
    const data = getEntityData<TabGroupData>(after, tgId)
    expect(data?.activeTabId).toBe('tab-1')
  })
})

// V6: 2026-03-26-workspace-containers-prd.md
describe('workspaceCommands.resize', () => {
  it('updates sizes on a split entity', () => {
    const store = createWorkspace()
    const tgId = getChildren(store, ROOT_ID)[0]!
    const splitCmd = workspaceCommands.splitPane(tgId, 'horizontal')
    const withSplit = splitCmd.execute(store)
    const splitId = getChildren(withSplit, ROOT_ID)[0]!
    const splitData = getEntityData<SplitData>(withSplit, splitId)
    expect(splitData?.sizes).toEqual([0.5, 'flex'])

    const resizeCmd = workspaceCommands.resize(splitId, [0.3, 'flex'])
    const resized = resizeCmd.execute(withSplit)
    expect(getEntityData<SplitData>(resized, splitId)?.sizes).toEqual([0.3, 'flex'])
  })
})

// V7: 2026-03-26-workspace-containers-prd.md
describe('workspaceCommands.addTab', () => {
  it('adds a tab and sets it as active', () => {
    const store = createWorkspace()
    const tgId = getChildren(store, ROOT_ID)[0]!
    const tab: Entity = { id: 'tab-1', data: { type: 'tab', label: 'File.ts', contentType: 'editor', contentRef: '/file.ts' } }
    const cmd = workspaceCommands.addTab(tgId, tab)
    const after = cmd.execute(store)

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
    let s = workspaceCommands.addTab(tgId, tab1).execute(store)
    s = workspaceCommands.addTab(tgId, tab2).execute(s)
    s = workspaceCommands.addTab(tgId, tab3).execute(s)

    const cmd = workspaceCommands.removeTab('tab-2')
    const after = cmd.execute(s)
    expect(getChildren(after, tgId)).not.toContain('tab-2')
    expect(getEntityData<TabGroupData>(after, tgId)?.activeTabId).toBe('tab-3')
  })

  it('removes last tab and activates previous sibling', () => {
    const store = createWorkspace()
    const tgId = getChildren(store, ROOT_ID)[0]!
    const tab1: Entity = { id: 'tab-1', data: { type: 'tab', label: 'A', contentType: 'editor', contentRef: '/a' } }
    const tab2: Entity = { id: 'tab-2', data: { type: 'tab', label: 'B', contentType: 'editor', contentRef: '/b' } }
    let s = workspaceCommands.addTab(tgId, tab1).execute(store)
    s = workspaceCommands.addTab(tgId, tab2).execute(s)

    const cmd = workspaceCommands.removeTab('tab-2')
    const after = cmd.execute(s)
    expect(getEntityData<TabGroupData>(after, tgId)?.activeTabId).toBe('tab-1')
  })

  it('removes sole tab and closes the pane', () => {
    const store = createWorkspace()
    const tgId = getChildren(store, ROOT_ID)[0]!
    const tab1: Entity = { id: 'tab-1', data: { type: 'tab', label: 'A', contentType: 'editor', contentRef: '/a' } }
    const s = workspaceCommands.addTab(tgId, tab1).execute(store)

    const cmd = workspaceCommands.removeTab('tab-1')
    const after = cmd.execute(s)
    expect(getChildren(after, ROOT_ID)).not.toContain(tgId)
  })
})

// V3: 2026-03-26-workspace-containers-prd.md
describe('workspaceCommands.splitPane', () => {
  it('wraps a pane in a split with a new empty tabgroup', () => {
    const store = createWorkspace()
    const tgId = getChildren(store, ROOT_ID)[0]!

    const cmd = workspaceCommands.splitPane(tgId, 'horizontal')
    const after = cmd.execute(store)

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

    const splitCmd = workspaceCommands.splitPane(tgId, 'horizontal')
    const withSplit = splitCmd.execute(store)
    const splitId = getChildren(withSplit, ROOT_ID)[0]!
    const newTgId = getChildren(withSplit, splitId)[1]!

    const closeCmd = workspaceCommands.closePane(newTgId)
    const after = closeCmd.execute(withSplit)

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
    const withTab = workspaceCommands.addTab(tgId, tab).execute(store)

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
