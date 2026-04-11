// @useState-hatch — sessionCards: real-time SSE stream state, not OS axis/store material
// @useState-hatch — tick: timer-driven re-render for elapsed time display
// @useState-hatch — openCardId: dialog open state, not OS axis/store material
// @useState-hatch — fileContent/activeFilePath: modal-local file fetch state, not OS store material
// @useState-hatch — splitSizes: SplitPane local resize state
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
const RUNNING_SKILLS = new Set(['go', 'do', 'fix', 'improve', 'use'])
const DONE_SKILLS = new Set(['close', 'retrospect'])
const MAX_MESSAGES = 200
const MAX_CARD_FILES = 5

type PipelineStage = 'planning' | 'running' | 'done'

function classifySkill(skill: string): PipelineStage {
  if (DONE_SKILLS.has(skill)) return 'done'
  if (RUNNING_SKILLS.has(skill)) return 'running'
  if (PLANNING_SKILLS.has(skill)) return 'planning'
  return 'planning'
}

interface ChatMessage { role: 'user' | 'assistant'; text: string }

interface SessionCard {
  id: string
  label: string
  stage: PipelineStage
  lastSkill: string
  skills: string[]
  touchedFiles: string[]
  skillCount: number
  toolCount: number
  startTs: number
  lastTs: number
  allMessages: ChatMessage[]
}

function deriveStage(skills: string[]): { stage: PipelineStage; lastSkill: string } {
  if (skills.length === 0) return { stage: 'planning', lastSkill: '' }
  const lastSkill = skills[skills.length - 1]
  return { stage: classifySkill(lastSkill), lastSkill }
}

function lastUserMessage(card: SessionCard): string {
  for (let i = card.allMessages.length - 1; i >= 0; i--) {
    if (card.allMessages[i].role === 'user') return card.allMessages[i].text.slice(0, 60)
  }
  return card.label
}

function lastPreview(card: SessionCard): string {
  return card.allMessages.slice(-3).map(m => m.text.slice(0, 80)).join('\n\n')
}

function pushMessage(messages: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  const next = [...messages, msg]
  return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next
}

function basename(filePath: string): string {
  return filePath.split('/').pop() ?? filePath
}

function extractSessionCard(events: TimelineEvent[], session: ActiveSession): SessionCard {
  const skills: string[] = []
  const fileSet = new Set<string>()
  let toolCount = 0
  let startTs = 0
  let lastTs = 0
  let allMessages: ChatMessage[] = []

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
  }

  const { stage: derivedStage, lastSkill } = deriveStage(skills)
  const stage = session.active ? derivedStage : 'done'

  return {
    id: session.id, label: session.label, stage, lastSkill,
    skills, touchedFiles: [...fileSet],
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

function SessionDetailModal({ card, onClose }: { card: SessionCard | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [splitSizes, setSplitSizes] = useState<PaneSize[]>([0.35, 'flex'])
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const hasFiles = card !== null && card.touchedFiles.length > 0

  // Auto-select first file when card changes
  useEffect(() => {
    if (card && card.touchedFiles.length > 0) {
      setActiveFilePath(card.touchedFiles[0])
    } else {
      setActiveFilePath(null)
      setFileContent(null)
      setFileError(null)
    }
  }, [card])

  // Fetch file content when activeFilePath changes
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

const STAGE_LABELS: Record<PipelineStage, string> = { planning: 'Planning', running: 'Running', done: 'Done' }

function SessionCardView({ card, onClick }: { card: SessionCard; onClick: () => void }) {
  const elapsed = formatElapsed(Date.now() - card.startTs)
  const skillTag = card.lastSkill ? `/${card.lastSkill}` : ''
  const preview = lastPreview(card)
  const fileNames = card.touchedFiles.map(basename)
  const displayFiles = fileNames.slice(0, MAX_CARD_FILES)
  const moreCount = fileNames.length - MAX_CARD_FILES

  return (
    <div
      className={ax({ recipe: 'container', surface: 'display', border: 'subtle', shape: 'md', layout: 'column', gap: 'xs', interactive: 'item' })}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <span className={ax({ clamp: '1', weight: 'medium', textStyle: 'caption' })}>{lastUserMessage(card)}</span>
      <span className={ax({ text: 'muted', textStyle: 'caption' })}>
        {card.toolCount} tools · {elapsed}{skillTag ? ` · ${skillTag}` : ''}
      </span>
      {card.skills.length > 0 && (
        <span className={ax({ text: 'secondary', textStyle: 'caption' })}>
          {card.skills.join(' → ')}
        </span>
      )}
      {displayFiles.length > 0 && (
        <span className={ax({ text: 'muted', textStyle: 'caption', clamp: '2' })}>
          {displayFiles.join(', ')}{moreCount > 0 ? ` +${moreCount} more` : ''}
        </span>
      )}
      {preview && (
        <div className="kanban-card-preview">
          <MarkdownViewer content={preview} prose={false} codeVariant="compact" />
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

export default function SkillKanban() {
  const sessions = useActiveSessions({ activeOnly: false })
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([])
  const [, setTick] = useState(0)
  const [openCardId, setOpenCardId] = useState<string | null>(null)

  useEffect(() => {
    if (sessions.length === 0) return
    let cancelled = false

    async function loadInitial() {
      const results = await Promise.allSettled(
        sessions.map(async session => {
          const res = await fetch(`/api/agent-ops/timeline?session=${session.id}&tail=2000`)
          if (!res.ok) return null
          const { events } = await res.json() as { events: TimelineEvent[] }
          return extractSessionCard(events, session)
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
          const card = { ...prev[idx], lastTs: Date.parse(data.ts) }

          if (data.type === 'skill_start' && data.text) {
            card.lastSkill = data.text
            card.skills = [...card.skills, data.text]
            card.stage = classifySkill(data.text)
            card.skillCount++
          } else if (data.type === 'tool_use' && data.tool !== 'Skill') {
            card.toolCount++
            if (data.filePath && !card.touchedFiles.includes(data.filePath)) {
              card.touchedFiles = [...card.touchedFiles, data.filePath]
            }
          }
          if ((data.type === 'user' || data.type === 'assistant') && data.text) {
            card.allMessages = pushMessage(card.allMessages, { role: data.type as 'user' | 'assistant', text: data.text })
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
      <SessionDetailModal card={openCard ?? null} onClose={() => setOpenCardId(null)} />
    </div>
  )
}
