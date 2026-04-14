// ② agent-dashboard-prd.md
// @useState-hatch — sessionCards: real-time SSE stream state, not OS axis/store material
// @useState-hatch — tick: timer-driven re-render for elapsed time display
// @useState-hatch — openCardId: overlay open state, useOverlay가 관리
// @useState-hatch — fileContent/activeFilePath: modal-local file fetch state, not OS store material
// @useState-hatch — showEmptyDone: toggle for empty done sessions
// @useState-hatch — showOlderDone: toggle for older (not today) done sessions
// @useMemo-hatch — tabData: derived from card.touchedFiles, not OS store
// @useState-hatch — below imports use useState for view+interaction state
import { useState, useEffect, useCallback, useMemo } from 'react'
import { createDomainContext } from '@os/layout'
import { subscribeTimeline } from '../viewer/timelineSSE'
import { useActiveSessions, type ActiveSession } from './useActiveSessions'
import type { TimelineEvent } from '../viewer/groupEvents'
import type { NormalizedData, Entity } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { ax } from '@styles/ax'
import { Button } from '@os/ui/Button'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
import { showcaseMdConfig } from '../showcase/mdConfig'
import { FilePreview } from '@os/ui/FilePreview'
import { TabList } from '@os/ui/TabList'
import { PanelHeader } from '@os/ui/PanelHeader'
import { CloseIndicator } from '@os/ui/indicators'
import { useOverlay } from '@os/overlay/useOverlay'
import { FlatLayout } from '@os/ui/FlatLayout'
import { definePage } from '@os/layout/flatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { Kanban } from '@os/ui/Kanban'
import './SkillKanban.css'

const PLANNING_SKILLS = new Set(['discuss', 'prd', 'plan', 'story', 'ia', 'wireframe', 'cast', 'conflict', 'ideal', 'design-spec'])
const DEVELOPING_SKILLS = new Set(['go', 'do', 'fix'])
const REVIEWING_SKILLS = new Set(['simplify', 'improve', 'use', 'improve-design', 'retrospect', 'close'])
const MAX_MESSAGES = 200
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
    return 'active'
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

const PHASE_LABELS: Record<Phase, string> = { planning: 'Planning', developing: 'Developing', reviewing: 'Reviewing' }

// ── SessionCard[] → NormalizedData for <Kanban> ──

const COL_WAITING = 'col-waiting'
const COL_ACTIVE = 'col-active'
const COL_DONE = 'col-done'

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

function cardsToKanbanData(cards: SessionCard[], now: number): NormalizedData {
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

// ── Session detail widgets ───────────────────────────

function buildTabData(files: string[]): NormalizedData {
  const entities: Record<string, Entity> = {}
  const ids: string[] = []
  for (const f of files) {
    entities[f] = { id: f, label: basename(f) }
    ids.push(f)
  }
  return { entities, relationships: { [ROOT_ID]: ids } }
}

// ── Session Detail Context (Pull model) ──

interface SessionDetailContextValue {
  content: string
  files: string[]
}

const [SessionDetailProvider, useSessionDetail] = createDomainContext<SessionDetailContextValue>('SessionDetail')

function ChatViewerWidget() {
  const { content } = useSessionDetail()
  return (
    <div className={ax({ flex: '1', scroll: 'y' })}>
      <MarkdownViewer content={content} codeVariant="compact" config={showcaseMdConfig} />
    </div>
  )
}

function FilePanelWidget() {
  const { files } = useSessionDetail()
  const fileList = files
  // @useState-hatch — activeFilePath: modal-local file selection, not OS axis material
  const [activeFilePath, setActiveFilePath] = useState<string | null>(fileList?.[0] ?? null)
  // @useState-hatch — fileContent: modal-local file fetch state, not OS store material
  const [fileContent, setFileContent] = useState<string | null>(null)
  // @useState-hatch — fileError: modal-local file fetch error, not OS store material
  const [fileError, setFileError] = useState<string | null>(null)

  const tabData = useMemo(() => fileList ? buildTabData(fileList) : null, [fileList])
  const handleTabActivate = useCallback((nodeId: string) => { setActiveFilePath(nodeId) }, [])

  useEffect(() => {
    if (!activeFilePath) { setFileContent(null); setFileError(null); return }
    let cancelled = false
    setFileContent(null)
    setFileError(null)
    fetch(`/api/fs/file?path=${encodeURIComponent(activeFilePath)}`)
      .then(res => { if (!res.ok) throw new Error('File not found'); return res.text() })
      .then(text => { if (!cancelled) setFileContent(text) })
      .catch(() => { if (!cancelled) setFileError('File not found') })
    return () => { cancelled = true }
  }, [activeFilePath])

  if (!fileList || fileList.length === 0 || !tabData) {
    return <div className={ax({ padding: 'lg', text: 'muted', textStyle: 'caption', layout: 'center', flex: '1' })}>No files modified</div>
  }

  return (
    <>
      <TabList data={tabData} onActivate={handleTabActivate} aria-label="Modified files" />
      <div className={ax({ flex: '1', scroll: 'y' })}>
        {fileError && <div className={ax({ padding: 'lg', text: 'muted', textStyle: 'caption' })}>{fileError}</div>}
        {fileContent !== null && activeFilePath && <FilePreview content={fileContent} filename={basename(activeFilePath)} />}
        {fileContent === null && !fileError && <div className={ax({ padding: 'lg', text: 'muted', textStyle: 'caption' })}>Loading...</div>}
      </div>
    </>
  )
}

const sessionDetailRegistry = createWidgetRegistry({
  ChatViewer: ChatViewerWidget,
  FilePanel: FilePanelWidget,
})

const sessionDetailLayout = definePage({
  entities: {
    root: { data: { type: 'split', direction: 'horizontal', sizes: [0.35, 'flex'] }, children: ['chat', 'files'] },
    chat: { data: { type: 'widget', widget: 'ChatViewer' } },
    files: { data: { type: 'widget', widget: 'FilePanel' } },
  },
})

function SessionDetailModal({ card, onClose }: { card: SessionCard | null; onClose: () => void }) {
  const { isOpen, open, close, contentRef } = useOverlay({ type: 'modal' })

  // card → overlay sync
  useEffect(() => {
    if (card && !isOpen) open()
    if (!card && isOpen) close()
  }, [!!card]) // eslint-disable-line react-hooks/exhaustive-deps -- open/close stable, track card presence only

  // overlay close (ESC/backdrop) → parent sync
  useEffect(() => {
    if (!isOpen && card) onClose()
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps -- onClose identity irrelevant

  const md = card
    ? card.allMessages.map(m => m.role === 'user' ? `> **User:** ${m.text}` : m.text).join('\n\n---\n\n')
    : ''

  const detailCtx = useMemo<SessionDetailContextValue | null>(() => {
    if (!card) return null
    return { content: md, files: card.touchedFiles }
  }, [card, md])

  return (
    <dialog
      ref={contentRef as React.RefObject<HTMLDialogElement>}
      className={`kanban-detail-dialog ${ax({ surface: 'overlay', width: 'full', shape: 'xl', layout: 'stack', scroll: 'hidden' })}`}
      aria-label="Session detail"
    >
      <PanelHeader axes={{ layout: 'spread' }}>
        {card && (
          <div className={ax({ layout: 'bar', gap: 'sm', textStyle: 'caption', text: 'muted' })}>
            <span className={ax({ text: 'bright', weight: 'medium' })}>{card.label}</span>
            <span>{card.allMessages.length} messages</span>
            <span>{card.toolCount} tools</span>
            {card.lastSkill && <span>/{card.lastSkill}</span>}
          </div>
        )}
        <Button icon onClick={close}>
          <CloseIndicator />
        </Button>
      </PanelHeader>
      <div className={ax({ flex: '1', layout: 'fill' })}>
        {card && detailCtx && (
          <SessionDetailProvider value={detailCtx}>
            <FlatLayout data={sessionDetailLayout} registry={sessionDetailRegistry} aria-label="Session detail" />
          </SessionDetailProvider>
        )}
      </div>
    </dialog>
  )
}

// ── Main page ───────────────────────────

export default function SkillKanban() {
  const sessions = useActiveSessions({ activeOnly: false })
  // @useState-hatch — sessionCards: real-time SSE stream state, not OS axis/store material
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([])
  // @useState-hatch — tick: timer-driven re-render for elapsed time display
  const [, setTick] = useState(0)
  // @useState-hatch — openCardId: overlay open state, useOverlay가 관리
  const [openCardId, setOpenCardId] = useState<string | null>(null)

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

  const kanbanData = cardsToKanbanData(sessionCards, Date.now())

  const handleActivate = useCallback((nodeId: string) => {
    // column 노드는 무시, card만 열기
    if (nodeId === COL_WAITING || nodeId === COL_ACTIVE || nodeId === COL_DONE) return
    setOpenCardId(nodeId)
  }, [])

  const openCard = openCardId ? sessionCards.find(c => c.id === openCardId) : null

  const waiting = sessionCards.filter(c => c.agentState === 'waiting').length
  const active = sessionCards.filter(c => c.agentState === 'active').length
  const doneCount = sessionCards.filter(c => c.agentState === 'done').length

  return (
    <div className={ax({ layout: 'fill', scroll: 'hidden' })}>
      <PanelHeader axes={{ layout: 'spread' }}>
        <div className={ax({ layout: 'bar', gap: 'sm' })}>
          <span className={ax({ text: 'bright', weight: 'medium' })}>Agent Dashboard</span>
          <span className={ax({ text: 'muted', textStyle: 'caption' })}>
            {waiting} waiting · {active} active · {doneCount} done
          </span>
        </div>
      </PanelHeader>
      {sessionCards.length === 0 && (
        <div className={ax({ padding: 'md', text: 'muted', textStyle: 'caption' })}>
          세션이 없습니다 — 스킬을 실행하면 여기에 표시됩니다
        </div>
      )}
      {sessionCards.length > 0 && (
        <div className={ax({ flex: '1', scroll: 'hidden', padding: 'md' })}>
          <Kanban data={kanbanData} onActivate={handleActivate} aria-label="Agent Dashboard" />
        </div>
      )}
      <SessionDetailModal card={openCard ?? null} onClose={() => setOpenCardId(null)} />
    </div>
  )
}
