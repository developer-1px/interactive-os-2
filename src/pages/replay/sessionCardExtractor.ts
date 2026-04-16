// SSE TimelineEvent → SessionCard 변환 + Kanban NormalizedData 빌드
import type { TimelineEvent } from '../viewer/groupEvents'
import type { ActiveSession } from './useActiveSessions'
import type { NormalizedData, Entity } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'

// ── Constants ──

const PLANNING_SKILLS = new Set(['discuss', 'prd', 'plan', 'story', 'ia', 'wireframe', 'cast', 'conflict', 'ideal', 'design-spec'])
const DEVELOPING_SKILLS = new Set(['go', 'do', 'fix'])
const REVIEWING_SKILLS = new Set(['simplify', 'improve', 'use', 'improve-design', 'retrospect', 'close'])
export const MAX_MESSAGES = 200
export const STALE_THRESHOLD_MS = 5 * 60 * 1000
export const STATE_DEBOUNCE_MS = 3_000

// ── Types ──

export type AgentState = 'waiting' | 'active' | 'done'
export type Phase = 'planning' | 'developing' | 'reviewing'

export interface ChatMessage { role: 'user' | 'assistant'; text: string }

export interface SessionCard {
  id: string
  label: string
  agentState: AgentState
  phase: Phase
  currentActivity: string
  lastEventType: string
  hasOutput: boolean
  isStale: boolean
  stateChangedAt: number
  lastAssistantMsg: string
  lastSkill: string
  skills: string[]
  touchedFiles: string[]
  skillCount: number
  toolCount: number
  startTs: number
  lastTs: number
  allMessages: ChatMessage[]
}

// ── Helpers ──

export function derivePhase(skills: string[]): Phase {
  if (skills.length === 0) return 'planning'
  const last = skills[skills.length - 1]
  if (REVIEWING_SKILLS.has(last)) return 'reviewing'
  if (DEVELOPING_SKILLS.has(last)) return 'developing'
  if (PLANNING_SKILLS.has(last)) return 'planning'
  return 'planning'
}

export function deriveAgentState(active: boolean, lastEventType: string): AgentState {
  if (active) {
    if (lastEventType === 'assistant') return 'waiting'
    return 'active'
  }
  return 'done'
}

export function deriveCurrentActivity(lastEventType: string, lastTool: string, lastFilePath: string, lastText: string, lastAssistantMsg: string): string {
  if (lastEventType === 'tool_use') {
    if (lastTool === 'Edit' || lastTool === 'Write') {
      return lastFilePath ? `${basename(lastFilePath)} 편집 중` : '파일 편집 중'
    }
    if (lastTool === 'Bash') return '명령 실행 중'
    if (lastTool === 'Grep' || lastTool === 'Glob' || lastTool === 'Read') return '코드 탐색 중'
    if (lastTool === 'Agent') return '서브에이전트 실행 중'
    if (lastTool === 'Skill' && lastText) return `/${lastText} 실행 중`
    return '도구 실행 중'
  }
  if (lastEventType === 'assistant') {
    return lastAssistantMsg || '응답 대기 중'
  }
  if (lastEventType === 'user') return '입력 처리 중'
  return ''
}

function findLastAssistantMsg(allMessages: ChatMessage[]): string {
  for (let i = allMessages.length - 1; i >= 0; i--) {
    if (allMessages[i].role === 'assistant') return allMessages[i].text.slice(0, 60)
  }
  return ''
}

export function pushMessage(messages: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  const next = [...messages, msg]
  return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next
}

function basename(filePath: string): string {
  return filePath.split('/').pop() ?? filePath
}

// ── Main extractor ──

export function extractSessionCard(events: TimelineEvent[], session: ActiveSession, now: number): SessionCard {
  const skills: string[] = []
  const fileSet = new Set<string>()
  let toolCount = 0
  let startTs = 0
  let lastTs = 0
  let allMessages: ChatMessage[] = []
  let lastEventType = ''
  let lastTool = ''
  let lastFilePath = ''
  let lastText = ''

  for (const evt of events) {
    const ts = Date.parse(evt.ts)
    if (!startTs) startTs = ts
    lastTs = ts

    if (evt.type === 'tool_use' && evt.tool === 'Skill' && evt.text) {
      skills.push(evt.text)
    } else if (evt.type === 'tool_use') {
      toolCount++
      if (evt.filePath) fileSet.add(evt.filePath)
    }
    if ((evt.type === 'user' || evt.type === 'assistant') && evt.text) {
      allMessages = pushMessage(allMessages, { role: evt.type, text: evt.text })
    }

    if (evt.type === 'tool_use' || evt.type === 'user' || evt.type === 'assistant') {
      lastEventType = evt.type
      if (evt.type === 'tool_use') {
        lastTool = evt.tool ?? ''
        lastFilePath = evt.filePath ?? ''
        lastText = evt.text ?? ''
      }
    }
  }

  const touchedFiles = [...fileSet]
  const hasOutput = touchedFiles.length > 0
  const phase = derivePhase(skills)
  const agentState = deriveAgentState(session.active, lastEventType)
  const isStale = session.active && lastTs > 0 && (now - lastTs > STALE_THRESHOLD_MS)
  const lastAssistantMsg = findLastAssistantMsg(allMessages)
  const currentActivity = deriveCurrentActivity(lastEventType, lastTool, lastFilePath, lastText, lastAssistantMsg)
  const lastSkill = skills.length > 0 ? skills[skills.length - 1] : ''

  return {
    id: session.id, label: session.label,
    agentState, phase, currentActivity, lastEventType, hasOutput, isStale,
    stateChangedAt: now, lastAssistantMsg, lastSkill, skills, touchedFiles,
    skillCount: skills.length, toolCount,
    startTs: startTs || session.mtime, lastTs: lastTs || session.mtime,
    allMessages,
  }
}

// ── Kanban NormalizedData builder ──

export function formatElapsed(ms: number): string {
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  return `${hr}h ${min % 60}m`
}

const PHASE_LABELS: Record<Phase, string> = { planning: 'Planning', developing: 'Developing', reviewing: 'Reviewing' }

export const COL_WAITING = 'col-waiting'
export const COL_ACTIVE = 'col-active'
export const COL_DONE = 'col-done'

function buildFileConflictMap(cards: SessionCard[]): Map<string, string[]> {
  const fileToSessions = new Map<string, string[]>()
  for (const card of cards) {
    if (card.agentState === 'done') continue
    for (const f of card.touchedFiles) {
      const list = fileToSessions.get(f)
      if (list) list.push(card.id)
      else fileToSessions.set(f, [card.id])
    }
  }
  return fileToSessions
}

function getConflictFiles(cardId: string, fileConflictMap: Map<string, string[]>, touchedFiles: string[]): string[] {
  const conflicts: string[] = []
  for (const f of touchedFiles) {
    const sessions = fileConflictMap.get(f)
    if (sessions && sessions.length > 1 && sessions.includes(cardId)) {
      conflicts.push(basename(f))
    }
  }
  return conflicts
}

export function cardsToKanbanData(cards: SessionCard[], now: number): NormalizedData {
  const entities: Record<string, Entity> = {
    [COL_WAITING]: { id: COL_WAITING, label: 'Waiting', data: { title: 'Waiting' } },
    [COL_ACTIVE]: { id: COL_ACTIVE, label: 'Active', data: { title: 'Active' } },
    [COL_DONE]: { id: COL_DONE, label: 'Done', data: { title: 'Done' } },
  }
  const waiting: string[] = []
  const active: string[] = []
  const done: string[] = []

  const fileConflictMap = buildFileConflictMap(cards)

  for (const card of cards) {
    const elapsed = formatElapsed(now - card.startTs)
    const primaryText = card.agentState === 'waiting'
      ? (card.lastAssistantMsg || card.label)
      : card.currentActivity || card.label
    const conflictFiles = getConflictFiles(card.id, fileConflictMap, card.touchedFiles)
    const subtitle = [PHASE_LABELS[card.phase], elapsed, `${card.toolCount} tools`].join(' · ')
      + (card.isStale ? ' · 5분+ 무응답' : '')
      + (card.lastSkill ? ` · /${card.lastSkill}` : '')
      + (conflictFiles.length > 0 ? ` · conflict: ${conflictFiles.join(', ')}` : '')

    entities[card.id] = {
      id: card.id,
      label: primaryText,
      data: {
        title: primaryText,
        subtitle,
        agentState: card.agentState,
        isStale: card.isStale,
        conflict: conflictFiles.length > 0,
      },
    }

    if (card.agentState === 'waiting') waiting.push(card.id)
    else if (card.agentState === 'active') active.push(card.id)
    else done.push(card.id)
  }

  return {
    entities,
    relationships: {
      [ROOT_ID]: [COL_WAITING, COL_ACTIVE, COL_DONE],
      [COL_WAITING]: waiting,
      [COL_ACTIVE]: active,
      [COL_DONE]: done,
    },
  }
}
