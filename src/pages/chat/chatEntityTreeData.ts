/**
 * ChatSessionData / ChatUiStateData fixtures → NormalizedData (tree shape) 변환.
 *
 * 각 entity 가 root 의 자식 1개. 그 아래 자식 = entity 의 키별 leaf.
 * usage 처럼 중첩 객체는 한 단계 더 children.
 */
import { createStore, ROOT_ID } from '@os/schema'
import type { NormalizedData } from '@os/store/types'
import {
  chatSessionFixtures,
  chatUiStateFixture,
  CHAT_UI_STATE_ID,
} from '@entities/chat'

interface BuildAcc {
  entities: Record<string, { id: string; data: { label: string } }>
}

function pushNode(acc: BuildAcc, id: string, label: string): void {
  acc.entities[id] = { id, data: { label } }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** 한 entity 의 키-값 들을 자식 leaf 로 평탄화 */
function appendFields(acc: BuildAcc, parentId: string, data: Record<string, unknown>, relationships: Record<string, string[]>): void {
  const childIds: string[] = []
  for (const [key, value] of Object.entries(data)) {
    const childId = `${parentId}.${key}`
    if (isPlainObject(value)) {
      pushNode(acc, childId, key)
      const grandIds: string[] = []
      for (const [k2, v2] of Object.entries(value)) {
        const gid = `${childId}.${k2}`
        pushNode(acc, gid, `${k2}: ${formatValue(v2)}`)
        grandIds.push(gid)
      }
      relationships[childId] = grandIds
    } else if (Array.isArray(value)) {
      pushNode(acc, childId, `${key} [${value.length}]`)
      const arrIds: string[] = []
      value.forEach((item, i) => {
        const aid = `${childId}.${i}`
        pushNode(acc, aid, `${i}: ${formatValue(item)}`)
        arrIds.push(aid)
      })
      relationships[childId] = arrIds
    } else {
      pushNode(acc, childId, `${key}: ${formatValue(value)}`)
    }
    childIds.push(childId)
  }
  relationships[parentId] = childIds
}

function formatValue(v: unknown): string {
  if (v === null) return 'null'
  if (typeof v === 'string') return v.length > 80 ? `"${v.slice(0, 80)}..."` : `"${v}"`
  return String(v)
}

export function buildChatEntityTree(): NormalizedData {
  const acc: BuildAcc = { entities: {} }
  const relationships: Record<string, string[]> = {}
  const rootChildren: string[] = []

  for (const [sessionId, session] of Object.entries(chatSessionFixtures)) {
    pushNode(acc, sessionId, `${sessionId}  ·  ${session.state}`)
    appendFields(acc, sessionId, session as unknown as Record<string, unknown>, relationships)
    rootChildren.push(sessionId)
  }

  pushNode(acc, CHAT_UI_STATE_ID, `${CHAT_UI_STATE_ID}  ·  ui singleton`)
  appendFields(acc, CHAT_UI_STATE_ID, chatUiStateFixture as unknown as Record<string, unknown>, relationships)
  rootChildren.push(CHAT_UI_STATE_ID)

  relationships[ROOT_ID] = rootChildren

  return createStore({ entities: acc.entities, relationships })
}
