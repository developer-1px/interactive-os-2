// ② agent-dashboard-prd.md
// @useState-hatch — sessionCards: real-time SSE stream state, not OS axis/store material
// @useState-hatch — tick: timer-driven re-render for elapsed time display
// @useState-hatch — openCardId: overlay open state, useOverlay가 관리
// @useState-hatch — below imports use useState for view+interaction state
import { useState, useEffect, useCallback } from 'react'
import { subscribeTimeline } from '../finder/timelineSSE'
import { useActiveSessions } from './useActiveSessions'
import type { TimelineEvent } from '../finder/groupEvents'
import { ax } from '@styles/ax'
import { PanelHeader } from '@os/ui/PanelHeader'
import { Kanban } from '@os/ui/Kanban'
import {
  type SessionCard,
  extractSessionCard,
  derivePhase,
  deriveAgentState,
  deriveCurrentActivity,
  pushMessage,
  cardsToKanbanData,
  STALE_THRESHOLD_MS,
  STATE_DEBOUNCE_MS,
  COL_WAITING,
  COL_ACTIVE,
  COL_DONE,
} from './sessionCardExtractor'
import { SessionDetailModal } from './SessionDetailModal'
import './SkillKanban.css'

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

  // eslint-disable-next-line react-hooks/purity
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
    <div className={ax({ layout: 'fill' })}>
      <PanelHeader axes={{ layout: 'spread' }}>
        <div className={ax({ layout: 'bar' })}>
          <span className={ax({ })}>Agent Dashboard</span>
          <span className={ax({ textStyle: 'caption' })}>
            {waiting} waiting · {active} active · {doneCount} done
          </span>
        </div>
      </PanelHeader>
      {sessionCards.length === 0 && (
        <div className={ax({ textStyle: 'caption' })}>
          세션이 없습니다 — 스킬을 실행하면 여기에 표시됩니다
        </div>
      )}
      {sessionCards.length > 0 && (
        <div className={ax({ flex: '1' })}>
          <Kanban data={kanbanData} onActivate={handleActivate} aria-label="Agent Dashboard" />
        </div>
      )}
      <SessionDetailModal card={openCard ?? null} onClose={() => setOpenCardId(null)} />
    </div>
  )
}
