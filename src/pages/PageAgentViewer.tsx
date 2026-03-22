import styles from './PageAgentViewer.module.css'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Circle } from 'lucide-react'
import { Aria } from '../interactive-os/components/aria'
import { listbox } from '../interactive-os/behaviors/listbox'
import { core, FOCUS_ID } from '../interactive-os/plugins/core'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData, Entity } from '../interactive-os/core/types'
import { TimelineColumn } from './viewer/TimelineColumn'
import { FileViewerModal } from './viewer/FileViewerModal'
import { useResizer } from '../hooks/useResizer'
import '../styles/resizer.css'

// --- Types ---

interface SessionInfo {
  id: string
  mtime: number
  label: string
  active: boolean
}

// --- Behaviors ---

const sessionListbox = { ...listbox, followFocus: true }

// --- Constants (stable references) ---

const CORE_PLUGINS = [core()]

// --- localStorage-backed column order ---

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

// --- Component ---

function ResizableColumn({ session, onClose, onFileClick }: {
  session: SessionInfo
  onClose: () => void
  onFileClick: (path: string, ranges?: string[]) => void
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
        />
      </div>
      <div className="resizer-handle" aria-label={`Resize ${session.label}`} {...resizer.separatorProps} />
    </>
  )
}

export default function PageAgentViewer() {
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [columnOrder, setColumnOrderRaw] = useState<string[]>(loadColumnOrder)

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

  // Session list polling (5s) — auto-append new active sessions to columnOrder
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
  const archiveSessions = useMemo(() => sessions.filter(s => !s.active), [sessions])
  const displayColumns = columnOrder
    .map(id => sessionMap.get(id))
    .filter((s): s is SessionInfo => s != null)

  // Archive session handlers
  const handleArchiveSelect = useCallback((newStore: NormalizedData) => {
    const focusedId = (newStore.entities[FOCUS_ID]?.focusedId as string) ?? ''
    if (focusedId && newStore.entities[focusedId]) {
      updateColumnOrder(prev => {
        if (prev.includes(focusedId)) return prev
        return [...prev, focusedId]
      })
    }
  }, [updateColumnOrder])

  const handleFileClick = useCallback((filePath: string, editRanges?: string[]) => {
    setModalFile({ path: filePath, editRanges })
  }, [])

  // Archive store for Aria listbox
  const archiveStore = useMemo(() => {
    const entities: Record<string, Entity> = {}
    const childIds: string[] = []
    for (const s of archiveSessions) {
      entities[s.id] = { id: s.id, data: { label: s.label, mtime: s.mtime } }
      childIds.push(s.id)
    }
    return createStore({ entities, relationships: { [ROOT_ID]: childIds } })
  }, [archiveSessions])

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
      {/* Sessions panel — archive only */}
      {archiveSessions.length > 0 && (
        <>
          <div className={styles.avSessions} style={{ width: sessionsResizer.size }}>
            <div className={styles.avSessionsHeader}>
              <span className={styles.avSessionsTitle}>Archive</span>
            </div>
            <div className={styles.avSessionList}>
              <Aria
                behavior={sessionListbox}
                data={archiveStore}
                plugins={CORE_PLUGINS}
                onChange={handleArchiveSelect}
                aria-label="Archive sessions"
              >
                <Aria.Item render={(node) => {
                  const data = node.data as { label: string; mtime: number }
                  return (
                    <div className={styles.avSessionItem}>
                      <span className={styles.avSessionLabel}>{data.label}</span>
                    </div>
                  )
                }} />
              </Aria>
            </div>
          </div>
          <div className="resizer-handle" aria-label="Resize sessions panel" {...sessionsResizer.separatorProps} />
        </>
      )}

      {/* Timeline columns — horizontally scrollable */}
      <div className={styles.avColumns}>
        {displayColumns.length === 0 ? (
          <div className={styles.avEmpty}>
            <Circle size={24} strokeWidth={1} className={styles.avEmptyIcon} />
            <span>세션을 선택하세요</span>
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
                />
              </div>
            ) : (
              <ResizableColumn
                key={session.id}
                session={session}
                onClose={() => updateColumnOrder(prev => prev.filter(id => id !== session.id))}
                onFileClick={handleFileClick}
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
