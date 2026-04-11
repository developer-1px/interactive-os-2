// ② agent-dashboard-prd.md
// @useState-hatch — sessionCards: real-time SSE stream state, not OS axis/store material
// @useState-hatch — tick: timer-driven re-render for elapsed time display
// @useState-hatch — openCardId: dialog open state, not OS axis/store material
// @useState-hatch — fileContent/activeFilePath: modal-local file fetch state, not OS store material
// @useState-hatch — splitSizes: SplitPane local resize state
// @useState-hatch — showEmptyDone: toggle for empty done sessions
// @useMemo-hatch — tabData: derived from card.touchedFiles, not OS store
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { subscribeTimeline } from '../viewer/timelineSSE'
import { useActiveSessions, type ActiveSession } from './useActiveSessions'
import type { TimelineEvent } from '../viewer/groupEvents'
import type { NormalizedData, Entity } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import type { PaneSize } from '@os/ui/SplitPane'
import { ax } from '@styles/ax'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
import { SplitPane } from '@os/ui/SplitPane'
import { FilePreview } from '@os/ui/FilePreview'
import { TabList } from '@os/ui/TabList'
import { PanelHeader } from '@os/ui/PanelHeader'
import { CloseIndicator } from '@os/ui/indicators'
import './SkillKanban.css'

const PLANNING_SKILLS = new Set(['discuss', 'prd', 'plan', 'story', 'ia', 'wireframe', 'cast', 'conflict', 'ideal', 'design-spec'])
const DEVELOPING_SKILLS = new Set(['go', 'do', 'fix'])
const REVIEWING_SKILLS = new Set(['simplify', 'improve', 'use', 'improve-design', 'retrospect', 'close'])
const MAX_MESSAGES = 200
const MAX_CARD_FILES = 5
const STALE_THRESHOLD_MS = 5 * 60 * 1000
const STATE_DEBOUNCE_MS = 3_000

type AgentState = 'waiting' | 'active' | 'done'
type Phase = 'planning' | 'developing' | 'reviewing'

interface ChatMessage { role: 'user' | 'assistant'; text: string }

interface SessionCard {
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

function derivePhase(skills: string[]): Phase {
  if (skills.length === 0) return 'planning'
  const last = skills[skills.length - 1]
  if (REVIEWING_SKILLS.has(last)) return 'reviewing'
  if (DEVELOPING_SKILLS.has(last)) return 'developing'
  if (PLANNING_SKILLS.has(last)) return 'planning'
  return 'planning'
}

function deriveAgentState(active: boolean, lastEventType: string): AgentState {
  if (active) {
    if (lastEventType === 'assistant') return 'waiting'
    return 'active' // tool_use, user, or other
  }
  return 'done'
}

function deriveCurrentActivity(lastEventType: string, lastTool: string, lastFilePath: string, lastText: string, lastAssistantMsg: string): string {
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

function pushMessage(messages: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  const next = [...messages, msg]
  return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next
}

function basename(filePath: string): string {
  return filePath.split('/').pop() ?? filePath
}

function extractSessionCard(events: TimelineEvent[], session: ActiveSession, now: number): SessionCard {
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

    // Track last event info for deriving state
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

function formatElapsed(ms: number): string {
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  return `${hr}h ${min % 60}m`
}

function buildTabData(files: string[]): NormalizedData {
  const entities: Record<string, Entity> = {}
  const ids: string[] = []
  for (const f of files) {
    entities[f] = { id: f, label: basename(f) }
    ids.push(f)
  }
  return { entities, relationships: { [ROOT_ID]: ids } }
}

const PHASE_LABELS: Record<Phase, string> = { planning: 'Planning', developing: 'Developing', reviewing: 'Reviewing' }

function SessionDetailModal({ card, onClose }: { card: SessionCard | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [splitSizes, setSplitSizes] = useState<PaneSize[]>([0.35, 'flex'])
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const hasFiles = card !== null && card.touchedFiles.length > 0

  useEffect(() => {
    if (card && card.touchedFiles.length > 0) {
      setActiveFilePath(card.touchedFiles[0])
    } else {
      setActiveFilePath(null)
      setFileContent(null)
      setFileError(null)
    }
  }, [card])

  useEffect(() => {
    if (!activeFilePath) {
      setFileContent(null)
      setFileError(null)
      return
    }
    let cancelled = false
    setFileContent(null)
    setFileError(null)

    fetch(`/api/fs/file?path=${encodeURIComponent(activeFilePath)}`)
      .then(res => {
        if (!res.ok) throw new Error('File not found')
        return res.text()
      })
      .then(text => { if (!cancelled) setFileContent(text) })
      .catch(() => { if (!cancelled) setFileError('File not found') })

    return () => { cancelled = true }
  }, [activeFilePath])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (card && !el.open) el.showModal()
    if (!card && el.open) el.close()
  }, [card])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const handler = () => onClose()
    el.addEventListener('close', handler)
    return () => el.removeEventListener('close', handler)
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.defaultPrevented) return
    if (e.target === dialogRef.current) onClose()
  }

  const handleTabChange = useCallback((data: NormalizedData) => {
    const rootChildren = data.relationships[ROOT_ID]
    if (!rootChildren) return
    for (const id of rootChildren) {
      const entity = data.entities[id]
      if (entity && entity['selected']) {
        setActiveFilePath(id)
        return
      }
    }
  }, [])

  const md = card
    ? card.allMessages.map(m => m.role === 'user' ? `> **User:** ${m.text}` : m.text).join('\n\n---\n\n')
    : ''

  const tabData = useMemo(() => card ? buildTabData(card.touchedFiles) : null, [card?.touchedFiles])

  return (
    <dialog ref={dialogRef} className="border-none bg-transparent kanban-fullscreen-dialog" onClick={handleBackdropClick}>
      <div className={`kanban-fullscreen-modal ${ax({ surface: 'trap', layout: 'column', shape: 'xl', scroll: 'hidden' })}`} onClick={e => e.stopPropagation()}>
        <PanelHeader axes={{ layout: 'spread' }}>
          {card && (
            <div className={ax({ layout: 'bar', gap: 'sm', textStyle: 'caption', text: 'muted' })}>
              <span className={ax({ text: 'bright', weight: 'medium' })}>{card.label}</span>
              <span>{card.allMessages.length} messages</span>
              <span>{card.toolCount} tools</span>
              {card.lastSkill && <span>/{card.lastSkill}</span>}
            </div>
          )}
          <button className={ax({ surface: 'ghost', recipe: 'control-sm', layout: 'center', text: 'secondary', interactive: 'button' })} onClick={onClose}>
            <CloseIndicator />
          </button>
        </PanelHeader>
        <div className={ax({ flex: '1', layout: 'fill' })}>
          {card && (
            <SplitPane direction="horizontal" sizes={splitSizes} onResize={setSplitSizes}>
              <div className={ax({ layout: 'column', scroll: 'y', flex: '1' })}>
                <MarkdownViewer content={md} codeVariant="compact" />
              </div>
              <div className={ax({ layout: 'column', flex: '1' })}>
                {hasFiles && tabData ? (
                  <>
                    <TabList data={tabData} onChange={handleTabChange} aria-label="Modified files" />
                    <div className={ax({ flex: '1', scroll: 'y' })}>
                      {fileError && (
                        <div className={ax({ padding: 'lg', text: 'muted', textStyle: 'caption' })}>{fileError}</div>
                      )}
                      {fileContent !== null && activeFilePath && (
                        <FilePreview content={fileContent} filename={basename(activeFilePath)} />
                      )}
                      {fileContent === null && !fileError && (
                        <div className={ax({ padding: 'lg', text: 'muted', textStyle: 'caption' })}>Loading...</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className={ax({ padding: 'lg', text: 'muted', textStyle: 'caption', layout: 'center', flex: '1' })}>
                    No files modified
                  </div>
                )}
              </div>
            </SplitPane>
          )}
        </div>
      </div>
    </dialog>
  )
}

const COLUMN_CONFIG: { state: AgentState; label: string }[] = [
  { state: 'waiting', label: 'Waiting' },
  { state: 'active', label: 'Active' },
  { state: 'done', label: 'Done' },
]

function SessionCardView({ card, onClick }: { card: SessionCard; onClick: () => void }) {
  const elapsed = formatElapsed(Date.now() - card.startTs)
  const fileNames = card.touchedFiles.map(basename)
  const displayFiles = fileNames.slice(0, MAX_CARD_FILES)
  const moreCount = fileNames.length - MAX_CARD_FILES

  const primaryText = card.agentState === 'waiting'
    ? (card.lastAssistantMsg || card.label)
    : card.currentActivity || card.label

  const STATE_CSS: Record<AgentState, string> = { active: 'kanban-card-active', waiting: 'kanban-card-waiting', done: '' }
  const axClass = ax({ recipe: 'container', surface: 'display', border: card.agentState === 'waiting' ? undefined : 'subtle', shape: 'md', layout: 'column', gap: 'xs', interactive: 'item' })
  const cls = STATE_CSS[card.agentState] ? `${STATE_CSS[card.agentState]} ${axClass}` : axClass

  return (
    <div
      className={cls}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <span className={ax({ clamp: '1', weight: 'medium', textStyle: 'caption' })}>{primaryText}</span>
      <div className={ax({ layout: 'bar', gap: 'sm', textStyle: 'caption', text: 'muted' })}>
        <span className={ax({ recipe: 'badge', tone: 'neutral-dim' })}>{PHASE_LABELS[card.phase]}</span>
        <span>{elapsed}</span>
        <span>{card.toolCount} tools</span>
      </div>
      {card.isStale && (
        <span className={ax({ textStyle: 'caption', text: 'primary', tone: 'warning-dim', recipe: 'badge' })}>5분+ 무응답</span>
      )}
      {card.skills.length > 0 && (
        <span className={ax({ text: 'secondary', textStyle: 'caption', clamp: '1' })}>
          {card.skills.join(' \u2192 ')}
        </span>
      )}
      {displayFiles.length > 0 && (
        <span className={ax({ text: 'muted', textStyle: 'caption', clamp: '2' })}>
          {displayFiles.join(', ')}{moreCount > 0 ? ` +${moreCount} more` : ''}
        </span>
      )}
    </div>
  )
}

function KanbanColumn({ label, cards, onCardClick, emptyToggle }: {
  label: string
  cards: SessionCard[]
  onCardClick: (id: string) => void
  emptyToggle?: React.ReactNode
}) {
  return (
    <div className={ax({ layout: 'column', gap: 'xs', flex: '1', surface: 'sunken', shape: 'xl', padding: 'md', scroll: 'y' })}>
      <div className={ax({ textStyle: 'overline', text: 'secondary', padding: 'xs' })}>
        {label} {cards.length}
      </div>
      {cards.length === 0 && !emptyToggle && (
        <div className={ax({ padding: 'md', text: 'muted', textStyle: 'caption' })}>세션 없음</div>
      )}
      {cards.map(card => <SessionCardView key={card.id} card={card} onClick={() => onCardClick(card.id)} />)}
      {emptyToggle}
    </div>
  )
}

export default function SkillKanban() {
  const sessions = useActiveSessions({ activeOnly: false })
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([])
  const [, setTick] = useState(0)
  const [openCardId, setOpenCardId] = useState<string | null>(null)
  // @useState-hatch — showEmptyDone: toggle for empty done sessions display
  const [showEmptyDone, setShowEmptyDone] = useState(false)

  useEffect(() => {
    if (sessions.length === 0) return
    let cancelled = false

    async function loadInitial() {
      const now = Date.now()
      const results = await Promise.allSettled(
        sessions.map(async session => {
          const res = await fetch(`/api/agent-ops/timeline?session=${session.id}&tail=2000`)
          if (!res.ok) return null
          const { events } = await res.json() as { events: TimelineEvent[] }
          return extractSessionCard(events, session, now)
        })
      )
      if (cancelled) return
      const cards = results
        .filter((r): r is PromiseFulfilledResult<SessionCard | null> => r.status === 'fulfilled')
        .map(r => r.value)
        .filter((c): c is SessionCard => c !== null)
      cards.sort((a, b) => b.lastTs - a.lastTs)
      setSessionCards(cards)
    }

    loadInitial()
    return () => { cancelled = true }
  }, [sessions])

  useEffect(() => {
    if (sessions.length === 0) return
    const unsubs: (() => void)[] = []

    for (const session of sessions) {
      const unsub = subscribeTimeline(session.id, (evt) => {
        const data = evt as unknown as { type: string; tool?: string; text?: string; ts: string; filePath?: string }

        setSessionCards(prev => {
          const idx = prev.findIndex(c => c.id === session.id)
          if (idx === -1) return prev
          const now = Date.now()
          const card = { ...prev[idx], lastTs: Date.parse(data.ts) }

          if (data.type === 'skill_start' && data.text) {
            card.lastSkill = data.text
            card.skills = [...card.skills, data.text]
            card.phase = derivePhase(card.skills)
            card.skillCount++
          } else if (data.type === 'tool_use' && data.tool !== 'Skill') {
            card.toolCount++
            if (data.filePath && !card.touchedFiles.includes(data.filePath)) {
              card.touchedFiles = [...card.touchedFiles, data.filePath]
              card.hasOutput = true
            }
          }
          if ((data.type === 'user' || data.type === 'assistant') && data.text) {
            card.allMessages = pushMessage(card.allMessages, { role: data.type as 'user' | 'assistant', text: data.text })
            if (data.type === 'assistant') card.lastAssistantMsg = data.text.slice(0, 60)
          }

          // Update derived fields
          const prevState = card.agentState
          const prevActivity = card.currentActivity
          const prevToolCount = card.toolCount
          if (data.type === 'tool_use' || data.type === 'user' || data.type === 'assistant') {
            card.lastEventType = data.type
            const newState = deriveAgentState(session.active, data.type)
            if (newState !== card.agentState && now - card.stateChangedAt >= STATE_DEBOUNCE_MS) {
              card.agentState = newState
              card.stateChangedAt = now
            }
            card.currentActivity = deriveCurrentActivity(
              data.type,
              data.type === 'tool_use' ? (data.tool ?? '') : '',
              data.type === 'tool_use' ? (data.filePath ?? '') : '',
              data.type === 'tool_use' ? (data.text ?? '') : '',
              card.lastAssistantMsg,
            )
          }
          card.isStale = session.active && card.lastTs > 0 && (now - card.lastTs > STALE_THRESHOLD_MS)

          // No-op guard: skip re-render if nothing visible changed
          if (card.agentState === prevState && card.currentActivity === prevActivity && card.toolCount === prevToolCount) {
            return prev
          }

          const updated = [...prev]
          updated[idx] = card
          return updated
        })
      })
      unsubs.push(unsub)
    }

    return () => unsubs.forEach(u => u())
  }, [sessions])

  const hasActive = sessionCards.some(c => c.agentState !== 'done')
  useEffect(() => {
    if (!hasActive) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [hasActive])

  const waiting = sessionCards.filter(c => c.agentState === 'waiting')
  const active = sessionCards.filter(c => c.agentState === 'active')
  const doneWithOutput = sessionCards.filter(c => c.agentState === 'done' && c.hasOutput)
  const doneEmpty = sessionCards.filter(c => c.agentState === 'done' && !c.hasOutput)
  const doneCards = showEmptyDone ? [...doneWithOutput, ...doneEmpty] : doneWithOutput
  const openCard = openCardId ? sessionCards.find(c => c.id === openCardId) : null

  const emptyDoneToggle = doneEmpty.length > 0 ? (
    <button
      className={ax({ surface: 'ghost', recipe: 'control-sm', textStyle: 'caption', text: 'muted', interactive: 'button' })}
      onClick={() => setShowEmptyDone(v => !v)}
    >
      {showEmptyDone ? '빈 세션 숨기기' : `빈 세션 ${doneEmpty.length}개`}
    </button>
  ) : undefined

  return (
    <div className={ax({ layout: 'fill' })}>
      <div className={ax({ layout: 'spread', padding: 'md' })}>
        <div className={ax({ layout: 'bar', gap: 'sm' })}>
          <h2 className={ax({ text: 'bright', textStyle: 'section' })}>Agent Dashboard</h2>
          <span className={ax({ text: 'muted', textStyle: 'caption' })}>
            {waiting.length} waiting · {active.length} active · {doneWithOutput.length + doneEmpty.length} done
          </span>
        </div>
      </div>
      {sessionCards.length === 0 && (
        <div className={ax({ padding: 'md', text: 'muted', textStyle: 'caption' })}>
          세션이 없습니다 — 스킬을 실행하면 여기에 표시됩니다
        </div>
      )}
      <div className={ax({ layout: 'row', gap: 'md', padding: 'md', flex: '1' })}>
        {COLUMN_CONFIG.map(col => {
          const cardsByState: Record<AgentState, SessionCard[]> = { waiting, active, done: doneCards }
          return (
            <KanbanColumn
              key={col.state}
              label={col.label}
              cards={cardsByState[col.state]}
              onCardClick={setOpenCardId}
              emptyToggle={col.state === 'done' ? emptyDoneToggle : undefined}
            />
          )
        })}
      </div>
      <SessionDetailModal card={openCard ?? null} onClose={() => setOpenCardId(null)} />
    </div>
  )
}
