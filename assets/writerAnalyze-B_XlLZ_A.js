var e=`import { writerState } from './writerStore'
import { sendWriterMessage } from './writerChatBridge'
import type { SentenceRole, SentenceRelation } from './writerSchema'

export type RoleMap = Record<string, SentenceRole>
export type RelationMap = Record<string, SentenceRelation[]>
export interface AnalysisResult { roles: RoleMap; relations: RelationMap }

const VALID_ROLES = new Set<string>(['claim', 'evidence', 'reasoning', 'context', 'counter', 'transition'])

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

  const sentenceList = sentences.map(s => \`[\${s.id}] \${s.content}\`).join('\\n')
  const prompt = \`각 문장을 분석해줘.

1. 역할 분류: claim, evidence, reasoning, context, counter, transition 중 하나.
   - claim: 핵심 주장/요점
   - evidence: 근거/데이터/예시
   - reasoning: 논증/연결/해석
   - context: 배경/전제/상황
   - counter: 반론/양보/제한
   - transition: 전환/연결

2. 문장 간 관계: supports, contradicts, elaborates, conditions 중 하나.

문장 목록:
\${sentenceList}

JSON만 응답해. 형식:
\\\`\\\`\\\`json
{
  "roles": {"w5":"claim","w8":"evidence"},
  "relations": {"w8":[{"target":"w5","type":"supports"}]}
}
\\\`\\\`\\\`
설명 없이 JSON 코드 블록만.\`

  sendWriterMessage(sessionId, prompt)
}

const JSON_FENCE_RE = /\`\`\`json\\n([\\s\\S]*?)\`\`\`/g
const VALID_RELATION_TYPES = new Set<string>(['supports', 'contradicts', 'elaborates', 'conditions'])

function extractJson(text: string): unknown | null {
  let last: string | null = null
  for (const m of text.matchAll(JSON_FENCE_RE)) {
    last = m[1]
  }
  if (!last) {
    const bare = text.match(/\\{[\\s\\S]*\\}/)
    if (bare) last = bare[0]
  }
  if (!last) return null
  try { return JSON.parse(last.trim()) } catch { return null }
}

/** Extract full analysis (roles + relations) from assistant message */
export function extractAnalysis(text: string): AnalysisResult | null {
  const parsed = extractJson(text)
  if (!parsed || typeof parsed !== 'object') return null

  const obj = parsed as Record<string, unknown>

  // Extract roles
  const rolesObj = (obj.roles ?? obj) as Record<string, string>
  const roles: RoleMap = {}
  for (const [id, role] of Object.entries(rolesObj)) {
    if (typeof role === 'string' && VALID_ROLES.has(role)) {
      roles[id] = role as SentenceRole
    }
  }
  if (Object.keys(roles).length === 0) return null

  // Extract relations
  const relations: RelationMap = {}
  const relObj = obj.relations as Record<string, Array<{ target: string; type: string }>> | undefined
  if (relObj && typeof relObj === 'object') {
    for (const [id, rels] of Object.entries(relObj)) {
      if (!Array.isArray(rels)) continue
      const valid: SentenceRelation[] = []
      for (const r of rels) {
        if (r && typeof r.target === 'string' && typeof r.type === 'string' && VALID_RELATION_TYPES.has(r.type)) {
          valid.push({ target: r.target, type: r.type as SentenceRelation['type'] })
        }
      }
      if (valid.length > 0) relations[id] = valid
    }
  }

  return { roles, relations }
}
`;export{e as default};