import styles from './PageAgentViewer.module.css'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Eye, EyeOff, Circle } from 'lucide-react'
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
import { TimelineColumn } from './viewer/TimelineColumn'
import type { TimelineEvent } from './viewer/TimelineColumn'

// --- Types ---

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

function deriveModified(events: TimelineEvent[]): ModifiedFile[] {
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

// --- Component ---

export default function PageAgentViewer() {
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [modifiedFiles, setModifiedFiles] = useState<ModifiedFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [followMode, setFollowMode] = useState(true)
  const [loading, setLoading] = useState(true)
  const [fetchCounter, setFetchCounter] = useState(0)

  const isLiveSession = sessions.length > 0 && activeSession === sessions[0]?.id

  // --- Load session list ---
  useEffect(() => {
    fetch('/api/agent-ops/sessions')
      .then(res => res.json())
      .then((list: SessionInfo[]) => {
        setSessions(list)
        if (list.length > 0) setActiveSession(list[0].id)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // --- Load initial modified files for active session ---
  useEffect(() => {
    if (!activeSession) return
    const url = `/api/agent-ops/timeline?session=${encodeURIComponent(activeSession)}`
    fetch(url)
      .then(res => res.json())
      .then((events: TimelineEvent[]) => {
        const modified = deriveModified(events)
        setModifiedFiles(modified)
        setSelectedFile(modified.length > 0 ? modified[0].file : null)
      })
  }, [activeSession])

  // --- File content loading ---
  useEffect(() => {
    if (!selectedFile) return
    fetchFile(selectedFile).then(setFileContent).catch(() => setFileContent(''))
  }, [selectedFile, fetchCounter])

  // --- Timeline file click handler ---
  const handleFileClick = useCallback((filePath: string, editRanges?: string[]) => {
    setSelectedFile(filePath)
    setFetchCounter(c => c + 1)
    // Update modified files with editRanges if provided
    if (editRanges) {
      setModifiedFiles(prev => {
        const idx = prev.findIndex(f => f.file === filePath)
        if (idx !== -1) return prev // already tracked
        return [{ file: filePath, count: 1, editRanges }, ...prev]
      })
    }
  }, [])

  // --- Derived stores ---
  // --- Session store (no FOCUS_ID — let Aria manage focus internally to avoid render loop) ---
  const sessionStore = useMemo(() => {
    const entities: Record<string, Entity> = {}
    const childIds: string[] = []
    for (const s of sessions) {
      entities[s.id] = { id: s.id, data: { label: s.label, mtime: s.mtime, isLive: s.id === sessions[0]?.id } }
      childIds.push(s.id)
    }
    return createStore({ entities, relationships: { [ROOT_ID]: childIds } })
  }, [sessions])

  const handleSessionChange = useCallback((newStore: NormalizedData) => {
    const focusedId = (newStore.entities[FOCUS_ID]?.focusedId as string) ?? ''
    if (focusedId && newStore.entities[focusedId]) {
      setActiveSession(focusedId)
    }
  }, [])

  // modifiedStore: no FOCUS_ID sync to avoid onChange→setState→rerender loop
  const modifiedStore = useMemo(
    () => buildModifiedStore(modifiedFiles, null),
    [modifiedFiles],
  )

  // --- Handlers ---
  const handleModifiedChange = useCallback((newStore: NormalizedData) => {
    const focusedId = (newStore.entities[FOCUS_ID]?.focusedId as string) ?? ''
    if (focusedId && newStore.entities[focusedId]) {
      setSelectedFile(focusedId)
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
      {activeSession && (
        <TimelineColumn
          sessionId={activeSession}
          sessionLabel={sessions.find(s => s.id === activeSession)?.label ?? 'Timeline'}
          isLive={isLiveSession}
          onFileClick={handleFileClick}
        />
      )}

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
