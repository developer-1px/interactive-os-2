var e=`/**
 * SubAgent data model (SSOT).
 * @invariant §1 데이터 모델의 TypeScript 실체. 타입 정의만 포함, 로직 금지.
 */
import type { TimelineEvent } from '../viewer/groupEvents'
import type { ParsedSession } from './parseJsonl'

/** subagents/agent-{hash}.meta.json 파싱 결과 */
export type SubAgentMeta = {
  agentHash: string
  agentType: string
  description: string
  prompt?: string
  createdAt: number
}

/** watch 대상 SubAgent 파일 쌍 (jsonl + meta) */
export type SubAgentFile = {
  parentSessionId: string
  agentHash: string
  jsonlPath: string
  metaPath: string
  mtime: number
}

/** SubAgent 하나의 런타임 상태 (부모 viewer 옆 패널 단위) */
export type SubAgentSession = {
  sessionId: string
  agentHash: string
  parentSessionId: string
  parentToolUseId?: string
  agentType: string
  description: string
  prompt?: string
  events: TimelineEvent[]
  parsed?: ParsedSession
  startedAt: number
  endedAt: number | null
  lastTs: number
  isActive: boolean
}

/** 매칭 키: 부모 Agent tool_use ↔ SubAgentSession */
export type SubAgentMatchKey = {
  description: string
  toolUseTs: number
  toolUseId?: string
}

/** useActiveSessions 반환 타입 슈퍼셋 */
export type ActiveSessionWithSubs = {
  id: string
  label: string
  mtime: number
  active: boolean
  subagents: SubAgentSession[]
}

/** SSE/폴링 서버 응답 파일 목록 확장 */
export type SessionFilesManifest = {
  sessionId: string
  jsonlPath: string
  subagentFiles: SubAgentFile[]
}
`;export{e as default};