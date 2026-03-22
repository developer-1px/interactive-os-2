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

// --- Component ---

export default function PageAgentViewer() {
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [openArchiveIds, setOpenArchiveIds] = useState<Set<string>>(new Set())
  const [modalFile, setModalFile] = useState<{ path: string; editRanges?: string[] } | null>(null)
  const [loading, setLoading] = useState(true)

  // Session list polling (5s)
  useEffect(() => {
    const fetchSessions = () =>
      fetch('/api/agent-ops/sessions').then(r => r.json()).then(setSessions).finally(() => setLoading(false))
    fetchSessions()
    const interval = setInterval(fetchSessions, 5000)
    return () => clearInterval(interval)
  }, [])

  const activeSessions = sessions.filter(s => s.active)
  const archiveSessions = sessions.filter(s => !s.active)
  const displayColumns = [
    ...activeSessions,
    ...archiveSessions.filter(s => openArchiveIds.has(s.id)),
  ]

  // Archive session handlers
  const handleArchiveSelect = useCallback((newStore: NormalizedData) => {
    const focusedId = (newStore.entities[FOCUS_ID]?.focusedId as string) ?? ''
    if (focusedId && newStore.entities[focusedId]) {
      setOpenArchiveIds(prev => new Set(prev).add(focusedId))
    }
  }, [])

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
        <div className={styles.avSessions}>
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
      )}

      {/* Timeline columns — horizontally scrollable */}
      <div className={styles.avColumns}>
        {displayColumns.length === 0 ? (
          <div className={styles.avEmpty}>
            <Circle size={24} strokeWidth={1} className={styles.avEmptyIcon} />
            <span>세션을 선택하세요</span>
          </div>
        ) : (
          displayColumns.map(session => (
            <TimelineColumn
              key={session.id}
              sessionId={session.id}
              sessionLabel={session.label}
              isLive={session.active}
              isArchive={openArchiveIds.has(session.id)}
              onClose={() => setOpenArchiveIds(prev => {
                const next = new Set(prev)
                next.delete(session.id)
                return next
              })}
              onFileClick={handleFileClick}
            />
          ))
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
