import styles from './PageViewer.module.css'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronDown, Circle, Search,
} from 'lucide-react'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { TreeView } from '@os/ui/TreeView'
import { useResizer } from '../../hooks/useResizer'
import '../../styles/resizer.css'
import type { NormalizedData, Entity } from '@os/store/types'
import { FileIcon } from '@os/ui/FileIcon'
import { Breadcrumb } from '@os/ui/Breadcrumb'
import { QuickOpen } from '@os/ui/QuickOpen'
import { DEFAULT_ROOT, type FileNodeData } from './types'
import { fetchTree } from './fsClient'
import { treeToStore, urlPathToFilePath, filePathToUrlPath, withInitialFileSelected } from './treeTransform'
import { Workspace } from '@os/ui/Workspace'
import { createWorkspace } from '@os/plugins/workspaceStore'
import type { TabData } from '@os/plugins/workspaceStore'
import { useLayoutKeys } from '../../hooks/useLayoutKeys'
import { ax } from '@styles/ax'
import { FilePanel } from './widgets/FilePanel'
import { previewFileReducer, pinFileReducer, openInNewPaneReducer, duplicatePaneReducer } from './viewerWorkspace'

export default function PageViewer() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const urlFilePath = useMemo(() => urlPathToFilePath(pathname, 'viewer', DEFAULT_ROOT), [pathname])

  const [initialStore, setInitialStore] = useState<NormalizedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [quickOpenVisible, setQuickOpenVisible] = useState(false)
  const [workspaceStore, setWorkspaceStore] = useState(() => createWorkspace())
  const treeResizer = useResizer({
    defaultSize: 280, minSize: 180, maxSize: 480, step: 10,
    storageKey: 'viewer-tree-width',
  })

  const selectedFile = urlFilePath && initialStore?.entities[urlFilePath] ? urlFilePath : null

  useEffect(() => {
    const initialFilePath = urlPathToFilePath(window.location.pathname, 'viewer', DEFAULT_ROOT)
    fetchTree(DEFAULT_ROOT).then((tree) => {
      let store = treeToStore(tree)
      if (initialFilePath && store.entities[initialFilePath]) {
        store = withInitialFileSelected(store, initialFilePath)
      }
      setInitialStore(store)
      setLoading(false)
    })
  }, [])

  const previewFile = useCallback((filePath: string) => {
    setWorkspaceStore(prev => previewFileReducer(prev, filePath))
    navigate(filePathToUrlPath(filePath, 'viewer', DEFAULT_ROOT), { replace: true })
  }, [navigate])

  const pinFile = useCallback((filePath: string) => {
    setWorkspaceStore(prev => pinFileReducer(prev, filePath))
    navigate(filePathToUrlPath(filePath, 'viewer', DEFAULT_ROOT), { replace: true })
  }, [navigate])

  const focusedFileRef = useRef<string | null>(null)

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

  const handleActivate = useCallback((nodeId: string) => {
    if (!initialStore) return
    const entity = initialStore.entities[nodeId]
    if (entity?.data && (entity.data as unknown as FileNodeData).type === 'file') {
      pinFile((entity.data as unknown as FileNodeData).path)
    }
  }, [initialStore, pinFile])

  const openInNewPane = useCallback((filePath: string) => {
    setWorkspaceStore(prev => openInNewPaneReducer(prev, filePath))
    navigate(filePathToUrlPath(filePath, 'viewer', DEFAULT_ROOT), { replace: true })
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

  const duplicatePane = useCallback(() => {
    setWorkspaceStore(prev => duplicatePaneReducer(prev))
  }, [])

  const duplicatePaneRef = useRef(duplicatePane)
  useEffect(() => { duplicatePaneRef.current = duplicatePane }, [duplicatePane])

  const quickOpenKeyMap = useMemo(() => ({
    'Meta+p': () => { setQuickOpenVisibleRef.current(true) },
    'Meta+Enter': () => {
      const path = focusedFileRef.current
      if (path) openInNewPaneRef.current(path)
    },
  }), [])

  const viewerLayoutHandlers = useMemo(() => ({
    splitH: () => { duplicatePaneRef.current() },
    splitV: () => { duplicatePaneRef.current() },
  }), [])

  const { onKeyDown: handleLayoutKeyDown } = useLayoutKeys(viewerLayoutHandlers)

  if (loading || !initialStore) {
    return (
      <div className={`${styles.vwLoading} flex-row items-center justify-center`}>
        <Circle size={12} className={styles.vwLoadingSpinner} />
        <span>Loading project...</span>
      </div>
    )
  }

  return (
    <AriaRoute keyMap={quickOpenKeyMap}>
    <div className="flex-row h-full min-h-0" onKeyDown={handleLayoutKeyDown}>
      {/* Tree panel (sidebar) */}
        <div className={`${styles.vwTree} flex-col shrink-0`} style={{ width: treeResizer.size }}>
          <div className={`${styles.vwTreeHeader} flex-row items-center justify-between shrink-0`}>
            <span className={styles.vwTreeHeaderTitle}>Explorer</span>
          </div>
          {/* @FIXME(srp): 트리 renderItem — 페이지 주입 커스터마이징 vs 별도 파일. 판단 조건: 다른 곳에서 같은 렌더러를 쓰게 되면 분리 */}
          <div className={`${styles.vwTreeBody} flex-1 overflow-y-auto overflow-x-hidden`}>
            <TreeView
              data={initialStore}
              plugins={[]}
              onChange={handleChange}
              onActivate={handleActivate}
              aria-label="File tree"
              renderItem={(props, node, state) => {
                const data = node.data as FileNodeData
                return (
                  <div className={`${styles.vwTreeItem} flex-row items-center whitespace-nowrap`}>
                    {data.type === 'directory' ? (
                      <span className={`${styles.vwTreeChevron} inline-flex items-center justify-center shrink-0`} {...props.toggleProps}>
                        {state.expanded
                          ? <ChevronDown size={12} />
                          : <ChevronRight size={12} />}
                      </span>
                    ) : (
                      <span className={`${styles.vwTreeChevron} inline-flex items-center justify-center shrink-0`} />
                    )}
                    <FileIcon name={data.name} type={data.type} expanded={state.expanded} />
                    <span className={`${styles.vwTreeName} overflow-hidden${data.type === 'directory' ? ` ${styles.vwTreeNameDir}` : ''}`}>
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
      <div className={`${styles.vwContent} ${ax({ layout: 'fill' })}`}>
        <div className={`${styles.vwContentHeader} flex-row items-center justify-between shrink-0`}>
          <div className={`${styles.vwContentHeaderLeft} flex-row items-center`}>
            {selectedFile && <Breadcrumb path={selectedFile} root={DEFAULT_ROOT} />}
          </div>
          <div className={`${styles.vwContentHeaderRight} flex-row items-center`}>
            <button
              className={`${styles.vwStatusbarBtn} flex-row items-center justify-center border-none cursor-pointer`}
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
