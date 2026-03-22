import styles from './PageViewer.module.css'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  FileText, ChevronRight, ChevronDown, Circle, PanelLeft, Search,
} from 'lucide-react'
import { Aria } from '../interactive-os/components/aria'
import { treegrid } from '../interactive-os/behaviors/treegrid'
import { core, FOCUS_ID } from '../interactive-os/plugins/core'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData, Entity, Plugin } from '../interactive-os/core/types'
import { EXPANDED_ID } from '../interactive-os/plugins/core'
import { CodeBlock } from './viewer/CodeBlock'
import { ExportDiagram } from './viewer/ExportDiagram'
import { MarkdownViewer } from './viewer/MarkdownViewer'
import { MdxViewer } from './viewer/MdxViewer'
import { FileIcon } from './viewer/FileIcon'
import { Breadcrumb } from './viewer/Breadcrumb'
import { QuickOpen } from './viewer/QuickOpen'
import { DEFAULT_ROOT, type FileNodeData } from './viewer/types'

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

function isSourceFile(filename: string): boolean {
  const ext = filename.split('.').pop() ?? ''
  return ['ts', 'tsx', 'js', 'jsx'].includes(ext)
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

// --- Constants ---

const EMPTY_STORE = createStore({ entities: {}, relationships: { [ROOT_ID]: [] } })
const EMPTY_PLUGINS: Plugin[] = []

// --- Main component ---

export default function PageViewer() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const urlFilePath = useMemo(() => urlPathToFilePath(pathname), [pathname])

  const [initialStore, setInitialStore] = useState<NormalizedData | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [treeCollapsed, setTreeCollapsed] = useState(false)
  const [quickOpenVisible, setQuickOpenVisible] = useState(false)
  const loadedFileRef = useRef<string | null>(null)
  const contentBodyRef = useRef<HTMLDivElement>(null)

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

  // selectedFile 변경 → 파일 콘텐츠 로드
  useEffect(() => {
    if (!selectedFile) return
    if (selectedFile === loadedFileRef.current) return
    loadedFileRef.current = selectedFile
    contentBodyRef.current?.scrollTo(0, 0)
    fetchFile(selectedFile).then(setFileContent)
  }, [selectedFile])

  const selectFile = useCallback((filePath: string) => {
    navigate(filePathToUrlPath(filePath), { replace: true })
  }, [navigate])

  const handleChange = useCallback((newStore: NormalizedData) => {
    const focusedId = (newStore.entities['__focus__']?.focusedId as string) ?? ''
    const entity = newStore.entities[focusedId]
    if (entity?.data && (entity.data as FileNodeData).type === 'file') {
      selectFile((entity.data as FileNodeData).path)
    }
  }, [selectFile])

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

  const filename = selectedFile?.split('/').pop() ?? ''
  const isMdx = filename.endsWith('.mdx')
  const isMarkdown = !isMdx && filename.endsWith('.md')
  const ext = filename.split('.').pop() ?? ''
  const lineCount = fileContent ? fileContent.split('\n').length : 0

  return (
    <Aria
      keyMap={quickOpenKeyMap}
      data={EMPTY_STORE}
      plugins={EMPTY_PLUGINS}
    >
    <div className={styles.vw}>
      {/* Tree panel (sidebar) */}
      {!treeCollapsed && (
        <div className={styles.vwTree}>
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
            <Aria
              behavior={treegrid}
              data={initialStore}
              plugins={[core()]}
              onChange={handleChange}
              aria-label="File tree"
            >
              <Aria.Item render={(node, state) => {
                const data = node.data as FileNodeData
                return (
                  <div className={styles.vwTreeItem}>
                    {data.type === 'directory' ? (
                      <span className={styles.vwTreeChevron}>
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
              }} />
            </Aria>
          </div>
        </div>
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
            {selectedFile && (
              <div className={styles.vwContentMeta}>
                <FileIcon name={filename} type="file" />
                <span>{ext.toUpperCase()}</span>
                <span className={styles.vwContentMetaSep} />
                <span>{lineCount} lines</span>
              </div>
            )}
            <button
              className={styles.vwStatusbarBtn}
              onClick={() => setQuickOpenVisible(true)}
              title="Quick Open (Cmd+P)"
            >
              <Search size={12} />
            </button>
          </div>
        </div>
        {selectedFile ? (
          <div className={styles.vwContentBody}>
            <div className={styles.vwContentCode} ref={contentBodyRef}>
              {isMdx
                ? <MdxViewer filePath={selectedFile} />
                : isMarkdown
                  ? <MarkdownViewer content={fileContent} />
                  : <CodeBlock code={fileContent} filename={filename} />
              }
            </div>
            {!isMarkdown && !isMdx && isSourceFile(filename) && (
              <div className={styles.vwContentGraph}>
                <ExportDiagram filePath={selectedFile} />
              </div>
            )}
          </div>
        ) : (
          <div className={styles.vwEmpty}>
            <FileText size={24} className={styles.vwEmptyIcon} />
            <span>Select a file to view</span>
          </div>
        )}
      </div>

      {/* Quick Open overlay */}
      {quickOpenVisible && initialStore && (
        <QuickOpen
          fileStore={initialStore}
          root={DEFAULT_ROOT}
          onSelect={selectFile}
          onClose={() => setQuickOpenVisible(false)}
        />
      )}
    </div>
    </Aria>
  )
}
