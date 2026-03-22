import styles from './PageAgentViewer.module.css'
import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import {
  Eye, EyeOff, Circle, User, Bot, FileText, Terminal,
  Pencil, Search, FilePlus,
} from 'lucide-react'
import { Aria } from '../interactive-os/components/aria'
import { listbox } from '../interactive-os/behaviors/listbox'
import { core, FOCUS_ID } from '../interactive-os/plugins/core'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData, Entity } from '../interactive-os/core/types'
import { CodeBlock } from './viewer/CodeBlock'
import { MarkdownViewer } from './viewer/MarkdownViewer'
import { MdxViewer } from './viewer/MdxViewer'
import { FileIcon } from './viewer/FileIcon'
import { Breadcrumb } from './viewer/Breadcrumb'
import { DEFAULT_ROOT } from './viewer/types'

// --- Types ---

interface TimelineEvent {
  type: 'user' | 'assistant' | 'tool_use' | 'tool_result'
  ts: string
  tool?: string
  filePath?: string
  text?: string
  editOld?: string
  editNew?: string
}

interface ModifiedFile {
  file: string
  count: number
  editRanges: string[] // new_string snippets for highlight
}

interface SessionInfo {
  id: string
  mtime: number
  label: string
}

// --- Behaviors ---

const sessionListbox = { ...listbox, followFocus: true }
const modifiedListbox = { ...listbox, followFocus: true }

// --- Constants (stable references) ---

const CORE_PLUGINS = [core()]
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'])

// --- Helpers ---

function relPath(absPath: string): string {
  return absPath.replace(DEFAULT_ROOT + '/', '')
}

function buildModifiedStore(files: ModifiedFile[], selectedFile: string | null): NormalizedData {
  const entities: Record<string, Entity> = {}
  const childIds: string[] = []
  for (const f of files) {
    entities[f.file] = { id: f.file, data: { file: f.file, count: f.count } }
    childIds.push(f.file)
  }
  if (selectedFile && entities[selectedFile]) {
    entities[FOCUS_ID] = { id: FOCUS_ID, focusedId: selectedFile }
  }
  return createStore({ entities, relationships: { [ROOT_ID]: childIds } })
}

async function fetchFile(filePath: string): Promise<string> {
  const res = await fetch(`/api/fs/file?path=${encodeURIComponent(filePath)}`)
  return res.text()
}

// --- Timeline event icon ---

function EventIcon({ evt }: { evt: TimelineEvent }) {
  if (evt.type === 'user') return <User size={11} />
  if (evt.type === 'assistant') return <Bot size={11} />
  if (evt.tool === 'Read') return <FileText size={11} />
  if (evt.tool === 'Edit') return <Pencil size={11} />
  if (evt.tool === 'Write') return <FilePlus size={11} />
  if (evt.tool === 'Bash') return <Terminal size={11} />
  if (evt.tool === 'Grep' || evt.tool === 'Glob') return <Search size={11} />
  return <Circle size={11} />
}

function eventLabel(evt: TimelineEvent): string {
  if (evt.type === 'user') return evt.text ?? ''
  if (evt.type === 'assistant') return evt.text ?? ''
  if (evt.tool === 'Read' && evt.filePath) return `Read ${relPath(evt.filePath)}`
  if (evt.tool === 'Edit' && evt.filePath) return `Edit ${relPath(evt.filePath)}`
  if (evt.tool === 'Write' && evt.filePath) return `Write ${relPath(evt.filePath)}`
  if (evt.tool === 'Bash') return `$ ${evt.text ?? ''}`
  if (evt.tool === 'Grep') return `grep "${evt.text ?? ''}"`
  if (evt.tool === 'Glob') return `glob "${evt.text ?? ''}"`
  return evt.tool ?? evt.type
}

// --- Timeline item (memoized to avoid re-rendering unchanged items) ---

const TimelineItem = memo(function TimelineItem({ evt, onClick }: { evt: TimelineEvent; onClick: (evt: TimelineEvent) => void }) {
  const cls = `${styles.avTimelineItem} ${styles[`avTl${evt.type === 'tool_use' ? (evt.tool ?? '') : evt.type}`] ?? ''}`
  return (
    <div
      className={cls}
      onClick={() => onClick(evt)}
      style={evt.filePath ? { cursor: 'pointer' } : undefined}
    >
      <span className={styles.avTimelineIcon}>
        <EventIcon evt={evt} />
      </span>
      <span className={styles.avTimelineText}>
        {eventLabel(evt)}
      </span>
    </div>
  )
})

// --- Component ---

export default function PageAgentViewer() {
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [modifiedFiles, setModifiedFiles] = useState<ModifiedFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [followMode, setFollowMode] = useState(true)
  const [loading, setLoading] = useState(true)
  const [fetchCounter, setFetchCounter] = useState(0)

  const timelineBodyRef = useRef<HTMLDivElement>(null)
  const followModeRef = useRef(followMode)
  useEffect(() => { followModeRef.current = followMode }, [followMode])
  const isLiveSession = sessions.length > 0 && activeSession === sessions[0]?.id

  // --- Derive modified files from timeline ---
  const deriveModified = useCallback((events: TimelineEvent[]): ModifiedFile[] => {
    const map = new Map<string, ModifiedFile>()
    const order: string[] = []
    for (const evt of events) {
      if (evt.type !== 'tool_use') continue
      if ((evt.tool === 'Edit' || evt.tool === 'Write') && evt.filePath) {
        const existing = map.get(evt.filePath)
        if (existing) {
          existing.count++
          if (evt.editNew) existing.editRanges.push(evt.editNew)
          const idx = order.indexOf(evt.filePath)
          if (idx !== -1) order.splice(idx, 1)
          order.unshift(evt.filePath)
        } else {
          map.set(evt.filePath, {
            file: evt.filePath,
            count: 1,
            editRanges: evt.editNew ? [evt.editNew] : [],
          })
          order.unshift(evt.filePath)
        }
      }
    }
    return order.map(f => map.get(f)!)
  }, [])

  // --- Load session list ---
  useEffect(() => {
    fetch('/api/agent-ops/sessions')
      .then(res => res.json())
      .then((list: SessionInfo[]) => {
        setSessions(list)
        if (list.length > 0) setActiveSession(list[0].id)
      })
      .catch(() => setLoading(false))
  }, [])

  // --- Load timeline for active session ---
  useEffect(() => {
    if (!activeSession) return
    setLoading(true)
    const url = `/api/agent-ops/timeline?session=${encodeURIComponent(activeSession)}`
    fetch(url)
      .then(res => res.json())
      .then((events: TimelineEvent[]) => {
        setTimeline(events)
        const modified = deriveModified(events)
        setModifiedFiles(modified)
        setSelectedFile(modified.length > 0 ? modified[0].file : null)
        setFileContent('')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [activeSession, deriveModified])

  // --- SSE timeline stream (live session only) ---
  useEffect(() => {
    if (!isLiveSession) return
    const es = new EventSource('/api/agent-ops/timeline-stream')

    // Batch SSE events to avoid per-event re-renders
    let pendingEvents: TimelineEvent[] = []
    let rafId = 0

    function flushPending() {
      rafId = 0
      if (pendingEvents.length === 0) return
      const batch = pendingEvents
      pendingEvents = []

      setTimeline(prev => {
        const next = [...prev, ...batch]
        return next.length > 500 ? next.slice(-500) : next
      })

      // Update modified files for Edit/Write events in batch
      const edits = batch.filter(e => e.type === 'tool_use' && (e.tool === 'Edit' || e.tool === 'Write') && e.filePath)
      if (edits.length > 0) {
        setModifiedFiles(prev => {
          let next = [...prev]
          for (const evt of edits) {
            const idx = next.findIndex(f => f.file === evt.filePath)
            if (idx !== -1) {
              const updated = {
                ...next[idx],
                count: next[idx].count + 1,
                editRanges: evt.editNew ? [...next[idx].editRanges, evt.editNew] : next[idx].editRanges,
              }
              next = [updated, ...next.slice(0, idx), ...next.slice(idx + 1)]
            } else {
              next = [{ file: evt.filePath!, count: 1, editRanges: evt.editNew ? [evt.editNew] : [] }, ...next]
            }
          }
          return next
        })

        if (followModeRef.current) {
          const lastEdit = edits[edits.length - 1]
          setSelectedFile(lastEdit.filePath!)
          setFetchCounter(c => c + 1)
        }
      }
    }

    es.onmessage = (event) => {
      let evt: TimelineEvent
      try { evt = JSON.parse(event.data) } catch { return }
      pendingEvents.push(evt)
      if (!rafId) rafId = requestAnimationFrame(flushPending)
    }

    es.onerror = () => {
      es.addEventListener('open', function refetch() {
        es.removeEventListener('open', refetch)
        fetch('/api/agent-ops/timeline')
          .then(res => res.json())
          .then((events: TimelineEvent[]) => {
            setTimeline(events)
            setModifiedFiles(deriveModified(events))
          })
      })
    }

    return () => {
      es.close()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [deriveModified, isLiveSession])

  // --- File content loading ---
  useEffect(() => {
    if (!selectedFile) return
    fetchFile(selectedFile).then(setFileContent).catch(() => setFileContent(''))
  }, [selectedFile, fetchCounter])

  // --- Auto-scroll timeline ---
  useEffect(() => {
    const el = timelineBodyRef.current
    if (el) el.scrollTo(0, el.scrollHeight)
  }, [timeline.length])

  // --- Derived stores ---
  // --- Session store ---
  const sessionStore = useMemo(() => {
    const entities: Record<string, Entity> = {}
    const childIds: string[] = []
    for (const s of sessions) {
      entities[s.id] = { id: s.id, data: { label: s.label, mtime: s.mtime, isLive: s.id === sessions[0]?.id } }
      childIds.push(s.id)
    }
    if (activeSession && entities[activeSession]) {
      entities[FOCUS_ID] = { id: FOCUS_ID, focusedId: activeSession }
    }
    return createStore({ entities, relationships: { [ROOT_ID]: childIds } })
  }, [sessions, activeSession])

  const handleSessionChange = useCallback((newStore: NormalizedData) => {
    const focusedId = (newStore.entities[FOCUS_ID]?.focusedId as string) ?? ''
    if (focusedId && newStore.entities[focusedId]) {
      setActiveSession(focusedId)
    }
  }, [])

  const modifiedStore = useMemo(
    () => buildModifiedStore(modifiedFiles, selectedFile),
    [modifiedFiles, selectedFile],
  )

  // --- Handlers ---
  const handleModifiedChange = useCallback((newStore: NormalizedData) => {
    const focusedId = (newStore.entities[FOCUS_ID]?.focusedId as string) ?? ''
    if (focusedId && newStore.entities[focusedId]) {
      setSelectedFile(focusedId)
    }
  }, [])

  const handleTimelineClick = useCallback((evt: TimelineEvent) => {
    if (evt.filePath) {
      setSelectedFile(evt.filePath)
      setFetchCounter(c => c + 1)
    }
  }, [])

  // Find line numbers that were edited (for highlight)
  const editedLines = useMemo<Set<number>>(() => {
    const lines = new Set<number>()
    if (!selectedFile || !fileContent) return lines
    const mod = modifiedFiles.find(f => f.file === selectedFile)
    if (!mod || mod.editRanges.length === 0) return lines

    const contentLines = fileContent.split('\n')
    for (const editNew of mod.editRanges) {
      const editLines = editNew.split('\n')
      // Find where this snippet starts in the file
      for (let i = 0; i <= contentLines.length - editLines.length; i++) {
        let match = true
        for (let j = 0; j < editLines.length; j++) {
          if (contentLines[i + j].trim() !== editLines[j].trim()) {
            match = false
            break
          }
        }
        if (match) {
          for (let j = 0; j < editLines.length; j++) {
            lines.add(i + j + 1) // 1-indexed
          }
          break
        }
      }
    }
    return lines
  }, [fileContent, selectedFile, modifiedFiles])

  // --- Derived values ---
  const filename = selectedFile?.split('/').pop() ?? ''
  const isMdx = filename.endsWith('.mdx')
  const isMarkdown = !isMdx && filename.endsWith('.md')
  const ext = filename.split('.').pop() ?? ''
  const isImage = IMAGE_EXTS.has(ext.toLowerCase())
  const lineCount = !isImage && fileContent ? fileContent.split('\n').length : 0

  if (loading) {
    return (
      <div className={styles.avLoading}>
        <Circle size={14} strokeWidth={2} />
        <span>Connecting to agent...</span>
      </div>
    )
  }

  return (
    <div className={styles.av}>
      {/* Sessions panel */}
      {sessions.length > 1 && (
        <div className={styles.avSessions}>
          <div className={styles.avSessionsHeader}>
            <span className={styles.avSessionsTitle}>Sessions</span>
          </div>
          <div className={styles.avSessionList}>
            <Aria
              behavior={sessionListbox}
              data={sessionStore}
              plugins={CORE_PLUGINS}
              onChange={handleSessionChange}
              aria-label="Sessions"
            >
              <Aria.Item render={(node) => {
                const data = node.data as { label: string; isLive: boolean }
                return (
                  <div className={styles.avSessionItem}>
                    {data.isLive && <span className={styles.avSessionLive}>●</span>}
                    <span className={styles.avSessionLabel}>{data.label}</span>
                  </div>
                )
              }} />
            </Aria>
          </div>
        </div>
      )}

      {/* Timeline panel */}
      <div className={styles.avTimeline}>
        <div className={styles.avTimelineHeader}>
          <span className={styles.avTimelineTitle}>Timeline</span>
        </div>
        <div className={styles.avTimelineBody} ref={timelineBodyRef}>
          {timeline.length === 0 ? (
            <div className={styles.avTimelineEmpty}>Waiting for agent activity...</div>
          ) : (
            timeline.map((evt, i) => (
              <TimelineItem key={`${evt.ts}-${i}`} evt={evt} onClick={handleTimelineClick} />
            ))
          )}
        </div>
      </div>

      {/* Center panel — file content */}
      <div className={styles.avContent}>
        <div className={styles.avContentHeader}>
          <div className={styles.avContentHeaderLeft}>
            {selectedFile && <Breadcrumb path={selectedFile} root={DEFAULT_ROOT} />}
          </div>
          <div className={styles.avContentHeaderRight}>
            {selectedFile && (
              <div className={styles.avContentMeta}>
                <FileIcon name={filename} type="file" />
                <span>{ext.toUpperCase()}</span>
                {!isImage && (
                  <>
                    <span className={styles.avContentMetaSep} />
                    <span>{lineCount} lines</span>
                  </>
                )}
                {editedLines.size > 0 && (
                  <>
                    <span className={styles.avContentMetaSep} />
                    <span className={styles.avEditBadge}>{editedLines.size} lines edited</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        {selectedFile ? (
          <div className={styles.avContentBody}>
            {isImage
              ? <div className={styles.avImageViewer}>
                  <img
                    src={`/api/fs/file?path=${encodeURIComponent(selectedFile)}`}
                    alt={filename}
                    className={styles.avImage}
                  />
                </div>
              : isMdx
                ? <MdxViewer filePath={selectedFile} />
                : isMarkdown
                  ? <MarkdownViewer content={fileContent} />
                  : <CodeBlock
                      code={fileContent}
                      filename={filename}
                      highlightLines={editedLines.size > 0 ? editedLines : undefined}
                    />}
          </div>
        ) : (
          <div className={styles.avEmpty}>
            <Circle size={24} strokeWidth={1} className={styles.avEmptyIcon} />
            <span>Select a file to view</span>
          </div>
        )}
      </div>

      {/* Right panel — Modified files */}
      <div className={styles.avModified}>
        <div className={styles.avModifiedHeader}>
          <span className={styles.avModifiedTitle}>Modified</span>
          <button
            className={`${styles.avFollowBtn}${followMode ? ` ${styles.avFollowBtnActive}` : ''}`}
            onClick={() => setFollowMode(f => !f)}
            title={followMode ? 'Follow mode on' : 'Follow mode off'}
          >
            {followMode ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        </div>
        <div className={styles.avModifiedBody}>
          <Aria
            behavior={modifiedListbox}
            data={modifiedStore}
            plugins={CORE_PLUGINS}
            onChange={handleModifiedChange}
            aria-label="Modified files"
          >
            <Aria.Item render={(node) => {
              const data = node.data as { file: string; count: number }
              const name = data.file.split('/').pop() ?? ''
              return (
                <div className={styles.avModifiedItem}>
                  <FileIcon name={name} type="file" />
                  <span className={styles.avModifiedPath}>{relPath(data.file)}</span>
                  {data.count > 1 && <span className={styles.avModifiedBadge}>&times;{data.count}</span>}
                </div>
              )
            }} />
          </Aria>
        </div>
      </div>
    </div>
  )
}
