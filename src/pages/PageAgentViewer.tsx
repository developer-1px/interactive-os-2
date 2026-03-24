import styles from './PageAgentViewer.module.css'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Circle, FileText, Code } from 'lucide-react'
import { NavList } from '../interactive-os/ui/NavList'
import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData, Entity } from '../interactive-os/store/types'
import type { NodeState } from '../interactive-os/pattern/types'
import { TimelineColumn } from './viewer/TimelineColumn'
import { FileViewerModal } from '../interactive-os/ui/FileViewerModal'
import { useResizer } from '../hooks/useResizer'
import '../styles/resizer.css'

// --- Types ---

interface SessionInfo {
  id: string
  mtime: number
  label: string
  active: boolean
}

// --- Constants ---

const STORAGE_KEY = 'agent-viewer-columns'

function loadColumnOrder(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveColumnOrder(order: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
}

// --- Helpers ---

function relPath(absPath: string): string {
  const idx = absPath.indexOf('/src/')
  if (idx !== -1) return absPath.slice(idx + 1)
  const docsIdx = absPath.indexOf('/docs/')
  if (docsIdx !== -1) return absPath.slice(docsIdx + 1)
  const parts = absPath.split('/')
  return parts.slice(-2).join('/')
}

function isMdFile(path: string): boolean {
  return path.endsWith('.md')
}

function buildFilesStore(files: string[]): NormalizedData {
  const mdFiles = files.filter(isMdFile)
  const srcFiles = files.filter(f => !isMdFile(f))

  const entities: Record<string, Entity> = {}
  const rootChildren: string[] = []

  if (srcFiles.length > 0) {
    const groupId = 'group-source'
    entities[groupId] = { id: groupId, data: { type: 'group', label: `Source (${srcFiles.length})` } }
    rootChildren.push(groupId)
    const groupChildren: string[] = []
    for (const f of srcFiles) {
      const id = `file-${f}`
      entities[id] = { id, data: { label: relPath(f), path: f } }
      groupChildren.push(id)
    }
    return createStore({
      entities: {
        ...entities,
        ...Object.fromEntries(mdFiles.map(f => [`file-${f}`, { id: `file-${f}`, data: { label: relPath(f), path: f } }])),
        ...(mdFiles.length > 0 ? { 'group-docs': { id: 'group-docs', data: { type: 'group', label: `Docs (${mdFiles.length})` } } } : {}),
      },
      relationships: {
        [ROOT_ID]: mdFiles.length > 0 ? [groupId, 'group-docs'] : [groupId],
        [groupId]: groupChildren,
        ...(mdFiles.length > 0 ? { 'group-docs': mdFiles.map(f => `file-${f}`) } : {}),
      },
    })
  }

  if (mdFiles.length > 0) {
    const groupId = 'group-docs'
    entities[groupId] = { id: groupId, data: { type: 'group', label: `Docs (${mdFiles.length})` } }
    rootChildren.push(groupId)
    const groupChildren: string[] = []
    for (const f of mdFiles) {
      const id = `file-${f}`
      entities[id] = { id, data: { label: relPath(f), path: f } }
      groupChildren.push(id)
    }
    return createStore({ entities, relationships: { [ROOT_ID]: rootChildren, [groupId]: groupChildren } })
  }

  return createStore({ entities: {}, relationships: { [ROOT_ID]: [] } })
}

// --- Resizable Column ---

function ResizableColumn({ session, onClose, onFileClick, onModifiedFilesChange }: {
  session: SessionInfo
  onClose: () => void
  onFileClick: (path: string, ranges?: string[]) => void
  onModifiedFilesChange?: (files: string[]) => void
}) {
  const resizer = useResizer({
    defaultSize: 420, minSize: 280, maxSize: 800, step: 10,
    storageKey: `agent-col-${session.id}`,
  })

  return (
    <>
      <div style={{ width: resizer.size, flexShrink: 0, height: '100%' }}>
        <TimelineColumn
          sessionId={session.id}
          sessionLabel={session.label}
          isLive={session.active}
          onClose={onClose}
          onFileClick={onFileClick}
          onModifiedFilesChange={onModifiedFilesChange}
        />
      </div>
      <div className="resizer-handle" aria-label={`Resize ${session.label}`} {...resizer.separatorProps} />
    </>
  )
}

// --- Main Component ---

export default function PageAgentViewer() {
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [columnOrder, setColumnOrderRaw] = useState<string[]>(loadColumnOrder)
  const [modifiedFiles, setModifiedFiles] = useState<Map<string, string[]>>(new Map())

  const updateColumnOrder = useCallback((updater: (prev: string[]) => string[]) => {
    setColumnOrderRaw(prev => {
      const next = updater(prev)
      if (next !== prev) saveColumnOrder(next)
      return next
    })
  }, [])
  const [modalFile, setModalFile] = useState<{ path: string; editRanges?: string[] } | null>(null)
  const [loading, setLoading] = useState(true)

  const sessionsResizer = useResizer({
    defaultSize: 200, minSize: 120, maxSize: 360, step: 10,
    storageKey: 'agent-sessions-width',
  })

  // Session list polling — active only, auto-append to columns
  useEffect(() => {
    const handleSessions = (fetched: SessionInfo[]) => {
      setSessions(fetched)
      if (fetched.length === 0) return

      const sessionIds = new Set(fetched.map(s => s.id))
      const activeIds = new Set(fetched.filter(s => s.active).map(s => s.id))

      updateColumnOrder(prev => {
        const kept = prev.filter(id => sessionIds.has(id))
        const keptSet = new Set(kept)
        const appended = [...activeIds].filter(id => !keptSet.has(id))
        const next = [...kept, ...appended]
        if (next.length !== prev.length || next.some((id, i) => id !== prev[i])) {
          return next
        }
        return prev
      })
    }

    const fetchSessions = () =>
      fetch('/api/agent-ops/sessions').then(r => r.json()).then(handleSessions).finally(() => setLoading(false))
    fetchSessions()
    const interval = setInterval(fetchSessions, 5000)
    return () => clearInterval(interval)
  }, [updateColumnOrder])

  const sessionMap = useMemo(() => new Map(sessions.map(s => [s.id, s])), [sessions])
  const activeSessions = useMemo(() => sessions.filter(s => s.active), [sessions])

  const displayColumns = columnOrder
    .map(id => sessionMap.get(id))
    .filter((s): s is SessionInfo => s != null && s.active)

  const handleFileClick = useCallback((filePath: string, editRanges?: string[]) => {
    setModalFile({ path: filePath, editRanges })
  }, [])

  // Collect all modified files across active sessions
  const allModifiedFiles = useMemo(() => {
    const allFiles = new Set<string>()
    for (const files of modifiedFiles.values()) {
      for (const f of files) allFiles.add(f)
    }
    return [...allFiles].sort()
  }, [modifiedFiles])

  const filesStore = useMemo(() => buildFilesStore(allModifiedFiles), [allModifiedFiles])

  const handleModifiedFilesChange = useCallback((sessionId: string) => (files: string[]) => {
    setModifiedFiles(prev => {
      const next = new Map(prev)
      next.set(sessionId, files)
      return next
    })
  }, [])

  const handleFileActivate = useCallback((nodeId: string) => {
    const path = nodeId.replace('file-', '')
    handleFileClick(path)
  }, [handleFileClick])

  const renderFileItem = useCallback((props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => {
    const data = item.data as Record<string, unknown>
    const label = data.label as string
    const isMd = isMdFile(data.path as string)
    const cls = styles.avFileItem + (state.focused ? ' ' + styles.avFileItemFocused : '')
    return (
      <div {...props} className={cls}>
        {isMd ? <FileText size={12} /> : <Code size={12} />}
        <span>{label}</span>
      </div>
    )
  }, [])

  if (loading) {
    return (
      <div className={styles.avLoading}>
        <Circle size={12} />
        <span>Connecting to agent...</span>
      </div>
    )
  }

  return (
    <div className={styles.av}>
      {/* Sessions + Files panel */}
      {activeSessions.length > 0 && (
        <>
          <div className={styles.avSessions} style={{ width: sessionsResizer.size }}>
            <div className={styles.avSessionsHeader}>
              <span className={styles.avSessionsTitle}>Agent</span>
            </div>

            {/* Active sessions */}
            <div className={styles.avSessionList}>
              <div className={styles.avGroupLabel}>활성 ({activeSessions.length})</div>
              {activeSessions.map(s => (
                <div key={s.id} className={styles.avSessionItem}>
                  <span className={styles.avSessionLive}>●</span>
                  <span className={styles.avSessionLabel}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Modified files */}
            {allModifiedFiles.length > 0 && (
              <div className={styles.avFilesSection}>
                <div className={styles.avGroupLabel}>수정 파일 ({allModifiedFiles.length})</div>
                <NavList
                  data={filesStore}
                  onActivate={handleFileActivate}
                  renderItem={renderFileItem}
                  aria-label="Modified files"
                />
              </div>
            )}
          </div>
          <div className="resizer-handle" aria-label="Resize sessions panel" {...sessionsResizer.separatorProps} />
        </>
      )}

      {/* Timeline columns */}
      <div className={styles.avColumns}>
        {displayColumns.length === 0 ? (
          <div className={styles.avEmpty}>
            <Circle size={24} className={styles.avEmptyIcon} />
            <span>활성 세션 없음</span>
          </div>
        ) : (
          displayColumns.map((session, i) => {
            const isLast = i === displayColumns.length - 1
            return isLast ? (
              <div key={session.id} style={{ flex: 1, minWidth: 280, height: '100%' }}>
                <TimelineColumn
                  sessionId={session.id}
                  sessionLabel={session.label}
                  isLive={session.active}
                  onClose={() => updateColumnOrder(prev => prev.filter(id => id !== session.id))}
                  onFileClick={handleFileClick}
                  onModifiedFilesChange={handleModifiedFilesChange(session.id)}
                />
              </div>
            ) : (
              <ResizableColumn
                key={session.id}
                session={session}
                onClose={() => updateColumnOrder(prev => prev.filter(id => id !== session.id))}
                onFileClick={handleFileClick}
                onModifiedFilesChange={handleModifiedFilesChange(session.id)}
              />
            )
          })
        )}
      </div>

      {/* File viewer modal */}
      <FileViewerModal
        filePath={modalFile?.path ?? null}
        editRanges={modalFile?.editRanges}
        onClose={() => setModalFile(null)}
      />
    </div>
  )
}
