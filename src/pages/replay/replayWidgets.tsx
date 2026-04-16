import { useMemo, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Search } from 'lucide-react'
import { ax } from '@styles/ax'
import { ScrollArea } from '@os/ui/ScrollArea'
import { NavList } from '@os/ui/NavList'
import { Combobox } from '@os/ui/Combobox'
import { Button } from '@os/ui/Button'
import { FileViewer } from '@os/ui/FileViewer'
import { parseResults } from '@os/ui/SearchResults'
import { createStore } from '@os/store/createStore'
import type { NormalizedData } from '@os/store/types'
import type { FileViewerHandle } from '@os/ui/viewerTypes'
import type { ChatMessage } from '@os/ui/chat/types'
import { connectSession, disconnectSession, useTimeline } from '../viewer/viewerStore'
import { timelineToMessages } from '../viewer/timelineTransform'
import { createFileState } from './fileState'
import { processToolEvents } from './toolToCommands'
import { useActiveSessions } from './useActiveSessions'
import { useReplay } from './replayContext'
import type { ReplayContextValue } from './replayContext'
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

export function ReplaySidebarWidget({ ctx, sessionEntries, currentSessionId }: ReplaySidebarWidgetProps) {
  const isRunning = ctx?.isRunning ?? false
  const startReplay = ctx?.startReplay
  const messages = ctx?.messages ?? []
  const tabs = ctx?.tabs ?? []
  const activeTabId = ctx?.activeTabId ?? null
  const setActiveTab = ctx?.setActiveTab
  const viewerTabs = ctx?.viewerTabs

  // ── Session combobox data — always available ──
  const sessionComboData = useMemo(() => {
    const entities = Object.fromEntries(
      sessionEntries.map(e => [e.id, { id: e.id, data: { label: `${e.id} (${e.type})` } }])
    )
    return createStore({ entities, relationships: { __root__: sessionEntries.map(e => e.id) } })
  }, [sessionEntries])

  // ── File list data (grouped: edited / read) ──
  const fileListData: NormalizedData = useMemo(() => {
    const fileTabs = tabs.filter(t => t.type === 'file')
    if (fileTabs.length === 0 || !viewerTabs) return createStore({ entities: {}, relationships: {} })

    const edited = fileTabs.filter(t => viewerTabs.editedPaths.has(t.id))
    const readOnly = fileTabs.filter(t => !viewerTabs.editedPaths.has(t.id))

    const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
    const relationships: Record<string, string[]> = { __root__: [] }

    if (edited.length > 0) {
      entities['__edited__'] = { id: '__edited__', data: { label: '수정한 파일', type: 'group' } }
      relationships['__root__'].push('__edited__')
      relationships['__edited__'] = edited.map(t => t.id)
      for (const t of edited) {
        entities[t.id] = { id: t.id, data: { label: filenameFrom(t.id) } }
      }
    }
    if (readOnly.length > 0) {
      entities['__read__'] = { id: '__read__', data: { label: '열어본 파일', type: 'group' } }
      relationships['__root__'].push('__read__')
      relationships['__read__'] = readOnly.map(t => t.id)
      for (const t of readOnly) {
        entities[t.id] = { id: t.id, data: { label: filenameFrom(t.id) } }
      }
    }

    return createStore({ entities, relationships })
  }, [tabs, viewerTabs])

  const fileCount = tabs.filter(t => t.type === 'file').length
  const placeholder = currentSessionId ?? sessionEntries[0]?.id ?? 'Session'
  const canReplay = !isRunning && messages.length > 0 && !!startReplay

  return (
    <div className={ax({ layout: 'fill' })} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 200, zIndex: 20 }}>
      {/* Session info — always rendered */}
      <div className={ax({ flex: 'none', padding: 'xs', gap: 'xs', layout: 'fill' })}>
        <Combobox
          data={sessionComboData}
          placeholder={placeholder}
          aria-label="Session"
        />
        <div className={ax({ layout: 'bar', gap: 'xs', padding: 'xs' })}>
          {canReplay && (
            <Button onClick={startReplay}>Replay</Button>
          )}
          {isRunning && (
            <span className={ax({ textStyle: 'caption', text: 'muted', motion: 'pulse' })}>Playing…</span>
          )}
        </div>
      </div>

      {/* File list — only when ctx has files */}
      {fileCount > 0 && setActiveTab && (
        <ScrollArea className={ax({ flex: '1' })}>
          <NavList
            data={fileListData}
            initialFocus={activeTabId ?? undefined}
            onActivate={(id) => setActiveTab(id)}
            aria-label="Files"
          />
        </ScrollArea>
      )}
    </div>
  )
}

// ── Stage: Shorts frame with IDE + subtitle ──

export function ReplayStageWidget() {
  const {
    mode,
    messages, isRunning,
    activeTab, fileViewerRef,
    viewerTabs,
  } = useReplay()

  // ── Subtitle text: last assistant text block ──
  const subtitleText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.role !== 'assistant') continue
      for (let j = msg.blocks.length - 1; j >= 0; j--) {
        const block = msg.blocks[j]
        if ((block.type === 'text' || block.type === 'streaming_text') && 'content' in block) {
          return (block as { content: string }).content
        }
      }
    }
    return null
  }, [messages])

  // ── Live: connect and feed IDE ──
  const liveMessages = useLiveMessages(mode, viewerTabs, fileViewerRef)
  const displayMessages = mode === 'live' ? liveMessages : messages

  // ── Last tool name (from displayMessages so it works in both modes) ──
  const lastTool = useMemo(() => {
    for (let i = displayMessages.length - 1; i >= 0; i--) {
      const msg = displayMessages[i]
      if (msg.role !== 'system') continue
      for (let j = msg.blocks.length - 1; j >= 0; j--) {
        const block = msg.blocks[j]
        if (block.type === 'tool_use' && 'data' in block) {
          const data = block.data as Record<string, unknown>
          const name = data.name as string | undefined
          if (name === 'Read') continue
          return name ?? null
        }
      }
    }
    return null
  }, [displayMessages])

  const liveSubtitle = useMemo(() => {
    if (mode !== 'live') return null
    for (let i = displayMessages.length - 1; i >= 0; i--) {
      const msg = displayMessages[i]
      if (msg.role !== 'assistant') continue
      for (let j = msg.blocks.length - 1; j >= 0; j--) {
        const block = msg.blocks[j]
        if ((block.type === 'text' || block.type === 'streaming_text') && 'content' in block) {
          return (block as { content: string }).content
        }
      }
    }
    return null
  }, [mode, displayMessages])

  const effectiveSubtitle = mode === 'live' ? liveSubtitle : subtitleText

  // ── Current filename ──
  const currentPath = activeTab?.type === 'file' ? (activeTab.path ?? null) : null

  const flashFile = useFlash(currentPath ? shortPath(currentPath) : null, 1500)
  const toolType = activeTab?.type ?? null
  const toolLabel = toolType === 'file' ? 'Code' : toolType === 'terminal' ? 'Terminal' : toolType === 'search' ? 'Search' : null
  const toolSplash = useFlash(toolLabel, 800, { skipFirst: true })

  // ── Replay finished? ──
  const replayFinished = mode === 'replay' && !isRunning && displayMessages.length > 0

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#fff' }}>
      {/* ── Shorts frame (center) ── */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        className={ax({ placement: 'relative', surface: 'base', shape: 'lg' })}
        style={{ aspectRatio: '9 / 16', height: 'calc(100% - 2rem)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border-default)' }}
      >
        {/* File switch flash overlay */}
        {flashFile && (
          <div
            className={ax({ layout: 'center', shape: 'md', motion: 'fade-in' })}
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#fff',
              padding: '0.75rem 1.5rem',
              zIndex: 20,
              pointerEvents: 'none',
            }}
          >
            <span className={ax({ textStyle: 'page', weight: 'semi' })} style={{ color: '#fff' }}>{flashFile}</span>
          </div>
        )}

        {/* Stage area */}
        {replayFinished ? (
          <StatsEndCard messages={displayMessages} />
        ) : (
          <StageRouter
            activeTab={activeTab}
            fileViewerRef={fileViewerRef}
            toolName={lastTool}
            fileTabs={viewerTabs.tabs.filter(t => t.type === 'file')}
            activeTabId={viewerTabs.activeTabId}
          />
        )}

        {/* Tool switch icon splash */}
        {toolSplash && (
          <div
            className={ax({ layout: 'center', motion: 'fade-in' })}
            style={{
              position: 'absolute',
              top: '45%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 19,
              pointerEvents: 'none',
            }}
          >
            <span className={ax({ textStyle: 'page', weight: 'semi', surface: 'overlay', padding: 'md', shape: 'lg' })}
              style={{ fontSize: '1.5rem' }}
            >{toolSplash}</span>
          </div>
        )}

        {/* Subtitle overlay */}
        {effectiveSubtitle && (
          <div style={{ position: 'absolute', top: '3rem', left: 0, right: 0, textAlign: 'center', zIndex: 10, pointerEvents: 'none', padding: '0 5%' }}>
            <span
              className={`replay-subtitle ${ax({ textStyle: 'section' })}`}
              style={{ color: '#fff', background: 'rgba(0, 0, 0, 0.75)', padding: '0.25em 0.5em', lineHeight: 1.8, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', borderRadius: '0.25em' }}
            >{renderMdBold(lastSentence(effectiveSubtitle))}</span>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

// ── Live messages hook ──

function useLiveMessages(
  mode: 'replay' | 'live',
  viewerTabs: { openFile: (path: string, content: string) => void; markEdited: (path: string) => void },
  fileViewerRef: RefObject<FileViewerHandle | null>,
) {
  const activeSessions = useActiveSessions()
  const sessionId = mode === 'live' && activeSessions.length > 0 ? activeSessions[0].id : null

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
    if (mode !== 'live' || !sessionId) return
    if (timeline.length === 0 || timeline.length <= processedRef.current) return

    const newEvents = timeline.slice(processedRef.current)
    processedRef.current = timeline.length

    const getRef = () => fileViewerRef.current
    processToolEvents(newEvents, fsRef.current, fetchedRef.current, viewerTabs as never, getRef)
  }, [mode, sessionId, timeline, viewerTabs, fileViewerRef])

  return messages
}

// ── Stage Components ──

function ToolBadge({ name }: { name: string }) {
  return (
    <div className={`${ax({ placement: 'top-end', flex: 'none' })} stage-badge`}>
      <span className={ax({ role: 'badge', padding: 'xs', textStyle: 'caption', weight: 'semi', surface: 'overlay', shape: 'md' })}>{name}</span>
    </div>
  )
}

function CodeStage({ activeTab, fileViewerRef, toolName, fileTabs, activeTabId }: {
  activeTab: { path?: string | null }
  fileViewerRef: RefObject<FileViewerHandle | null>
  toolName: string | null
  fileTabs: Array<{ id: string; path?: string | null }>
  activeTabId: string | null
}) {
  return (
    <div className={ax({ flex: '1', layout: 'fill', scroll: 'hidden' })} style={{ position: 'relative', background: '#1e1e2e', color: '#cdd6f4' }}>
      {toolName && <ToolBadge name={toolName} />}
      {/* IDE tab bar */}
      {fileTabs.length > 0 && (
        <div className={ax({ layout: 'row', flex: 'none' })} style={{ background: '#181825', overflow: 'hidden' }}>
          {fileTabs.slice(-5).map(t => {
            const isActive = t.id === activeTabId
            return (
              <div
                key={t.id}
                className={ax({ padding: 'xs', textStyle: 'caption', clamp: '1' })}
                style={{
                  background: isActive ? '#1e1e2e' : 'transparent',
                  color: isActive ? '#cdd6f4' : '#6c7086',
                  borderBottom: isActive ? '2px solid #89b4fa' : '2px solid transparent',
                  maxWidth: '33%',
                }}
              >{filenameFrom(t.path ?? null)}</div>
            )
          })}
        </div>
      )}
      <div className={ax({ flex: '1' })}>
        <FileViewer ref={fileViewerRef} filename={filenameFrom(activeTab.path ?? null)} />
      </div>
    </div>
  )
}

function TerminalStage({ command, output, toolName }: {
  command: string
  output: string
  toolName: string | null
}) {
  return (
    <div className={ax({ flex: '1', layout: 'center', surface: 'sunken' })} style={{ position: 'relative' }}>
      {toolName && <ToolBadge name={toolName} />}
      {/* Horizontal terminal window centered in vertical frame */}
      <div
        className={ax({ shape: 'lg', textStyle: 'code', layout: 'stack' })}
        style={{ background: '#1a1a2e', width: '95%', minHeight: '30%', maxHeight: '60%', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
      >
        {/* Title bar */}
        <div className={ax({ flex: 'none', padding: 'xs', layout: 'bar', gap: 'xs' })} style={{ background: '#2a2a3e' }}>
          <span className="terminal-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <span className="terminal-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
          <span className="terminal-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        </div>
        {/* Terminal content */}
        <div className={ax({ flex: '1', scroll: 'hidden' })}>
          <div className={ax({ padding: 'sm', gap: 'sm', layout: 'stack' })}>
            <div className={ax({ layout: 'row', gap: 'sm' })}>
              <span className={`${ax({ flex: 'none' })} terminal-glow-prompt`} style={{ color: '#22d3ee' }}>$</span>
              <span className={`${ax({ weight: 'semi' })} terminal-glow-command`} style={{ color: '#4ade80', wordBreak: 'break-all' }}>{command}</span>
            </div>
            <div style={{ color: '#d4d4d8', wordBreak: 'break-all' }}>{output || '(no output)'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const MATCHES_PER_FILE = 4

/** Emits `key` briefly (ms) when it changes, then null. `skipFirst` suppresses initial emission. */
function useFlash(key: string | null, ms: number, options?: { skipFirst?: boolean }): string | null {
  const [value, setValue] = useState<string | null>(null)
  const prevRef = useRef<string | null>(null)
  const firstRef = useRef(true)
  const skipFirst = options?.skipFirst ?? false
  useEffect(() => {
    if (key === prevRef.current) return
    prevRef.current = key
    const shouldEmit = key !== null && !(skipFirst && firstRef.current)
    firstRef.current = false
    // Transient UI flash — effect-driven state is intentional here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!shouldEmit) { setValue(null); return }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(key)
    const timer = setTimeout(() => setValue(null), ms)
    return () => clearTimeout(timer)
  }, [key, ms, skipFirst])
  return value
}

function ReplaySearchStage({ query, output, toolName }: {
  query: string
  output: string
  toolName: string | null
}) {
  const groups = useMemo(() => parseResults(output), [output])
  const totalMatches = useMemo(
    () => [...groups.values()].reduce((s, g) => s + Math.max(g.length, 1), 0),
    [groups],
  )
  const fileCount = groups.size

  return (
    <div className={ax({ flex: '1', layout: 'stack', surface: 'base', scroll: 'hidden', padding: 'lg', gap: 'lg' })} style={{ position: 'relative' }}>
      {toolName && <ToolBadge name={toolName} />}

      {/* ── Hero query ── */}
      <div className={ax({ layout: 'stack', gap: 'md', padding: 'lg' })}>
        <div className={ax({ layout: 'center', text: 'muted' })}>
          <Search aria-hidden="true" className={ax({ icon: 'lg' })} />
        </div>
        <div className={ax({ layout: 'center' })}>
          <span className={ax({ textStyle: 'page', weight: 'semi', text: 'primary', clamp: '2' })} style={{ textAlign: 'center', wordBreak: 'break-word' }}>
            &ldquo;{query}&rdquo;
          </span>
        </div>
      </div>

      {/* ── Match count (hero numbers) ── */}
      {fileCount > 0 ? (
        <div className={ax({ layout: 'stack', gap: 'xs', padding: 'sm' })}>
          <div className={ax({ layout: 'row', gap: 'md' })} style={{ justifyContent: 'center', alignItems: 'baseline' }}>
            <span className={ax({ textStyle: 'hero', weight: 'bold', text: 'primary' })}>{totalMatches}</span>
            <span className={ax({ textStyle: 'caption', text: 'muted' })}>matches</span>
            <span className={ax({ textStyle: 'caption', text: 'muted' })}>in</span>
            <span className={ax({ textStyle: 'hero', weight: 'bold', text: 'primary' })}>{fileCount}</span>
            <span className={ax({ textStyle: 'caption', text: 'muted' })}>files</span>
          </div>
        </div>
      ) : (
        <div className={ax({ layout: 'center', text: 'muted', textStyle: 'body' })}>
          No results
        </div>
      )}

      {/* ── File group cards ── */}
      <div className={ax({ flex: '1', layout: 'stack', gap: 'md', scroll: 'hidden' })}>
        {[...groups.entries()].map(([file, matches]) => {
          const visible = matches.slice(0, MATCHES_PER_FILE)
          const overflow = matches.length - visible.length
          return (
            <div key={file} className={ax({ layout: 'stack', surface: 'raised', shape: 'md', border: 'subtle' })}>
              <div className={ax({ padding: 'sm', border: 'bottom', flex: 'none' })}>
                <span className={ax({ textStyle: 'caption', weight: 'semi', text: 'primary', clamp: '1' })}>
                  {file.replace(/.*\/aria\//, '')}
                </span>
              </div>
              <div className={ax({ layout: 'stack', textStyle: 'code' })}>
                {visible.map((m, i) => (
                  <div key={i} className={ax({ layout: 'row', gap: 'sm', padding: 'xs' })}>
                    {m.line != null && (
                      <span className={ax({ flex: 'none', text: 'muted', opacity: 'dim' })} style={{ minWidth: '2.5em', textAlign: 'right' }}>
                        {m.line}
                      </span>
                    )}
                    <span className={ax({ flex: '1', clamp: 'pre', text: 'secondary' })}>{m.text}</span>
                  </div>
                ))}
                {matches.length === 0 && (
                  <div className={ax({ padding: 'xs', text: 'muted', textStyle: 'caption' })}>(file match)</div>
                )}
                {overflow > 0 && (
                  <div className={ax({ padding: 'xs', text: 'muted', textStyle: 'caption', border: 'top' })}>
                    +{overflow} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EmptyStage() {
  return (
    <div className={ax({ layout: 'center', flex: '1', text: 'muted', textStyle: 'caption', surface: 'base' })}>
      tool_use steps will appear here during playback
    </div>
  )
}

// ── End Card: Summary + PR-style Diff ──

interface DiffInfo {
  filePath: string
  oldStr: string
  newStr: string
}

function extractAllEdits(messages: ChatMessage[]): DiffInfo[] {
  const edits: DiffInfo[] = []
  for (const msg of messages) {
    if (msg.role !== 'system') continue
    for (const block of msg.blocks) {
      if (block.type !== 'tool_use' || !('data' in block)) continue
      const data = block.data as Record<string, unknown>
      if (data.name !== 'Edit' && data.name !== 'Write') continue
      const input = data.input as Record<string, unknown> | undefined
      if (!input) continue
      const fp = (input.file_path as string) ?? ''
      if (data.name === 'Edit') {
        edits.push({ filePath: fp, oldStr: (input.old_string as string) ?? '', newStr: (input.new_string as string) ?? '' })
      } else {
        edits.push({ filePath: fp, oldStr: '', newStr: (input.content as string) ?? '' })
      }
    }
  }
  return edits
}

function extractSummary(messages: ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role !== 'assistant') continue
    for (let j = msg.blocks.length - 1; j >= 0; j--) {
      const block = msg.blocks[j]
      if ((block.type === 'text' || block.type === 'streaming_text') && 'content' in block) {
        return (block as { content: string }).content
      }
    }
  }
  return null
}

function extractEditedPaths(messages: ChatMessage[]): string[] {
  const paths = new Set<string>()
  for (const msg of messages) {
    if (msg.role !== 'system') continue
    for (const block of msg.blocks) {
      if (block.type !== 'tool_use' || !('data' in block)) continue
      const data = block.data as Record<string, unknown>
      if (data.name !== 'Edit' && data.name !== 'Write') continue
      const input = data.input as Record<string, unknown> | undefined
      const fp = input?.file_path as string | undefined
      if (fp) paths.add(fp)
    }
  }
  return [...paths]
}

function StatsEndCard({ messages }: { messages: ChatMessage[] }) {
  const summary = useMemo(() => extractSummary(messages), [messages])
  const editedPaths = useMemo(() => extractEditedPaths(messages), [messages])
  const allEdits = useMemo(() => extractAllEdits(messages), [messages])

  // Group edits by file
  const editsByFile = useMemo(() => {
    const map = new Map<string, DiffInfo[]>()
    for (const e of allEdits) {
      const arr = map.get(e.filePath) ?? []
      arr.push(e)
      map.set(e.filePath, arr)
    }
    return map
  }, [allEdits])

  return (
    <div className={ax({ flex: '1', surface: 'base', scroll: 'hidden' })}>
      <div className={ax({ layout: 'stack', gap: 'md', padding: 'sm' })}>
        {/* Summary */}
        {summary && (
          <div className={ax({ layout: 'stack', gap: 'xs' })}>
            <p className={ax({ textStyle: 'caption', text: 'muted', weight: 'semi' })}>Summary</p>
            <p className={ax({ textStyle: 'body', text: 'primary' })}>{lastSentence(summary)}</p>
          </div>
        )}

        {/* Changed files list */}
        {editedPaths.length > 0 && (
          <div className={ax({ layout: 'stack', gap: 'xs' })}>
            <p className={ax({ textStyle: 'caption', text: 'muted', weight: 'semi' })}>
              {editedPaths.length} file{editedPaths.length > 1 ? 's' : ''} changed
            </p>
            {editedPaths.map(p => (
              <span key={p} className={ax({ textStyle: 'code', text: 'secondary' })}>{shortPath(p)}</span>
            ))}
          </div>
        )}

        {/* PR-style diffs per file */}
        {[...editsByFile.entries()].map(([filePath, edits]) => (
          <div key={filePath} className={ax({ layout: 'stack', surface: 'sunken', shape: 'md', border: 'default' })}>
            <div className={ax({ padding: 'xs', border: 'bottom', flex: 'none' })}>
              <span className={ax({ textStyle: 'caption', weight: 'semi' })}>{shortPath(filePath)}</span>
            </div>
            <div className={ax({ textStyle: 'code', layout: 'stack' })}>
              {edits.map((edit, ei) => (
                <div key={ei}>
                  {ei > 0 && <div className={ax({ border: 'bottom', opacity: 'dim' })} />}
                  {edit.oldStr && edit.oldStr.split('\n').map((line, li) => (
                    <div key={`o${ei}-${li}`} className="diff-line-old" style={{ background: 'var(--color-danger-subtle, rgba(239,68,68,0.08))' }}>
                      <span className={ax({ padding: 'xs', tone: 'danger' })}>
                        <span style={{ opacity: 0.4, userSelect: 'none' }}>- </span>{line}
                      </span>
                    </div>
                  ))}
                  {edit.newStr.split('\n').map((line, li) => (
                    <div key={`n${ei}-${li}`} className="diff-line-new" style={{ background: 'var(--color-success-subtle, rgba(34,197,94,0.08))' }}>
                      <span className={ax({ padding: 'xs', tone: 'success' })}>
                        <span style={{ opacity: 0.4, userSelect: 'none' }}>+ </span>{line}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StageRouter({ activeTab, fileViewerRef, toolName, fileTabs, activeTabId }: {
  activeTab: { type: string; path?: string | null; query?: string; output?: string; command?: string } | null
  fileViewerRef: RefObject<FileViewerHandle | null>
  toolName: string | null
  fileTabs: Array<{ id: string; path?: string | null }>
  activeTabId: string | null
}) {
  if (activeTab?.type === 'file') {
    return <CodeStage activeTab={activeTab} fileViewerRef={fileViewerRef} toolName={toolName} fileTabs={fileTabs} activeTabId={activeTabId} />
  }
  if (activeTab?.type === 'terminal') {
    return <TerminalStage command={activeTab.command!} output={activeTab.output!} toolName={toolName} />
  }
  if (activeTab?.type === 'search') {
    return <ReplaySearchStage query={activeTab.query!} output={activeTab.output!} toolName={toolName} />
  }
  return <EmptyStage />
}

// ── Helpers ──

function filenameFrom(path: string | null): string {
  if (!path) return 'output'
  const parts = path.split('/')
  return parts[parts.length - 1] || 'output'
}

function shortPath(path: string): string {
  const parts = path.split('/')
  if (parts.length >= 2) return parts.slice(-2).join('/')
  return parts[parts.length - 1] || path
}

/** Extract the last sentence from text. Splits on sentence-ending punctuation or newlines. */
function lastSentence(text: string): string {
  // Split by sentence-ending punctuation (. ! ? 。) or newlines
  const sentences = text.split(/(?<=[.!?。])\s+|\n+/).map(s => s.trim()).filter(s => s.length > 0)
  return sentences[sentences.length - 1] ?? ''
}

/** Render markdown text with only **bold** support. All other md syntax rendered as plain text. */
function renderMdBold(text: string): (string | React.ReactElement)[] {
  const parts: (string | React.ReactElement)[] = []
  const regex = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    parts.push(<strong key={match.index}>{match[1]}</strong>)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}
