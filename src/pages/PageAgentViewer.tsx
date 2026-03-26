import styles from './PageAgentViewer.module.css'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Circle, FileText, Code } from 'lucide-react'
import { NavList } from '../interactive-os/ui/NavList'
import { createStore, getChildren, getEntityData } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData, Entity } from '../interactive-os/store/types'
import type { NodeState } from '../interactive-os/pattern/types'
import { TimelineColumn } from './viewer/TimelineColumn'
import { useAllModifiedFiles } from './viewer/viewerStore'
import { useResizer } from '../hooks/useResizer'
import '../styles/resizer.css'
import { Workspace } from '../interactive-os/ui/Workspace'
import { createWorkspace, workspaceCommands } from '../interactive-os/plugins/workspaceStore'
import type { TabData } from '../interactive-os/plugins/workspaceStore'
import { CodeBlock } from '../interactive-os/ui/CodeBlock'
import { MarkdownViewer } from '../interactive-os/ui/MarkdownViewer'

// --- Types ---

interface SessionInfo {
  id: string
  mtime: number
  label: string
  active: boolean
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

async function fetchFile(path: string): Promise<string> {
  const res = await fetch(`/api/fs/file?path=${encodeURIComponent(path)}`)
  return res.text()
}

// --- FilePanel ---

function FilePanel({ path }: { path: string }) {
  const [content, setContent] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bodyRef.current?.scrollTo(0, 0)
    fetchFile(path).then(setContent)
  }, [path])

  const filename = path.split('/').pop() ?? ''
  const isMarkdown = filename.endsWith('.md')

  return (
    <div ref={bodyRef} className={styles.avFilePanel}>
      {isMarkdown
        ? <MarkdownViewer content={content} />
        : <CodeBlock code={content} filename={filename} variant="flush" />
      }
    </div>
  )
}

// --- Workspace helpers ---

function findTabgroup(store: NormalizedData, parentId: string): string | undefined {
  for (const id of getChildren(store, parentId)) {
    const data = getEntityData<{ type: string }>(store, id)
    if (data?.type === 'tabgroup') return id
    if (data?.type === 'split') {
      const found = findTabgroup(store, id)
      if (found) return found
    }
  }
  return undefined
}

// --- Main Component ---

export default function PageAgentViewer() {
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [workspaceStore, setWorkspaceStore] = useState(() => createWorkspace())
  const [loading, setLoading] = useState(true)

  const sessionsResizer = useResizer({
    defaultSize: 200, minSize: 120, maxSize: 360, step: 10,
    storageKey: 'agent-sessions-width',
  })

  // Session list polling — active only, auto-append as workspace tabs
  useEffect(() => {
    const handleSessions = (fetched: SessionInfo[]) => {
      setSessions(fetched)
      if (fetched.length === 0) return

      setWorkspaceStore(prev => {
        const tgId = findTabgroup(prev, ROOT_ID)
        if (!tgId) return prev

        let store = prev
        const existingTabIds = getChildren(store, tgId)

        for (const session of fetched.filter(s => s.active)) {
          const tabId = `session-${session.id}`
          const exists = existingTabIds.includes(tabId)
          if (!exists) {
            store = workspaceCommands.addTab(tgId, {
              id: tabId,
              data: { type: 'tab', label: session.label, contentType: 'timeline', contentRef: session.id } as TabData,
            }).execute(store)
          }
        }
        return store
      })
    }

    const fetchSessions = () =>
      fetch('/api/agent-ops/sessions').then(r => r.json()).then(handleSessions).finally(() => setLoading(false))
    fetchSessions()
    const interval = setInterval(fetchSessions, 5000)
    return () => clearInterval(interval)
  }, [])

  const sessionMap = useMemo(() => new Map(sessions.map(s => [s.id, s])), [sessions])
  const activeSessions = useMemo(() => sessions.filter(s => s.active), [sessions])

  const handleFileClick = useCallback((filePath: string, _editRanges?: string[]) => {
    setWorkspaceStore(prev => {
      const tgId = findTabgroup(prev, ROOT_ID)
      if (!tgId) return prev

      const tabIds = getChildren(prev, tgId)
      const existingTab = tabIds.find(id => {
        const data = getEntityData(prev, id) as TabData | undefined
        return data?.contentRef === filePath
      })

      if (existingTab) {
        return workspaceCommands.setActiveTab(tgId, existingTab).execute(prev)
      }

      const filename = filePath.split('/').pop() ?? filePath
      return workspaceCommands.addTab(tgId, {
        id: `file-${filePath}`,
        data: { type: 'tab', label: filename, contentType: 'file', contentRef: filePath } as TabData,
      }).execute(prev)
    })
  }, [])

  // Modified files from store (aggregated across all sessions)
  const allModifiedFiles = useAllModifiedFiles()
  const filesStore = useMemo(() => buildFilesStore(allModifiedFiles), [allModifiedFiles])

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
        <span className="truncate">{label}</span>
      </div>
    )
  }, [])

  const renderPanel = useCallback((tab: Entity) => {
    const tabData = tab.data as unknown as TabData
    if (tabData.contentType === 'timeline') {
      const session = sessionMap.get(tabData.contentRef)
      if (!session) return null
      return (
        <TimelineColumn
          sessionId={session.id}
          sessionLabel={session.label}
          isLive={session.active}
          onClose={() => {}}
          onFileClick={handleFileClick}
        />
      )
    }
    if (tabData.contentType === 'file') {
      return <FilePanel path={tabData.contentRef} />
    }
    return null
  }, [sessionMap, handleFileClick])

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
                  <span className={styles.avSessionLive}><Circle size={8} fill="currentColor" /></span>
                  <span className={`${styles.avSessionLabel} truncate`}>{s.label}</span>
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

      {/* Workspace panels */}
      <div className={styles.avColumns}>
        <Workspace data={workspaceStore} onChange={setWorkspaceStore} renderPanel={renderPanel} />
      </div>
    </div>
  )
}
