import styles from './PageViewer.module.css'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronDown, Circle, Search,
} from 'lucide-react'
import { AriaRoute } from '../interactive-os/primitives/AriaRoute'
import { TreeView } from '../interactive-os/ui/TreeView'
import { useResizer } from '../hooks/useResizer'
import '../styles/resizer.css'
import { FOCUS_ID } from '../interactive-os/axis/navigate'
import { createStore, getChildren, getEntityData, updateEntityData, addEntity } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData, Entity } from '../interactive-os/store/types'
import { EXPANDED_ID } from '../interactive-os/axis/expand'
import { CodeBlock } from '../interactive-os/ui/CodeBlock'
import { MarkdownViewer } from '../interactive-os/ui/MarkdownViewer'
import { FileIcon } from '../interactive-os/ui/FileIcon'
import { Breadcrumb } from '../interactive-os/ui/Breadcrumb'
import { QuickOpen } from './viewer/QuickOpen'
import { DEFAULT_ROOT, type FileNodeData } from './viewer/types'
import { Workspace } from '../interactive-os/ui/Workspace'
import { createWorkspace, workspaceCommands, findTabgroup } from '../interactive-os/plugins/workspaceStore'
import type { TabData } from '../interactive-os/plugins/workspaceStore'

// --- Types ---

interface TreeNode {
  id: string
  name: string
  type: 'file' | 'directory'
  children?: TreeNode[]
}

// --- Data fetching ---

async function fetchTree(root: string): Promise<TreeNode[]> {
  const res = await fetch(`/api/fs/tree?root=${encodeURIComponent(root)}`)
  return res.json()
}

async function fetchFile(path: string): Promise<string> {
  const res = await fetch(`/api/fs/file?path=${encodeURIComponent(path)}`)
  return res.text()
}

// --- Convert tree to normalized store ---

function treeToStore(nodes: TreeNode[]): NormalizedData {
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  function walk(items: TreeNode[], parentId: string) {
    for (const node of items) {
      entities[node.id] = { id: node.id, data: { name: node.name, type: node.type, path: node.id } }
      if (!relationships[parentId]) relationships[parentId] = []
      relationships[parentId].push(node.id)
      if (node.children && node.children.length > 0) {
        walk(node.children, node.id)
      }
    }
  }

  walk(nodes, ROOT_ID)
  return createStore({ entities, relationships })
}

// --- URL ↔ file path helpers ---

function urlPathToFilePath(pathname: string): string | null {
  const relative = pathname.replace(/^\/viewer\/?/, '')
  if (!relative) return null
  return `${DEFAULT_ROOT}/${relative}`
}

function filePathToUrlPath(filePath: string): string {
  const relative = filePath.startsWith(DEFAULT_ROOT + '/')
    ? filePath.slice(DEFAULT_ROOT.length + 1)
    : filePath
  return `/viewer/${relative}`
}

function getAncestorIds(filePath: string, store: NormalizedData): string[] {
  const ancestors: string[] = []
  const parts = filePath.split('/')
  for (let i = 1; i < parts.length; i++) {
    const ancestorPath = parts.slice(0, i).join('/')
    if (store.entities[ancestorPath]) {
      ancestors.push(ancestorPath)
    }
  }
  return ancestors
}

function withInitialFileSelected(store: NormalizedData, filePath: string): NormalizedData {
  const ancestors = getAncestorIds(filePath, store)
  const existing = (store.entities[EXPANDED_ID]?.expandedIds as string[]) ?? []
  const merged = [...new Set([...existing, ...ancestors])]
  return {
    ...store,
    entities: {
      ...store.entities,
      [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: merged },
      [FOCUS_ID]: { id: FOCUS_ID, focusedId: filePath },
    },
  }
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
    <div ref={bodyRef} className={styles.vwContentCode}>
      {isMarkdown
        ? <MarkdownViewer content={content} />
        : <CodeBlock code={content} filename={filename} variant="flush" />
      }
    </div>
  )
}

// --- Constants ---


// --- Main component ---

export default function PageViewer() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const urlFilePath = useMemo(() => urlPathToFilePath(pathname), [pathname])

  const [initialStore, setInitialStore] = useState<NormalizedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [quickOpenVisible, setQuickOpenVisible] = useState(false)
  const [workspaceStore, setWorkspaceStore] = useState(() => createWorkspace())
  const treeResizer = useResizer({
    defaultSize: 280, minSize: 180, maxSize: 480, step: 10,
    storageKey: 'viewer-tree-width',
  })

  // selectedFile은 URL에서 파생 (single source of truth)
  const selectedFile = urlFilePath && initialStore?.entities[urlFilePath] ? urlFilePath : null

  useEffect(() => {
    const initialFilePath = urlPathToFilePath(window.location.pathname)
    fetchTree(DEFAULT_ROOT).then((tree) => {
      let store = treeToStore(tree)
      if (initialFilePath && store.entities[initialFilePath]) {
        store = withInitialFileSelected(store, initialFilePath)
      }
      setInitialStore(store)
      setLoading(false)
    })
  }, [])

  const PREVIEW_TAB_ID = '__preview__'

  // followFocus → preview tab 교체 (화살표 이동)
  const previewFile = useCallback((filePath: string) => {
    setWorkspaceStore(prev => {
      const tgId = findTabgroup(prev)
      if (!tgId) return prev

      const tabIds = getChildren(prev, tgId)
      const filename = filePath.split('/').pop() ?? filePath

      // 이미 영구 탭으로 열려있으면 활성화만
      const permanent = tabIds.find(id => {
        if (id === PREVIEW_TAB_ID) return false
        return (getEntityData<TabData>(prev, id))?.contentRef === filePath
      })
      if (permanent) {
        return workspaceCommands.setActiveTab(tgId, permanent).execute(prev)
      }

      // preview 탭이 이미 있으면 내용 교체, 없으면 생성
      if (tabIds.includes(PREVIEW_TAB_ID)) {
        const store = updateEntityData(prev, PREVIEW_TAB_ID, { label: filename, contentRef: filePath })
        return workspaceCommands.setActiveTab(tgId, PREVIEW_TAB_ID).execute(store)
      }
      return workspaceCommands.addTab(tgId, {
        id: PREVIEW_TAB_ID,
        data: { type: 'tab', label: filename, contentType: 'file', contentRef: filePath, preview: true },
      }).execute(prev)
    })
    navigate(filePathToUrlPath(filePath), { replace: true })
  }, [navigate])

  // Enter → preview 유지 + 영구 탭을 preview 왼쪽에 insert + focus는 preview에 복귀
  const pinFile = useCallback((filePath: string) => {
    setWorkspaceStore(prev => {
      const tgId = findTabgroup(prev)
      if (!tgId) return prev

      const tabIds = getChildren(prev, tgId)
      const filename = filePath.split('/').pop() ?? filePath
      const permanentId = `tab-${filePath}`

      // 이미 영구 탭으로 열려있으면 스킵
      if (tabIds.includes(permanentId)) return prev

      // preview 탭의 위치를 찾아서 그 앞에 insert
      const previewIndex = tabIds.indexOf(PREVIEW_TAB_ID)
      const insertIndex = previewIndex >= 0 ? previewIndex : tabIds.length

      // 영구 탭을 preview 앞에 insert (addEntity with index)
      let store = addEntity(prev, {
        id: permanentId,
        data: { type: 'tab', label: filename, contentType: 'file', contentRef: filePath },
      }, tgId, insertIndex)

      // activeTabId를 preview로 유지 (focus 복귀)
      if (previewIndex >= 0) {
        store = updateEntityData(store, tgId, { activeTabId: PREVIEW_TAB_ID })
      }

      return store
    })
    navigate(filePathToUrlPath(filePath), { replace: true })
  }, [navigate])

  // 현재 트리에서 포커스된 파일 경로를 추적 (keyMap에서 참조)
  const focusedFileRef = useRef<string | null>(null)

  // followFocus: 트리 포커스 이동 시 preview
  const handleChange = useCallback((newStore: NormalizedData) => {
    const focusedId = (newStore.entities['__focus__']?.focusedId as string) ?? ''
    const entity = newStore.entities[focusedId]
    if (entity?.data && (entity.data as unknown as FileNodeData).type === 'file') {
      const path = (entity.data as unknown as FileNodeData).path
      focusedFileRef.current = path
      previewFile(path)
    } else {
      focusedFileRef.current = null
    }
  }, [previewFile])

  // Enter → 영구 탭
  const handleActivate = useCallback((nodeId: string) => {
    if (!initialStore) return
    const entity = initialStore.entities[nodeId]
    if (entity?.data && (entity.data as unknown as FileNodeData).type === 'file') {
      pinFile((entity.data as unknown as FileNodeData).path)
    }
  }, [initialStore, pinFile])

  // Cmd+Enter → 매번 새 pane을 추가하여 파일 열기
  // 이미 split이 있으면 같은 레벨에 pane 추가 (중첩 방지)
  const openInNewPane = useCallback((filePath: string) => {
    setWorkspaceStore(prev => {
      const filename = filePath.split('/').pop() ?? filePath
      const newTgId = `tg-${Date.now()}`
      const tabId = `tab-${filePath}`

      const rootChildren = getChildren(prev, ROOT_ID)
      const existingSplitId = rootChildren.find(id =>
        (getEntityData<{ type: string }>(prev, id))?.type === 'split'
      )

      if (existingSplitId) {
        // 기존 split에 새 tabgroup 추가 + sizes 균등 재분배
        let store = addEntity(prev, {
          id: newTgId,
          data: { type: 'tabgroup', activeTabId: tabId },
        }, existingSplitId)

        const newChildren = getChildren(store, existingSplitId)
        const equalSize = 1 / newChildren.length
        const newSizes = newChildren.map(() => equalSize)
        store = updateEntityData(store, existingSplitId, { sizes: newSizes })

        return workspaceCommands.addTab(newTgId, {
          id: tabId,
          data: { type: 'tab', label: filename, contentType: 'file', contentRef: filePath },
        }).execute(store)
      }

      // split 없으면 첫 tabgroup을 split
      const tgId = findTabgroup(prev)
      if (!tgId) return prev

      const store = workspaceCommands.splitPane(tgId, 'horizontal').execute(prev)

      const newSplitId = getChildren(store, ROOT_ID).find(id =>
        (getEntityData<{ type: string }>(store, id))?.type === 'split'
      )
      if (!newSplitId) return store

      const splitChildren = getChildren(store, newSplitId)
      const lastTg = splitChildren[splitChildren.length - 1]
      if (!lastTg) return store

      return workspaceCommands.addTab(lastTg, {
        id: tabId,
        data: { type: 'tab', label: filename, contentType: 'file', contentRef: filePath },
      }).execute(store)
    })
    navigate(filePathToUrlPath(filePath), { replace: true })
  }, [navigate])

  const handleWorkspaceChange = useCallback((newStore: NormalizedData) => {
    setWorkspaceStore(newStore)
  }, [])

  const renderPanel = useCallback((tab: Entity) => {
    const tabData = tab.data as unknown as TabData
    if (!tabData?.contentRef) return null
    return <FilePanel path={tabData.contentRef} />
  }, [])

  const setQuickOpenVisibleRef = useRef(setQuickOpenVisible)
  useEffect(() => { setQuickOpenVisibleRef.current = setQuickOpenVisible }, [setQuickOpenVisible])

  const openInNewPaneRef = useRef(openInNewPane)
  useEffect(() => { openInNewPaneRef.current = openInNewPane }, [openInNewPane])

  // Cmd+D → 현재 active 탭을 새 panel에 복제
  const duplicatePane = useCallback(() => {
    setWorkspaceStore(prev => {
      const tgId = findTabgroup(prev)
      if (!tgId) return prev

      const tgData = getEntityData<{ activeTabId?: string }>(prev, tgId)
      const activeId = tgData?.activeTabId
      if (!activeId) return prev

      const tabData = getEntityData<TabData>(prev, activeId)
      if (!tabData?.contentRef) return prev

      const filename = tabData.contentRef.split('/').pop() ?? tabData.contentRef
      const newTabId = `tab-dup-${Date.now()}`

      const rootChildren = getChildren(prev, ROOT_ID)
      const existingSplitId = rootChildren.find(id =>
        (getEntityData<{ type: string }>(prev, id))?.type === 'split'
      )

      if (existingSplitId) {
        const newTgId = `tg-${Date.now()}`
        let store = addEntity(prev, {
          id: newTgId,
          data: { type: 'tabgroup', activeTabId: newTabId },
        }, existingSplitId)

        const newChildren = getChildren(store, existingSplitId)
        const equalSize = 1 / newChildren.length
        store = updateEntityData(store, existingSplitId, { sizes: newChildren.map(() => equalSize) })

        return workspaceCommands.addTab(newTgId, {
          id: newTabId,
          data: { type: 'tab', label: filename, contentType: tabData.contentType, contentRef: tabData.contentRef },
        }).execute(store)
      }

      // split 없으면 새로 만들기
      const store = workspaceCommands.splitPane(tgId, 'horizontal').execute(prev)
      const newSplitId = getChildren(store, ROOT_ID).find(id =>
        (getEntityData<{ type: string }>(store, id))?.type === 'split'
      )
      if (!newSplitId) return store

      const splitChildren = getChildren(store, newSplitId)
      const lastTg = splitChildren[splitChildren.length - 1]
      if (!lastTg) return store

      return workspaceCommands.addTab(lastTg, {
        id: newTabId,
        data: { type: 'tab', label: filename, contentType: tabData.contentType, contentRef: tabData.contentRef },
      }).execute(store)
    })
  }, [])

  const duplicatePaneRef = useRef(duplicatePane)
  useEffect(() => { duplicatePaneRef.current = duplicatePane }, [duplicatePane])

  const quickOpenKeyMap = useMemo(() => ({
    'Meta+p': () => { setQuickOpenVisibleRef.current(true) },
    'Meta+Enter': () => {
      const path = focusedFileRef.current
      if (path) openInNewPaneRef.current(path)
    },
    'Meta+d': () => {
      duplicatePaneRef.current()
    },
  }), [])


  if (loading || !initialStore) {
    return (
      <div className={styles.vwLoading}>
        <Circle size={12} className={styles.vwLoadingSpinner} />
        <span>Loading project...</span>
      </div>
    )
  }

  return (
    <AriaRoute keyMap={quickOpenKeyMap}>
    <div className={styles.vw}>
      {/* Tree panel (sidebar) */}
        <div className={styles.vwTree} style={{ width: treeResizer.size }}>
          <div className={styles.vwTreeHeader}>
            <span className={styles.vwTreeHeaderTitle}>Explorer</span>
          </div>
          <div className={styles.vwTreeBody}>
            <TreeView
              data={initialStore}
              plugins={[]}
              onChange={handleChange}
              onActivate={handleActivate}
              aria-label="File tree"
              renderItem={(props, node, state) => {
                const data = node.data as FileNodeData
                return (
                  <div className={styles.vwTreeItem}>
                    {data.type === 'directory' ? (
                      <span className={styles.vwTreeChevron} {...props.toggleProps}>
                        {state.expanded
                          ? <ChevronDown size={12} />
                          : <ChevronRight size={12} />}
                      </span>
                    ) : (
                      <span className={styles.vwTreeChevron} />
                    )}
                    <FileIcon name={data.name} type={data.type} expanded={state.expanded} />
                    <span className={`${styles.vwTreeName}${data.type === 'directory' ? ` ${styles.vwTreeNameDir}` : ''}`}>
                      {data.name}
                    </span>
                  </div>
                )
              }}
            />
          </div>
        </div>
        <div className="resizer-handle" aria-label="Resize explorer" {...treeResizer.separatorProps} />

      {/* Content panel */}
      <div className={styles.vwContent}>
        <div className={styles.vwContentHeader}>
          <div className={styles.vwContentHeaderLeft}>
            {selectedFile && <Breadcrumb path={selectedFile} root={DEFAULT_ROOT} />}
          </div>
          <div className={styles.vwContentHeaderRight}>
            <button
              className={styles.vwStatusbarBtn}
              onClick={() => setQuickOpenVisible(true)}
              title="Quick Open (Cmd+P)"
            >
              <Search size={12} />
            </button>
          </div>
        </div>
        <Workspace
          data={workspaceStore}
          onChange={handleWorkspaceChange}
          renderPanel={renderPanel}
          aria-label="File workspace"
        />
      </div>

      {/* Quick Open overlay */}
      {quickOpenVisible && initialStore && (
        <QuickOpen
          fileStore={initialStore}
          root={DEFAULT_ROOT}
          onSelect={pinFile}
          onClose={() => setQuickOpenVisible(false)}
        />
      )}
    </div>
    </AriaRoute>
  )
}
