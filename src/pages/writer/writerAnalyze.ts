import { writerState } from './writerStore'
import { sendWriterMessage } from './writerChatBridge'
import type { SentenceRole } from './writerSchema'

export type RoleMap = Record<string, SentenceRole>

const VALID_ROLES = new Set<string>(['fact', 'interpretation', 'evidence', 'opinion'])

/** Build analyze prompt with sentence list and send via chat */
export function requestAnalysis(sessionId: string): void {
  const data = writerState.getData()
  const sentences: { id: string; content: string }[] = []

  for (const [id, entity] of Object.entries(data.entities)) {
    const d = entity?.data as Record<string, unknown> | undefined
    if (d?.type === 'sentence' && d.content) {
      sentences.push({ id, content: d.content as string })
    }
  }

  if (sentences.length === 0) return

  const sentenceList = sentences.map(s => `[${s.id}] ${s.content}`).join('\n')
  const prompt = `각 문장의 수사학적 역할을 분류해줘. 반드시 fact, interpretation, evidence, opinion 중 하나.

문장 목록:
${sentenceList}

JSON만 응답해. 예시: \`\`\`json\n{"w5":"fact","w8":"opinion"}\n\`\`\`
설명 없이 JSON 코드 블록만.`

  sendWriterMessage(sessionId, prompt)
}

const JSON_FENCE_RE = /```json\n([\s\S]*?)```/g

/** Extract role map from assistant message text */
export function extractRoleMap(text: string): RoleMap | null {
  let last: string | null = null
  for (const m of text.matchAll(JSON_FENCE_RE)) {
    last = m[1]
  }
  if (!last) {
    const bare = text.match(/\{[\s\S]*\}/)
    if (bare) last = bare[0]
  }
  if (!last) return null

  try {
    const parsed = JSON.parse(last.trim()) as Record<string, string>
    const roles: RoleMap = {}
    for (const [id, role] of Object.entries(parsed)) {
      if (VALID_ROLES.has(role)) {
        roles[id] = role as SentenceRole
      }
    }
    return Object.keys(roles).length > 0 ? roles : null
  } catch {
    return null
  }
}

/** Apply role map to sentence entities in writerState */
export function applyRoles(roles: RoleMap): void {
  const data = writerState.getData()
  const nextEntities = { ...data.entities }
  let changed = false

  for (const [id, role] of Object.entries(roles)) {
    const entity = nextEntities[id]
    if (!entity) continue
    const d = entity.data as Record<string, unknown> | undefined
    if (d?.type === 'sentence') {
      nextEntities[id] = { ...entity, data: { ...d, role } }
      changed = true
    }
  }

  if (changed) {
    writerState.setData({ ...data, entities: nextEntities })
  }
}
