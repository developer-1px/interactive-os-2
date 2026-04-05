import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { defineRouteKey } from '@os/primitives/defineRouteKey'
import { FileTreeView } from '@os/ui/FileTreeView'
import { SplitPane } from '@os/ui/SplitPane'
import type { PaneSize } from '@os/ui/SplitPane'
import type { NormalizedData, Entity } from '@os/store/types'
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
import { useKeyMap } from '@os/primitives/useKeyMap'
import { ax } from '@styles/ax'
import { SpinnerIndicator } from '@os/ui/indicators'
import { Panel } from '@os/ui/panels'
import { FilePanel } from './widgets/FilePanel'
import { previewFileReducer, pinFileReducer, openInNewPaneReducer, duplicatePaneReducer } from './viewerWorkspace'

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
        setWorkspaceStore(prev => previewFileReducer(prev, initialFilePath))
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
    'Meta+p': defineRouteKey('viewer:quick-open', () => setQuickOpenVisibleRef.current(true), 'Viewer'),
    'Meta+Enter': defineRouteKey('viewer:open-in-new-pane', () => {
      const path = focusedFileRef.current
      if (path) openInNewPaneRef.current(path)
    }, 'Viewer'),
  }), [])

  const viewerLayoutHandlers = useMemo(() => ({
    splitH: () => { duplicatePaneRef.current() },
    splitV: () => { duplicatePaneRef.current() },
  }), [])

  const { onKeyDown: handleLayoutKeyDown } = useKeyMap(viewerLayoutHandlers)


  if (loading || !initialStore) {
    return (
      <div className={ax({ layout: 'center', gap: 'sm', textStyle: 'body', text: 'muted', flex: '1' })}>
        <SpinnerIndicator size="sm" />
        <span>Loading project...</span>
      </div>
    )
  }

  return (
    <AriaRoute keyMap={quickOpenKeyMap}>
    <div className={`${ax({ layout: 'row' })} h-full min-h-0`} onKeyDown={handleLayoutKeyDown}>
      <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes} minRatio={0.1}>
        {/* Tree panel (sidebar) */}
        <Panel header="Explorer" surface="display">
          <div className={ax({ padding: 'xs' })}>
            <FileTreeView
              data={initialStore}
              plugins={[]}
              onChange={handleChange}
              onActivate={handleActivate}
              aria-label="File tree"
            />
          </div>
        </Panel>

        {/* Content panel */}
        <div className={ax({ layout: 'fill' })}>
          <div className={ax({ layout: 'spread', padding: 'xs', flex: 'none' })}>
            <div className={ax({ layout: 'bar', gap: 'sm' })}>
              {selectedFile && <Breadcrumb path={selectedFile} root={DEFAULT_ROOT} />}
            </div>
            <div className={ax({ layout: 'bar', gap: 'sm' })}>
              <button
                className={ax({ surface: 'ghost', controlSize: 'sm', padding: 'sm', content: 'text' })}
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
