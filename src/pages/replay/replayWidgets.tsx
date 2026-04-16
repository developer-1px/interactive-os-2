import { useMemo, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { ax } from '@styles/ax'
import { ScrollArea } from '@os/ui/ScrollArea'
import { FileViewer } from '@os/ui/FileViewer'
import { SearchResults } from '@os/ui/SearchResults'
import type { FileViewerHandle } from '@os/ui/viewerTypes'
import type { ChatMessage } from '@os/ui/chat/types'
import { connectSession, disconnectSession, useTimeline } from '../viewer/viewerStore'
import { timelineToMessages } from '../viewer/timelineTransform'
import { createFileState } from './fileState'
import { processToolEvents } from './toolToCommands'
import { useActiveSessions } from './useActiveSessions'
import { useReplay } from './replayContext'
import './replayStages.css'

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
  const currentFilename = currentPath ? shortPath(currentPath) : null

  // ── File switch flash ──
  const [flashFile, setFlashFile] = useState<string | null>(null)
  const prevPathRef = useRef<string | null>(null)
  useEffect(() => {
    if (currentPath && currentPath !== prevPathRef.current) {
      setFlashFile(shortPath(currentPath))
      const timer = setTimeout(() => setFlashFile(null), 1500)
      prevPathRef.current = currentPath
      return () => clearTimeout(timer)
    }
    prevPathRef.current = currentPath
  }, [currentPath])

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
        {/* Filename bar */}
        {currentFilename && (
          <div className={ax({ layout: 'bar', padding: 'xs', flex: 'none', border: 'bottom' })}>
            <span className={ax({ textStyle: 'caption', text: 'secondary' })}>{currentFilename}</span>
          </div>
        )}

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
          />
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

function CodeStage({ activeTab, fileViewerRef, toolName }: {
  activeTab: { path?: string | null }
  fileViewerRef: RefObject<FileViewerHandle | null>
  toolName: string | null
}) {
  return (
    <div className={ax({ flex: '1', layout: 'fill' })} style={{ position: 'relative', background: '#1e1e2e', color: '#cdd6f4' }}>
      {toolName && <ToolBadge name={toolName} />}
      <ScrollArea className={ax({ flex: '1' })}>
        <FileViewer ref={fileViewerRef} filename={filenameFrom(activeTab.path ?? null)} />
      </ScrollArea>
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
        <ScrollArea className={ax({ flex: '1' })}>
          <div className={ax({ padding: 'sm', gap: 'sm', layout: 'stack' })}>
            <div className={ax({ layout: 'row', gap: 'sm' })}>
              <span className={`${ax({ flex: 'none' })} terminal-glow-prompt`} style={{ color: '#22d3ee' }}>$</span>
              <span className={`${ax({ weight: 'semi' })} terminal-glow-command`} style={{ color: '#4ade80', wordBreak: 'break-all' }}>{command}</span>
            </div>
            <div style={{ color: '#d4d4d8', wordBreak: 'break-all' }}>{output || '(no output)'}</div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function SearchStage({ query, output, toolName }: {
  query: string
  output: string
  toolName: string | null
}) {
  return (
    <div className={ax({ flex: '1', layout: 'fill', surface: 'base' })} style={{ position: 'relative' }}>
      {toolName && <ToolBadge name={toolName} />}
      <ScrollArea className={ax({ flex: '1' })}>
        <SearchResults query={query} output={output} />
      </ScrollArea>
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
    <ScrollArea className={ax({ flex: '1', surface: 'base' })}>
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
    </ScrollArea>
  )
}

function StageRouter({ activeTab, fileViewerRef, toolName }: {
  activeTab: { type: string; path?: string | null; query?: string; output?: string; command?: string } | null
  fileViewerRef: RefObject<FileViewerHandle | null>
  toolName: string | null
}) {
  if (activeTab?.type === 'file') {
    return <CodeStage activeTab={activeTab} fileViewerRef={fileViewerRef} toolName={toolName} />
  }
  if (activeTab?.type === 'terminal') {
    return <TerminalStage command={activeTab.command!} output={activeTab.output!} toolName={toolName} />
  }
  if (activeTab?.type === 'search') {
    return <SearchStage query={activeTab.query!} output={activeTab.output!} toolName={toolName} />
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
