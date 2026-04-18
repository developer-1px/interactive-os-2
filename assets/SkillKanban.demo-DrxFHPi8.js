var e=`/* eslint-disable react-refresh/only-export-components */
// SkillKanban demo — mock SessionCards drive the kanban view without SSE.
import { useState } from 'react'
import { ax } from '@styles/ax'
import { Kanban } from '@os/ui/Kanban'
import { PanelHeader } from '@os/ui/PanelHeader'
import {
  type SessionCard,
  cardsToKanbanData,
  COL_WAITING,
  COL_ACTIVE,
  COL_DONE,
} from './sessionCardExtractor'
import { SessionDetailModal } from './SessionDetailModal'

export const meta = {
  slug: 'skill-kanban',
  category: 'page',
  label: 'SkillKanban (Agent Dashboard)',
}

function makeCard(overrides: Partial<SessionCard>): SessionCard {
  const now = Date.now()
  return {
    id: 'mock',
    label: 'mock session',
    agentState: 'waiting',
    phase: 'planning',
    currentActivity: '',
    lastEventType: '',
    hasOutput: false,
    isStale: false,
    stateChangedAt: now,
    lastAssistantMsg: '',
    lastSkill: '',
    skills: [],
    touchedFiles: [],
    skillCount: 0,
    toolCount: 0,
    startTs: now - 60_000,
    lastTs: now,
    allMessages: [],
    ...overrides,
  }
}

const MOCK_CARDS: SessionCard[] = [
  makeCard({
    id: 's1', label: 'catalog follow-focus',
    agentState: 'waiting', phase: 'planning',
    currentActivity: 'planning next step', lastSkill: 'discuss',
    skills: ['discuss'], skillCount: 1,
  }),
  makeCard({
    id: 's2', label: 'replay demos',
    agentState: 'active', phase: 'developing',
    currentActivity: 'editing SkillKanban.tsx',
    lastSkill: 'do', skills: ['discuss', 'do'], skillCount: 2, toolCount: 14,
    touchedFiles: ['src/pages/replay/SkillKanban.tsx'],
    lastAssistantMsg: 'Creating the demo file...',
    hasOutput: true,
  }),
  makeCard({
    id: 's3', label: 'ax() 토큰 감사',
    agentState: 'done', phase: 'reviewing',
    currentActivity: 'idle', lastSkill: 'retrospect',
    skills: ['discuss', 'do', 'retrospect'], skillCount: 3, toolCount: 42,
    lastAssistantMsg: '감사 완료 — 위반 0건.',
    hasOutput: true,
  }),
]

export function Demo() {
  const [openId, setOpenId] = useState<string | null>(null)
  // eslint-disable-next-line react-hooks/purity
  const data = cardsToKanbanData(MOCK_CARDS, Date.now())
  const openCard = openId ? MOCK_CARDS.find((c) => c.id === openId) ?? null : null

  const waiting = MOCK_CARDS.filter((c) => c.agentState === 'waiting').length
  const active = MOCK_CARDS.filter((c) => c.agentState === 'active').length
  const done = MOCK_CARDS.filter((c) => c.agentState === 'done').length

  return (
    <div className={ax({ layout: 'stack', scroll: 'hidden' })}>
      <PanelHeader axes={{ layout: 'spread' }}>
        <div className={ax({ layout: 'bar', gap: 'sm' })}>
          <span className={ax({ text: 'bright', weight: 'medium' })}>Agent Dashboard</span>
          <span className={ax({ text: 'muted', textStyle: 'caption' })}>
            {waiting} waiting · {active} active · {done} done
          </span>
        </div>
      </PanelHeader>
      <div className={ax({ padding: 'md' })}>
        <Kanban
          data={data}
          onActivate={(id: string) => {
            if (id === COL_WAITING || id === COL_ACTIVE || id === COL_DONE) return
            setOpenId(id)
          }}
          aria-label="Agent Dashboard"
        />
      </div>
      <SessionDetailModal card={openCard} onClose={() => setOpenId(null)} />
    </div>
  )
}
`;export{e as default};