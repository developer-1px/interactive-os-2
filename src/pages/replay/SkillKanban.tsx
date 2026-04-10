// @useState-hatch — sessionCards: real-time SSE stream state, not OS axis/store material
// @useState-hatch — tick: timer-driven re-render for elapsed time display
// @useState-hatch — openCardId: dialog open state, not OS axis/store material
import { useState, useEffect, useRef } from 'react'
import { subscribeTimeline } from '../viewer/timelineSSE'
import { useActiveSessions, type ActiveSession } from './useActiveSessions'
import type { TimelineEvent } from '../viewer/groupEvents'
import { ax } from '@styles/ax'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
import { PanelHeader } from '@os/ui/PanelHeader'
import { CloseIndicator } from '@os/ui/indicators'
import './SkillKanban.css'

// --- Pipeline column rules ---

const PLANNING_SKILLS = new Set(['discuss', 'prd', 'plan', 'story', 'ia', 'wireframe', 'cast', 'conflict', 'ideal', 'design-spec'])
const RUNNING_SKILLS = new Set(['go', 'do', 'fix', 'improve', 'use'])
const DONE_SKILLS = new Set(['close', 'retrospect'])

type PipelineStage = 'planning' | 'running' | 'done'

function classifySkill(skill: string): PipelineStage {
  if (DONE_SKILLS.has(skill)) return 'done'
  if (RUNNING_SKILLS.has(skill)) return 'running'
  if (PLANNING_SKILLS.has(skill)) return 'planning'
  return 'planning'
}

// --- Session card ---

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

interface SessionCard {
  id: string
  label: string
  stage: PipelineStage
  lastSkill: string
  skillCount: number
  toolCount: number
  startTs: number
  lastTs: number
  lastMessages: string[]
  lastUserMessage: string
  allMessages: ChatMessage[]
}

function deriveStage(skills: string[]): { stage: PipelineStage; lastSkill: string } {
  if (skills.length === 0) return { stage: 'planning', lastSkill: '' }
  const lastSkill = skills[skills.length - 1]
  return { stage: classifySkill(lastSkill), lastSkill }
}

// --- Build from .jsonl events ---

function extractSessionCard(events: TimelineEvent[], session: ActiveSession): SessionCard {
  const skills: string[] = []
  let toolCount = 0
  let startTs = 0
  let lastTs = 0
  const messages: string[] = []
  const allMessages: ChatMessage[] = []

  for (const evt of events) {
    const ts = Date.parse(evt.ts)
    if (!startTs) startTs = ts
    lastTs = ts

    if (evt.type === 'tool_use' && evt.tool === 'Skill' && evt.text) {
      skills.push(evt.text)
    } else if (evt.type === 'tool_use') {
      toolCount++
    }
    if (evt.type === 'user' && evt.text) {
      messages.push(evt.text)
      allMessages.push({ role: 'user', text: evt.text })
    }
    if (evt.type === 'assistant' && evt.text) {
      messages.push(evt.text)
      allMessages.push({ role: 'assistant', text: evt.text })
    }
  }

  const { stage, lastSkill } = deriveStage(skills)
  const lastMessages = messages.slice(-3).map(m => m.slice(0, 80))
  const userMessages = allMessages.filter(m => m.role === 'user')
  const lastUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].text.slice(0, 60) : session.label

  return {
    id: session.id,
    label: session.label,
    stage,
    lastSkill,
    skillCount: skills.length,
    toolCount,
    startTs: startTs || session.mtime,
    lastTs: lastTs || session.mtime,
    lastMessages,
    lastUserMessage,
    allMessages,
  }
}

// --- Format helpers ---

function formatElapsed(ms: number): string {
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  return `${hr}h ${min % 60}m`
}

// --- Conversation dialog ---

function ConversationDialog({ card, onClose }: { card: SessionCard | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)

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

  const md = card
    ? card.allMessages.map(m => m.role === 'user' ? `> **User:** ${m.text}` : m.text).join('\n\n---\n\n')
    : ''

  return (
    <dialog ref={dialogRef} className="border-none bg-transparent fvm-dialog" onClick={handleBackdropClick}>
      <div className={`fvm-modal ${ax({ surface: 'trap', layout: 'column', shape: 'xl', scroll: 'hidden' })}`} onClick={e => e.stopPropagation()}>
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
        <div className={`${ax({ flex: '1' })} kanban-dialog-body`}>
          {card && <MarkdownViewer content={md} codeVariant="compact" />}
        </div>
      </div>
    </dialog>
  )
}

// --- Card + Column components ---

const STAGE_LABELS: Record<PipelineStage, string> = { planning: 'Planning', running: 'Running', done: 'Done' }

function SessionCardView({ card, onClick }: { card: SessionCard; onClick: () => void }) {
  const now = Date.now()
  const elapsed = formatElapsed(now - card.startTs)
  const skillTag = card.lastSkill ? `/${card.lastSkill}` : ''

  return (
    <div
      className={ax({ recipe: 'container', surface: 'display', border: 'subtle', shape: 'md', layout: 'column', gap: 'xs', interactive: 'item' })}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <span className={ax({ clamp: '1', weight: 'medium', textStyle: 'caption' })}>{card.lastUserMessage}</span>
      <span className={ax({ text: 'muted', textStyle: 'caption' })}>
        {card.toolCount} tools · {elapsed}{skillTag ? ` · ${skillTag}` : ''}
      </span>
      {card.lastMessages.length > 0 && (
        <div className="kanban-card-preview">
          <MarkdownViewer content={card.lastMessages.join('\n\n')} prose={false} codeVariant="compact" />
        </div>
      )}
    </div>
  )
}

function KanbanColumn({ stage, cards, onCardClick }: { stage: PipelineStage; cards: SessionCard[]; onCardClick: (id: string) => void }) {
  return (
    <div className={ax({ layout: 'column', gap: 'xs', flex: '1', surface: 'sunken', shape: 'xl', padding: 'md' })}>
      <div className={ax({ textStyle: 'overline', text: 'secondary', padding: 'xs' })}>
        {STAGE_LABELS[stage]} {cards.length}
      </div>
      {cards.map(card => <SessionCardView key={card.id} card={card} onClick={() => onCardClick(card.id)} />)}
    </div>
  )
}

// --- Page component ---

export default function SkillKanban() {
  const sessions = useActiveSessions()
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([])
  const [, setTick] = useState(0)
  const [openCardId, setOpenCardId] = useState<string | null>(null)

  // Load initial data from all sessions
  useEffect(() => {
    if (sessions.length === 0) return
    let cancelled = false

    async function loadInitial() {
      const cards: SessionCard[] = []
      for (const session of sessions) {
        try {
          const res = await fetch(`/api/agent-ops/timeline?session=${session.id}&tail=2000`)
          if (!res.ok) continue
          const { events } = await res.json() as { events: TimelineEvent[] }
          cards.push(extractSessionCard(events, session))
        } catch { /* ignore */ }
      }
      if (!cancelled) {
        cards.sort((a, b) => b.lastTs - a.lastTs)
        setSessionCards(cards)
      }
    }

    loadInitial()
    return () => { cancelled = true }
  }, [sessions])

  // SSE subscriptions for real-time updates
  useEffect(() => {
    if (sessions.length === 0) return
    const unsubs: (() => void)[] = []

    for (const session of sessions) {
      const unsub = subscribeTimeline(session.id, (evt) => {
        const data = evt as unknown as { type: string; tool?: string; text?: string; ts: string }

        setSessionCards(prev => {
          const idx = prev.findIndex(c => c.id === session.id)
          if (idx === -1) return prev
          const card = { ...prev[idx] }
          const ts = Date.parse(data.ts)
          card.lastTs = ts

          if (data.type === 'skill_start' && data.text) {
            card.lastSkill = data.text
            card.stage = classifySkill(data.text)
            card.skillCount++
          } else if (data.type === 'tool_use' && data.tool !== 'Skill') {
            card.toolCount++
          }
          if (data.type === 'user' && data.text) {
            card.lastMessages = [...card.lastMessages, data.text.slice(0, 80)].slice(-3)
            card.lastUserMessage = data.text.slice(0, 60)
            card.allMessages = [...card.allMessages, { role: 'user', text: data.text }]
          }
          if (data.type === 'assistant' && data.text) {
            card.lastMessages = [...card.lastMessages, data.text.slice(0, 80)].slice(-3)
            card.allMessages = [...card.allMessages, { role: 'assistant', text: data.text }]
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

  // Tick for elapsed time
  const hasActive = sessionCards.some(c => c.stage !== 'done')
  useEffect(() => {
    if (!hasActive) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [hasActive])

  const planning = sessionCards.filter(c => c.stage === 'planning')
  const running = sessionCards.filter(c => c.stage === 'running')
  const done = sessionCards.filter(c => c.stage === 'done')

  const openCard = openCardId ? sessionCards.find(c => c.id === openCardId) : null

  return (
    <div className={ax({ layout: 'fill' })}>
      <div className={ax({ layout: 'spread', padding: 'md' })}>
        <div className={ax({ layout: 'bar', gap: 'sm' })}>
          <h2 className={ax({ text: 'bright', textStyle: 'section' })}>Skill Kanban</h2>
          <span className={ax({ text: 'muted', textStyle: 'caption' })}>
            {planning.length} planning · {running.length} running · {done.length} done
          </span>
        </div>
      </div>
      {sessionCards.length === 0 && (
        <div className={ax({ padding: 'md', text: 'muted', textStyle: 'caption' })}>
          Waiting — sessions will appear here when skills are executed
        </div>
      )}
      <div className={ax({ layout: 'row', gap: 'md', padding: 'md', flex: '1' })}>
        <KanbanColumn stage="planning" cards={planning} onCardClick={setOpenCardId} />
        <KanbanColumn stage="running" cards={running} onCardClick={setOpenCardId} />
        <KanbanColumn stage="done" cards={done} onCardClick={setOpenCardId} />
      </div>
      <ConversationDialog card={openCard ?? null} onClose={() => setOpenCardId(null)} />
    </div>
  )
}
