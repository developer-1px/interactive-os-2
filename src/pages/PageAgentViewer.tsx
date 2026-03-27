// ② 2026-03-28-workspace-sync-prd.md
import styles from './PageAgentViewer.module.css'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Circle, FileText, Code } from 'lucide-react'
import { NavList } from '../interactive-os/ui/NavList'
import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData, Entity } from '../interactive-os/store/types'
import type { NodeState } from '../interactive-os/pattern/types'
import { TimelineColumn } from './viewer/TimelineColumn'
import { useAllModifiedFiles } from './viewer/viewerStore'
import { useResizer } from '../hooks/useResizer'
import '../styles/resizer.css'
import { useLayoutKeys } from '../hooks/useLayoutKeys'
import { CodeBlock } from '../interactive-os/ui/CodeBlock'
import { MarkdownViewer } from '../interactive-os/ui/MarkdownViewer'
import { Workspace } from '../interactive-os/ui/Workspace'
import {
  createWorkspace,
  workspaceCommands,
  findTabgroup,
  syncFromExternal,
  splitAndAddTab,
  openTab,
  collectContentRefs,
} from '../interactive-os/plugins/workspaceStore'
import type { TabData } from '../interactive-os/plugins/workspaceStore'
import { getEntityData } from '../interactive-os/store/createStore'

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

// --- Tab converters ---

function sessionToTab(session: SessionInfo): Entity {
  return {
    id: `tab-session-${session.id}`,
    data: { type: 'tab', label: session.label, contentType: 'timeline', contentRef: session.id },
  }
}

const isSessionTab = (d: Record<string, unknown>) => d.contentType === 'timeline'

// --- Main Component ---

export default function PageAgentViewer() {
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [dismissedSessions, setDismissedSessions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Workspace state — sync sessions as external items
  const [wsBase, setWsBase] = useState(() => createWorkspace())
  const wsDataRef = useRef<NormalizedData>(wsBase)

  const sessionsResizer = useResizer({
    defaultSize: 200, minSize: 120, maxSize: 360, step: 10,
    storageKey: 'agent-sessions-width',
  })

  // Session list polling
  useEffect(() => {
    const fetchSessions = () =>
      fetch('/api/agent-ops/sessions').then(r => r.json()).then(setSessions).finally(() => setLoading(false))
    fetchSessions()
    const interval = setInterval(fetchSessions, 5000)
    return () => clearInterval(interval)
  }, [])

  const sessionMap = useMemo(() => new Map(sessions.map(s => [s.id, s])), [sessions])
  const activeSessions = useMemo(() => sessions.filter(s => s.active), [sessions])

  // Sync active sessions → workspace tabs (filtered by contentType 'timeline')
  const syncableSessions = useMemo(
    () => activeSessions.filter(s => !dismissedSessions.has(s.id)),
    [activeSessions, dismissedSessions],
  )

  const wsData = useMemo(
    () => syncFromExternal(wsBase, syncableSessions, sessionToTab, isSessionTab),
    [wsBase, syncableSessions],
  )

  useEffect(() => { wsDataRef.current = wsData }, [wsData])

  // File click → add tab directly via openTab
  const handleFileClick = useCallback((filePath: string, _editRanges?: string[]) => {
    setWsBase(prev => {
      const tgId = findTabgroup(prev)
      if (!tgId) return prev
      const filename = filePath.split('/').pop() ?? filePath
      return openTab(prev, tgId, filePath, () => ({
        id: `tab-file-${Date.now()}`,
        data: { type: 'tab', label: filename, contentType: 'file', contentRef: filePath },
      }))
    })
  }, [])

  // Workspace onChange: detect tab removal
  const handleWorkspaceChange = useCallback((newData: NormalizedData) => {
    const oldRefs = collectContentRefs(wsDataRef.current)
    const newRefs = collectContentRefs(newData)
    for (const [ref, tabId] of oldRefs) {
      if (!newRefs.has(ref)) {
        const entity = wsDataRef.current.entities[tabId]
        const d = entity?.data as Record<string, unknown> | undefined
        if (d?.contentType === 'timeline') {
          setDismissedSessions(prev => new Set([...prev, ref]))
        }
      }
    }
    setWsBase(newData)
  }, [])

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

  // Layout keys: split duplicates active tab
  const layoutHandlers = useMemo(() => ({
    splitH: () => {
      setWsBase(prev => {
        const tgId = findTabgroup(prev)
        if (!tgId) return prev
        const tgData = getEntityData<{ activeTabId?: string }>(prev, tgId)
        const activeId = tgData?.activeTabId
        if (!activeId) return prev
        const tabData = getEntityData<TabData>(prev, activeId)
        if (!tabData?.contentRef) return prev

        return splitAndAddTab(prev, tgId, 'horizontal', {
          id: `tab-dup-${Date.now()}`,
          data: { type: 'tab', label: tabData.label ?? '', contentType: tabData.contentType, contentRef: tabData.contentRef },
        })
      })
    },
  }), [])
  const { onKeyDown: handleLayoutKeyDown } = useLayoutKeys(layoutHandlers)

  // Render panel for each tab
  const renderPanel = useCallback((tab: Entity) => {
    const tabData = tab.data as unknown as TabData
    if (!tabData?.contentRef) return null
    if (tabData.contentType === 'timeline') {
      const session = sessionMap.get(tabData.contentRef)
      if (!session) return null
      return (
        <TimelineColumn
          sessionId={session.id}
          sessionLabel={session.label}
          isLive={session.active}
          onClose={() => setWsBase(prev => workspaceCommands.removeTab(tab.id).execute(prev))}
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
    <div className={styles.av} onKeyDown={handleLayoutKeyDown}>
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

      {/* Workspace */}
      <div className={styles.avColumns}>
        <Workspace
          data={wsData}
          onChange={handleWorkspaceChange}
          renderPanel={renderPanel}
          aria-label="Agent workspace"
        />
      </div>
    </div>
  )
}
