/**
 * Live chatStore + entities/chat fixtures → NormalizedData (TreeGrid columns).
 *
 * 각 entity 의 data 는 { cells: [key, value] } shape — TreeGrid columns mode 가 직접 읽음.
 * 중첩 객체(usage)는 한 단계 더 children.
 */
import { createStore, ROOT_ID } from '@os/schema'
import type { Entity, NormalizedData } from '@os/store/types'
import {
  chatSessionFixtures,
  chatUiStateFixture,
  CHAT_UI_STATE_ID,
} from '@entities/chat'
import type { ChatSession } from './chatStore'

interface CellNode {
  id: string
  data: { cells: [string, string] }
}

function pushNode(
  entities: Record<string, CellNode>,
  id: string,
  key: string,
  value: string,
): void {
  entities[id] = { id, data: { cells: [key, value] } }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function formatScalar(v: unknown): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (typeof v === 'string') return v.length > 100 ? `${v.slice(0, 100)}...` : v
  return String(v)
}

function appendFields(
  entities: Record<string, CellNode>,
  relationships: Record<string, string[]>,
  parentId: string,
  data: Record<string, unknown>,
): void {
  const childIds: string[] = []
  for (const [key, value] of Object.entries(data)) {
    const childId = `${parentId}.${key}`
    if (isPlainObject(value)) {
      pushNode(entities, childId, key, `{${Object.keys(value).length} keys}`)
      const grandIds: string[] = []
      for (const [k2, v2] of Object.entries(value)) {
        const gid = `${childId}.${k2}`
        if (isPlainObject(v2)) {
          pushNode(entities, gid, k2, `{${Object.keys(v2).length} keys}`)
        } else if (Array.isArray(v2)) {
          pushNode(entities, gid, k2, `[${v2.length} items]`)
        } else {
          pushNode(entities, gid, k2, formatScalar(v2))
        }
        grandIds.push(gid)
      }
      relationships[childId] = grandIds
    } else if (Array.isArray(value)) {
      pushNode(entities, childId, key, `[${value.length} items]`)
      const arrIds: string[] = []
      value.forEach((item, i) => {
        const aid = `${childId}.${i}`
        pushNode(entities, aid, `[${i}]`, formatScalar(item))
        arrIds.push(aid)
      })
      relationships[childId] = arrIds
    } else {
      pushNode(entities, childId, key, formatScalar(value))
    }
    childIds.push(childId)
  }
  relationships[parentId] = childIds
}

export interface BuildSource {
  liveSessions: ChatSession[]
  liveActiveId: string | null
  liveUi: { sidebarMode: string; bottomVisible: boolean }
}

/** Build TreeGrid-compatible data for a list of entity blobs */
function buildTree(
  groups: Array<{ id: string; label: string; data: Record<string, unknown> }>,
): NormalizedData {
  const entities: Record<string, CellNode> = {}
  const relationships: Record<string, string[]> = {}
  const rootChildren: string[] = []
  for (const g of groups) {
    pushNode(entities, g.id, g.label, '')
    appendFields(entities, relationships, g.id, g.data)
    rootChildren.push(g.id)
  }
  relationships[ROOT_ID] = rootChildren
  return createStore({ entities: entities as unknown as Record<string, Entity>, relationships })
}

/** Live store — chatStore + 페이지 UI state (전달받음) */
export function buildLiveStateTree(src: BuildSource): NormalizedData {
  if (src.liveSessions.length === 0) return buildTree([])
  const groups = src.liveSessions.map(s => ({
    id: s.id,
    label: `${s.id}  ·  ${s.state}`,
    data: s as unknown as Record<string, unknown>,
  }))
  groups.push({
    id: '__ui__',
    label: '__ui__  ·  page state',
    data: { activeSessionId: src.liveActiveId, ...src.liveUi } as Record<string, unknown>,
  })
  return buildTree(groups)
}

/** Fixtures — entities/chat 에서 직접 (라이브 비어있을 때 폴백 또는 비교 용) */
export function buildFixtureTree(): NormalizedData {
  const groups = Object.entries(chatSessionFixtures).map(([id, s]) => ({
    id,
    label: `${id}  ·  ${s.state}`,
    data: s as unknown as Record<string, unknown>,
  }))
  groups.push({
    id: CHAT_UI_STATE_ID,
    label: `${CHAT_UI_STATE_ID}  ·  ui singleton`,
    data: chatUiStateFixture as unknown as Record<string, unknown>,
  })
  return buildTree(groups)
}
