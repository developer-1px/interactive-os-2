// V1~V6: 2026-03-28-workspace-sync-prd.md
import { describe, it, expect, beforeEach } from 'vitest'
import {
  createWorkspace,
  workspaceCommands,
  syncFromExternal,
  findTabgroup,
  resetUidCounter,
} from '../plugins/workspaceStore'
import type { ExternalItem } from '../plugins/workspaceStore'
import { getChildren, getEntityData } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData, Entity } from '../store/types'

interface TestItem extends ExternalItem {
  label?: string
}

function toTab(item: TestItem): Entity {
  return {
    id: `tab-${item.id}`,
    data: { type: 'tab', label: String(item.label ?? item.id), contentType: 'test', contentRef: item.id },
  }
}

function getTabRefs(store: NormalizedData): string[] {
  const refs: string[] = []
  for (const entity of Object.values(store.entities)) {
    const d = entity.data as Record<string, unknown> | undefined
    if (d?.type === 'tab' && typeof d.contentRef === 'string') {
      refs.push(d.contentRef)
    }
  }
  return refs
}

describe('syncFromExternal', () => {
  beforeEach(() => resetUidCounter())

  // V1: S1 — 새 item 추가 → workspace에 tab 생성
  it('V1: adds tabs for new external items', () => {
    const ws = createWorkspace()
    const items: TestItem[] = [
      { id: 'session-1', label: 'S1' },
      { id: 'session-2', label: 'S2' },
    ]

    const result = syncFromExternal(ws, items, toTab)

    const refs = getTabRefs(result)
    expect(refs).toContain('session-1')
    expect(refs).toContain('session-2')
  })

  // V2: S4 — item 제거 → workspace에서 tab 삭제
  it('V2: removes tabs for items no longer in external list', () => {
    let ws = createWorkspace()
    const tgId = findTabgroup(ws)!

    ws = workspaceCommands.createTab.reduce(ws, tgId, {
      id: 'tab-s1',
      data: { type: 'tab', label: 'S1', contentType: 'test', contentRef: 'session-1' },
    })
    ws = workspaceCommands.setActiveTab.reduce(ws, tgId, 'tab-s1')
    ws = workspaceCommands.createTab.reduce(ws, tgId, {
      id: 'tab-s2',
      data: { type: 'tab', label: 'S2', contentType: 'test', contentRef: 'session-2' },
    })
    ws = workspaceCommands.setActiveTab.reduce(ws, tgId, 'tab-s2')

    // Remove session-1 from external
    const result = syncFromExternal(ws, [{ id: 'session-2' }], toTab)

    const refs = getTabRefs(result)
    expect(refs).not.toContain('session-1')
    expect(refs).toContain('session-2')
  })

  // V3: E1 — 동시 3개 항목 추가
  it('V3: batch adds multiple items, last becomes active', () => {
    const ws = createWorkspace()
    const items: TestItem[] = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ]

    const result = syncFromExternal(ws, items, toTab)

    const refs = getTabRefs(result)
    expect(refs).toEqual(expect.arrayContaining(['a', 'b', 'c']))
    expect(refs).toHaveLength(3)

    // Last added should be active
    const tgId = findTabgroup(result)!
    const tgData = getEntityData<{ activeTabId: string }>(result, tgId)
    expect(tgData?.activeTabId).toBe('tab-c')
  })

  // V4: E2 — split 상태에서 마지막 tab 제거 → split collapse
  it('V4: split collapses when last tab removed from one side', () => {
    let ws = createWorkspace()
    const tgId = findTabgroup(ws)!

    // Add a tab, then split
    ws = workspaceCommands.createTab.reduce(ws, tgId, {
      id: 'tab-a',
      data: { type: 'tab', label: 'A', contentType: 'test', contentRef: 'a' },
    })
    ws = workspaceCommands.setActiveTab.reduce(ws, tgId, 'tab-a')
    ws = workspaceCommands.splitPane.reduce(ws, tgId, 'horizontal')

    // Find the new tabgroup and add a tab
    const rootChildren = getChildren(ws, ROOT_ID)
    const splitId = rootChildren.find(id =>
      (getEntityData<{ type: string }>(ws, id))?.type === 'split',
    )!
    const splitChildren = getChildren(ws, splitId)
    const newTgId = splitChildren[splitChildren.length - 1]!

    ws = workspaceCommands.createTab.reduce(ws, newTgId, {
      id: 'tab-b',
      data: { type: 'tab', label: 'B', contentType: 'test', contentRef: 'b' },
    })
    ws = workspaceCommands.setActiveTab.reduce(ws, newTgId, 'tab-b')

    // Remove item 'b' → should collapse split
    const result = syncFromExternal(ws, [{ id: 'a' }], toTab)

    // Should have no split at root level
    const resultRootChildren = getChildren(result, ROOT_ID)
    const hasSplit = resultRootChildren.some(id =>
      (getEntityData<{ type: string }>(result, id))?.type === 'split',
    )
    expect(hasSplit).toBe(false)

    // Tab 'a' should still exist
    expect(getTabRefs(result)).toContain('a')
  })

  // V5: E3 — 빈 items + 빈 workspace → 변경 없음
  it('V5: empty items on empty workspace returns same reference', () => {
    const ws = createWorkspace()
    const result = syncFromExternal(ws, [], toTab)
    expect(result).toBe(ws)
  })

  // V6: E5 — 동일 items 반복 호출 → 동일 참조 반환
  it('V6: no-change sync returns same reference', () => {
    let ws = createWorkspace()
    const tgId = findTabgroup(ws)!
    ws = workspaceCommands.createTab.reduce(ws, tgId, {
      id: 'tab-x',
      data: { type: 'tab', label: 'X', contentType: 'test', contentRef: 'x' },
    })
    ws = workspaceCommands.setActiveTab.reduce(ws, tgId, 'tab-x')

    const result = syncFromExternal(ws, [{ id: 'x' }], toTab)
    expect(result).toBe(ws)
  })
})
