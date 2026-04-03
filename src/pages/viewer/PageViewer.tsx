import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronDown, Circle, Search,
} from 'lucide-react'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { TreeView } from '@os/ui/TreeView'
import { SplitPane } from '@os/ui/SplitPane'
import type { PaneSize } from '@os/ui/SplitPane'
import type { NormalizedData, Entity } from '@os/store/types'
import { FileIcon } from '@os/ui/FileIcon'
import { Breadcrumb } from '@os/ui/Breadcrumb'
import { QuickOpen } from '@os/ui/QuickOpen'
import { FOCUS_ID } from '@os/axis/navigate'
import { EXPANDED_ID } from '@os/axis/expand'
import { DEFAULT_ROOT, type FileNodeData } from './types'
import { fetchTree } from './fsClient'
import { treeToStore, urlPathToFilePath, filePathToUrlPath, withInitialFileSelected } from './treeTransform'
import { Workspace } from '@os/ui/Workspace'
import { createWorkspace } from '@os/plugins/workspaceStore'
import type { TabData } from '@os/plugins/workspaceStore'
import { useLayoutKeys } from '../../hooks/useLayoutKeys'
import { ax } from '@styles/ax'
import styles from './PageViewer.module.css'
import { FilePanel } from './widgets/FilePanel'
import { previewFileReducer, pinFileReducer, openInNewPaneReducer, duplicatePaneReducer } from './viewerWorkspace'
import { LiveSessionPanel } from '../replay/LiveSessionPanel'
import { useActiveSessions } from '../replay/useActiveSessions'

const TREE_RATIO_KEY = 'viewer-tree-ratio'
const DEFAULT_TREE_RATIO = 0.18

export default function PageViewer() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const urlFilePath = useMemo(() => urlPathToFilePath(pathname, 'viewer', DEFAULT_ROOT), [pathname])

  const [initialStore, setInitialStore] = useState<NormalizedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [quickOpenVisible, setQuickOpenVisible] = useState(false)
  const [workspaceStore, setWorkspaceStore] = useState(() => createWorkspace())

  const [sizes, setSizes] = useState<PaneSize[]>(() => {
    const saved = localStorage.getItem(TREE_RATIO_KEY)
    const ratio = saved ? parseFloat(saved) : DEFAULT_TREE_RATIO
    return [Number.isFinite(ratio) ? ratio : DEFAULT_TREE_RATIO, 'flex']
  })
  useEffect(() => {
    const ratio = sizes[0]
    if (typeof ratio === 'number') localStorage.setItem(TREE_RATIO_KEY, String(ratio))
  }, [sizes])

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

  // Re-fetch tree on file add/remove (HMR custom event from vite-plugin-fs)
  useEffect(() => {
    if (!import.meta.hot) return
    const handler = () => {
      fetchTree(DEFAULT_ROOT).then((tree) => {
        setInitialStore(prev => {
          const next = treeToStore(tree)
          if (!prev) return next
          // Preserve expanded/focus state
          const expanded = prev.entities[EXPANDED_ID]
          const focus = prev.entities[FOCUS_ID]
          return {
            ...next,
            entities: {
              ...next.entities,
              ...(expanded && { [EXPANDED_ID]: expanded }),
              ...(focus && { [FOCUS_ID]: focus }),
            },
          }
        })
      })
    }
    import.meta.hot.on('fs:tree-update', handler)
    return () => { import.meta.hot!.off('fs:tree-update', handler) }
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

  // Live session auto-display
  const activeSessions = useActiveSessions()
  const hasLiveSession = activeSessions.length > 0
  const [liveSizes, setLiveSizes] = useState<PaneSize[]>([0.6, 0.4])

  const handleViewerUpdate = useCallback((_files: Map<string, string>, activeFilePath: string | null) => {
    if (activeFilePath) {
      setWorkspaceStore(prev => pinFileReducer(prev, activeFilePath))
    }
  }, [])

  if (loading || !initialStore) {
    return (
      <div className={`${styles.vwLoading} ${ax({ layout: 'center', gap: 'sm' })}`}>
        <Circle size={12} className={styles.vwLoadingSpinner} />
        <span>Loading project...</span>
      </div>
    )
  }

  return (
    <AriaRoute keyMap={quickOpenKeyMap}>
    <div className={`${ax({ layout: 'row' })} h-full min-h-0`} onKeyDown={handleLayoutKeyDown}>
      <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes} minRatio={0.1}>
        {/* Tree panel (sidebar) */}
        <div className={styles.vwTree}>
          <div className={`${styles.vwTreeHeader} ${ax({ layout: 'spread' })}`}>
            <span className={ax({ textStyle: 'caption', text: 'muted' })}>Explorer</span>
          </div>
          {/* @FIXME(srp): 트리 renderItem — 페이지 주입 커스터마이징 vs 별도 파일. 판단 조건: 다른 곳에서 같은 렌더러를 쓰게 되면 분리 */}
          <div className={`${styles.vwTreeBody} ${ax({ layout: 'scroll', flex: '1' })}`}>
            <TreeView
              data={initialStore}
              plugins={[]}
              onChange={handleChange}
              onActivate={handleActivate}
              aria-label="File tree"
              renderItem={(props, node, state) => {
                const data = node.data as FileNodeData
                return (
                  <div className={ax({ layout: 'bar', gap: 'xs' })}>
                    {data.type === 'directory' ? (
                      <span className={`${styles.vwTreeChevron} ${ax({ layout: 'center' })}`} {...props.toggleProps}>
                        {state.expanded
                          ? <ChevronDown size={12} />
                          : <ChevronRight size={12} />}
                      </span>
                    ) : (
                      <span className={`${styles.vwTreeChevron} ${ax({ layout: 'center' })}`} />
                    )}
                    <FileIcon name={data.name} type={data.type} expanded={state.expanded} />
                    <span className={`${ax({ text: 'secondary', clamp: '1' })}${data.type === 'directory' ? ` ${styles.vwTreeNameDir}` : ''}`}>
                      {data.name}
                    </span>
                  </div>
                )
              }}
            />
          </div>
        </div>

        {/* Content panel */}
        <div className={styles.vwContent}>
          <div className={`${styles.vwContentHeader} ${ax({ layout: 'spread' })}`}>
            <div className={ax({ layout: 'bar', gap: 'sm' })}>
              {selectedFile && <Breadcrumb path={selectedFile} root={DEFAULT_ROOT} />}
            </div>
            <div className={ax({ layout: 'bar', gap: 'sm' })}>
              <button
                className={ax({ surface: 'ghost', controlSize: 'sm' })}
                onClick={() => setQuickOpenVisible(true)}
                title="Quick Open (Cmd+P)"
              >
                <Search size={12} />
              </button>
            </div>
          </div>
          {hasLiveSession ? (
            <SplitPane direction="vertical" sizes={liveSizes} onResize={setLiveSizes} minRatio={0.15}>
              <Workspace
                data={workspaceStore}
                onChange={handleWorkspaceChange}
                renderPanel={renderPanel}
                aria-label="File workspace"
              />
              <LiveSessionPanel onViewerUpdate={handleViewerUpdate} />
            </SplitPane>
          ) : (
            <Workspace
              data={workspaceStore}
              onChange={handleWorkspaceChange}
              renderPanel={renderPanel}
              aria-label="File workspace"
            />
          )}
        </div>
      </SplitPane>

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
