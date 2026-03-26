import styles from './PageViewer.module.css'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronDown, Circle, PanelLeft, Search,
} from 'lucide-react'
import { Aria } from '../interactive-os/primitives/aria'
import { TreeView } from '../interactive-os/ui/TreeView'
import { useResizer } from '../hooks/useResizer'
import '../styles/resizer.css'
import { core, FOCUS_ID } from '../interactive-os/plugins/core'
import { createStore, getChildren, getEntityData, updateEntityData, removeEntity } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData, Entity } from '../interactive-os/store/types'
import type { Plugin } from '../interactive-os/plugins/types'
import { EXPANDED_ID } from '../interactive-os/plugins/core'
import { CodeBlock } from '../interactive-os/ui/CodeBlock'
import { MarkdownViewer } from '../interactive-os/ui/MarkdownViewer'
import { FileIcon } from '../interactive-os/ui/FileIcon'
import { Breadcrumb } from '../interactive-os/ui/Breadcrumb'
import { QuickOpen } from './viewer/QuickOpen'
import { DEFAULT_ROOT, type FileNodeData } from './viewer/types'
import { Workspace } from '../interactive-os/ui/Workspace'
import { createWorkspace, workspaceCommands, findTabgroup, openTab } from '../interactive-os/plugins/workspaceStore'
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

const EMPTY_STORE = createStore({ entities: {}, relationships: { [ROOT_ID]: [] } })
const EMPTY_PLUGINS: Plugin[] = []

// --- Main component ---

export default function PageViewer() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const urlFilePath = useMemo(() => urlPathToFilePath(pathname), [pathname])

  const [initialStore, setInitialStore] = useState<NormalizedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [treeCollapsed, setTreeCollapsed] = useState(false)
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
        let store = updateEntityData(prev, PREVIEW_TAB_ID, { label: filename, contentRef: filePath })
        return workspaceCommands.setActiveTab(tgId, PREVIEW_TAB_ID).execute(store)
      }
      return workspaceCommands.addTab(tgId, {
        id: PREVIEW_TAB_ID,
        data: { type: 'tab', label: filename, contentType: 'file', contentRef: filePath, preview: true },
      }).execute(prev)
    })
    navigate(filePathToUrlPath(filePath), { replace: true })
  }, [navigate])

  // Enter/클릭 → 영구 탭으로 열기
  const pinFile = useCallback((filePath: string) => {
    setWorkspaceStore(prev => {
      const tgId = findTabgroup(prev)
      if (!tgId) return prev

      const tabIds = getChildren(prev, tgId)
      const filename = filePath.split('/').pop() ?? filePath

      // preview 탭이 이 파일을 보여주고 있으면 → 영구 탭으로 승격
      if (tabIds.includes(PREVIEW_TAB_ID)) {
        const previewData = getEntityData<TabData>(prev, PREVIEW_TAB_ID)
        if (previewData?.contentRef === filePath) {
          let store = removeEntity(prev, PREVIEW_TAB_ID)
          return workspaceCommands.addTab(tgId, {
            id: `tab-${filePath}`,
            data: { type: 'tab', label: filename, contentType: 'file', contentRef: filePath },
          }).execute(store)
        }
      }

      // 아니면 일반 openTab (중복 방지)
      return openTab(prev, tgId, filePath, () => ({
        id: `tab-${filePath}`,
        data: { type: 'tab', label: filename, contentType: 'file', contentRef: filePath },
      }))
    })
    navigate(filePathToUrlPath(filePath), { replace: true })
  }, [navigate])

  // followFocus: 트리 포커스 이동 시 preview
  const handleChange = useCallback((newStore: NormalizedData) => {
    const focusedId = (newStore.entities['__focus__']?.focusedId as string) ?? ''
    const entity = newStore.entities[focusedId]
    if (entity?.data && (entity.data as unknown as FileNodeData).type === 'file') {
      previewFile((entity.data as unknown as FileNodeData).path)
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

  const quickOpenKeyMap = useMemo(() => ({
    'Meta+p': () => { setQuickOpenVisibleRef.current(true); return undefined },
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
    <Aria
      keyMap={quickOpenKeyMap}
      data={EMPTY_STORE}
      plugins={EMPTY_PLUGINS}
    >
    <div className={styles.vw}>
      {/* Tree panel (sidebar) */}
      {!treeCollapsed && (
        <>
        <div className={styles.vwTree} style={{ width: treeResizer.size }}>
          <div className={styles.vwTreeHeader}>
            <span className={styles.vwTreeHeaderTitle}>Explorer</span>
            <button
              className={styles.vwStatusbarBtn}
              onClick={() => setTreeCollapsed(true)}
              title="Hide explorer"
            >
              <PanelLeft size={12} />
            </button>
          </div>
          <div className={styles.vwTreeBody}>
            <TreeView
              data={initialStore}
              plugins={[core()]}
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
        </>
      )}

      {/* Content panel */}
      <div className={styles.vwContent}>
        <div className={styles.vwContentHeader}>
          <div className={styles.vwContentHeaderLeft}>
            {treeCollapsed && (
              <button
                className={styles.vwStatusbarBtn}
                onClick={() => setTreeCollapsed(false)}
                title="Show explorer"
              >
                <PanelLeft size={12} />
              </button>
            )}
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
    </Aria>
  )
}
