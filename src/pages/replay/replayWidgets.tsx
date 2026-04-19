// ② replayV2BeatPrd
import { useMemo, useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { ax } from '@styles/ax'
import { ScrollArea } from '@os/ui/ScrollArea'
import { NavList } from '@os/ui/NavList'
import { Combobox } from '@os/ui/Combobox'
import { Button } from '@os/ui/Button'
import { createStore } from '@os/store/createStore'
import type { NormalizedData } from '@os/store/types'
import type { FilePlayerHandle, WorkspaceTab } from '@os/ui/workspaceTypes'
import type { ChatMessage } from '@os/ui/chat/types'
import { connectSession, disconnectSession, useTimeline } from '../finder/finderStore'
import { timelineToMessages } from '../finder/timelineTransform'
import { createFileState } from './fileState'
import { processToolEvents } from './toolToCommands'
import { useActiveSessions } from './useActiveSessions'
import { useReplay } from './replayContext'
import type { ReplayContextValue } from './replayContext'
import { ShortCard } from './ShortCard'
import { toBeats } from './toBeats'
import './replayStages.css'

// ── Session entry type (mirrors replayContext sessionEntries item) ──
type SessionEntry = { id: string; type: 'json' | 'jsonl' }

// ── Sidebar (fixed, outside scroll feed) ──

export interface ReplaySidebarWidgetProps {
  /** Active slot context — null when no slot is visible yet. Sidebar renders unconditionally and degrades gracefully. */
  ctx: ReplayContextValue | null
  /** Session list from the page — always available (doesn't depend on slot ctx). */
  sessionEntries: SessionEntry[]
  /** Currently highlighted session id from the page (snap index). */
  currentSessionId: string | null
}

interface SidebarCtxView {
  isRunning: boolean
  startReplay: (() => void) | undefined
  messages: ReplayContextValue['messages']
  tabs: WorkspaceTab[]
  activeTabId: string | null
  setActiveTab: ((id: string) => void) | undefined
  viewerTabs: ReplayContextValue['viewerTabs'] | undefined
}

const EMPTY_SIDEBAR_VIEW: SidebarCtxView = {
  isRunning: false,
  startReplay: undefined,
  messages: [],
  tabs: [],
  activeTabId: null,
  setActiveTab: undefined,
  viewerTabs: undefined,
}

function readSidebarCtx(ctx: ReplayContextValue | null): SidebarCtxView {
  if (!ctx) return EMPTY_SIDEBAR_VIEW
  return {
    isRunning: ctx.isRunning,
    startReplay: ctx.startReplay,
    messages: ctx.messages,
    tabs: ctx.tabs,
    activeTabId: ctx.activeTabId,
    setActiveTab: ctx.setActiveTab,
    viewerTabs: ctx.viewerTabs,
  }
}

export function ReplaySidebarWidget({ ctx, sessionEntries, currentSessionId }: ReplaySidebarWidgetProps) {
  const view = readSidebarCtx(ctx)
  const { tabs, viewerTabs, setActiveTab, activeTabId, isRunning, startReplay, messages } = view

  const sessionComboData = useMemo(() => buildSessionComboData(sessionEntries), [sessionEntries])
  const fileListData = useMemo(() => buildFileListData(tabs, viewerTabs), [tabs, viewerTabs])

  const fileCount = tabs.filter(t => t.type === 'file').length
  const placeholder = currentSessionId ?? sessionEntries[0]?.id ?? 'Session'
  const canReplay = !isRunning && messages.length > 0 && !!startReplay

  return (
    <div className={`replay-sidebar ${ax({ layout: 'stack', width: 'sm', flex: 'none' })}`}>
      <SessionSelector
        data={sessionComboData}
        placeholder={placeholder}
        canReplay={canReplay}
        isRunning={isRunning}
        startReplay={startReplay}
      />
      {fileCount > 0 && setActiveTab && (
        <FileList data={fileListData} activeTabId={activeTabId} setActiveTab={setActiveTab} />
      )}
    </div>
  )
}

// ── Sidebar sub-components ──────────────────────────────────────────────

function SessionSelector({ data, placeholder, canReplay, isRunning, startReplay }: {
  data: NormalizedData
  placeholder: string
  canReplay: boolean
  isRunning: boolean
  startReplay: (() => void) | undefined
}) {
  return (
    <div className={ax({ flex: 'none', layout: 'fill' })}>
      <Combobox data={data} placeholder={placeholder} aria-label="Session" />
      <div className={ax({ layout: 'bar' })}>
        {canReplay && startReplay && <Button onClick={startReplay}>Replay</Button>}
        {isRunning && <span className={ax({ textStyle: 'caption' })}>Playing…</span>}
      </div>
    </div>
  )
}

function FileList({ data, activeTabId, setActiveTab }: {
  data: NormalizedData
  activeTabId: string | null
  setActiveTab: (id: string) => void
}) {
  return (
    <ScrollArea className={ax({ flex: '1' })}>
      <NavList
        data={data}
        initialFocus={activeTabId ?? undefined}
        onActivate={setActiveTab}
        aria-label="Files"
      />
    </ScrollArea>
  )
}

// ── Sidebar data builders ──────────────────────────────────────────────

function buildSessionComboData(sessionEntries: SessionEntry[]): NormalizedData {
  const entities = Object.fromEntries(
    sessionEntries.map(e => [e.id, { id: e.id, data: { label: `${e.id} (${e.type})` } }])
  )
  return createStore({ entities, relationships: { __root__: sessionEntries.map(e => e.id) } })
}

function buildFileListData(
  tabs: WorkspaceTab[],
  viewerTabs: ReplayContextValue['viewerTabs'] | undefined,
): NormalizedData {
  const fileTabs = tabs.filter(t => t.type === 'file')
  if (fileTabs.length === 0 || !viewerTabs) return createStore({ entities: {}, relationships: {} })

  const edited = fileTabs.filter(t => viewerTabs.editedPaths.has(t.id))
  const readOnly = fileTabs.filter(t => !viewerTabs.editedPaths.has(t.id))

  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const relationships: Record<string, string[]> = { __root__: [] }

  appendFileGroup(entities, relationships, '__edited__', '수정한 파일', edited)
  appendFileGroup(entities, relationships, '__read__', '열어본 파일', readOnly)

  return createStore({ entities, relationships })
}

function appendFileGroup(
  entities: Record<string, { id: string; data: Record<string, unknown> }>,
  relationships: Record<string, string[]>,
  groupId: string,
  groupLabel: string,
  files: WorkspaceTab[],
): void {
  if (files.length === 0) return
  entities[groupId] = { id: groupId, data: { label: groupLabel, type: 'group' } }
  relationships['__root__'].push(groupId)
  relationships[groupId] = files.map(t => t.id)
  for (const t of files) {
    entities[t.id] = { id: t.id, data: { label: filenameFrom(t.id) } }
  }
}

// ── Stage: ShortCard wrapper driven by toBeats(messages) ──

function deriveAgent(seed: string): { name: string; avatar: string; hue: number } {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  const safe = seed || 'agent'
  return {
    name: safe.length > 16 ? safe.slice(0, 8) : safe,
    avatar: safe.charAt(0).toUpperCase(),
    hue: hash % 360,
  }
}

export function ReplayStageWidget() {
  const {
    mode,
    messages,
    viewerTabs,
    fileViewerRef,
    liveSessionId,
    selectedId,
  } = useReplay()

  const liveMessages = useLiveMessages(mode, viewerTabs, fileViewerRef, liveSessionId)
  const displayMessages = mode === 'live' ? liveMessages : messages
  const agent = useMemo(() => deriveAgent(selectedId ?? 'agent'), [selectedId])

  const session = useMemo(() => toBeats({
    sessionId: selectedId ?? 'current',
    agent,
    title: extractTitle(displayMessages) ?? 'session',
    repo: 'aria',
    messages: displayMessages,
  }), [selectedId, agent, displayMessages])

  return (
    <div className={`replay-stage-frame ${ax({ layout: 'center', width: 'full' })}`}>
      <ShortCard session={session} active autoplay />
    </div>
  )
}

// ── Live messages hook ──

function useLiveMessages(
  mode: 'replay' | 'live',
  viewerTabs: { openFile: (path: string, content: string) => void; markEdited: (path: string) => void } | undefined,
  fileViewerRef: RefObject<FilePlayerHandle | null> | undefined,
  forcedSessionId?: string | null,
) {
  const activeSessions = useActiveSessions()
  const sessionId = mode !== 'live'
    ? null
    : forcedSessionId !== undefined
      ? forcedSessionId
      : activeSessions.length > 0 ? activeSessions[0].id : null

  useEffect(() => {
    if (!sessionId) return
    connectSession(sessionId, true)
    return () => disconnectSession(sessionId)
  }, [sessionId])

  const timeline = useTimeline(sessionId ?? '')
  const messages = useMemo(() => sessionId ? timelineToMessages(timeline) : [], [sessionId, timeline])

  const processedRef = useRef(0)
  const fsRef = useRef(createFileState())
  const fetchedRef = useRef(new Set<string>())

  useEffect(() => {
    if (mode !== 'live' || !sessionId || !viewerTabs || !fileViewerRef) return
    if (timeline.length === 0 || timeline.length <= processedRef.current) return

    const newEvents = timeline.slice(processedRef.current)
    processedRef.current = timeline.length

    const getRef = () => fileViewerRef.current
    processToolEvents(newEvents, fsRef.current, fetchedRef.current, viewerTabs as never, getRef)
  }, [mode, sessionId, timeline, viewerTabs, fileViewerRef])

  return messages
}

// ── Helpers ──

function filenameFrom(path: string | null): string {
  if (!path) return 'output'
  const parts = path.split('/')
  return parts[parts.length - 1] || 'output'
}

/** Extract a card title from messages — first user prompt's first non-empty line. */
function extractTitle(messages: ChatMessage[]): string | null {
  for (const msg of messages) {
    if (msg.role !== 'user') continue
    for (const block of msg.blocks) {
      if ((block.type === 'text' || block.type === 'streaming_text') && 'content' in block) {
        const text = (block as { content: string }).content
        const firstLine = text.split('\n').map(s => s.trim()).find(Boolean)
        if (firstLine) return firstLine
      }
    }
  }
  return null
}
