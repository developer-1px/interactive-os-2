// ② finder-viewer-prd.md
// @useState-hatch — sortKey/sortDir/filters: view preference; initialStore/loading: async tree fetch; quickOpenVisible: dismiss axis candidate; viewMode: view preference localStorage; quickLookPath: popup axis candidate; currentRoot: sidebar selection; sizes: SplitPane local; previewPath: follow-focus file preview
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { defineRouteKey } from '@os/primitives/defineRouteKey'
import { TreeGrid } from '@os/ui/TreeGrid'
import { MillerColumns } from '@os/ui/MillerColumns'
import { FilterBar } from '@os/ui/FilterBar'
import { SortIndicator } from '@os/ui/indicators'
import { sortStore, type SortKey, type SortDir } from './viewerSort'
import { filterStore } from './viewerFilter'
import { SplitPane } from '@os/ui/SplitPane'
import type { PaneSize } from '@os/ui/SplitPane'
import type { NormalizedData } from '@os/store/types'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import { QuickOpen } from '@os/ui/QuickOpen'
import { NavList } from '@os/ui/NavList'
import { FinderToolbar } from '@os/ui/FinderToolbar'
import { FileViewerModal } from '@os/ui/FileViewerModal'
import { FOCUS_ID } from '@os/axis/navigate'
import { EXPANDED_ID } from '@os/axis/expand'
import { DEFAULT_ROOT, type FileNodeData } from './types'
import { fetchTree } from './fsClient'
import { treeToStore, urlPathToFilePath, filePathToUrlPath, withInitialFileSelected } from './treeTransform'
import { ax } from '@styles/ax'
import { SpinnerIndicator } from '@os/ui/indicators'
import { Panel, SidePanel } from '@os/ui/panels'
import { EmptyState } from '@os/ui/EmptyState'
import { FilePanel } from './widgets/FilePanel'

const TREE_RATIO_KEY = 'viewer-tree-ratio'
const DEFAULT_TREE_RATIO = 0.18
const VIEWMODE_KEY = 'viewer-viewmode'

const sidebarData = createStore({
  entities: {
    'favorites': { id: 'favorites', data: { type: 'group', label: 'Favorites' } },
    'src': { id: 'src', data: { name: 'src', type: 'directory', icon: 'folder' } },
    'docs': { id: 'docs', data: { name: 'docs', type: 'directory', icon: 'folder' } },
  },
  relationships: { [ROOT_ID]: ['favorites'], 'favorites': ['src', 'docs'] },
})

function resolveRoot(key: string): string {
  return DEFAULT_ROOT + '/' + key
}

export default function PageViewer() {
  useLocation()
  const navigate = useNavigate()

  const [initialStore, setInitialStore] = useState<NormalizedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [quickOpenVisible, setQuickOpenVisible] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'columns'>(() => {
    const saved = localStorage.getItem(VIEWMODE_KEY)
    return saved === 'columns' ? 'columns' : 'list'
  })
  const [quickLookPath, setQuickLookPath] = useState<string | null>(null)
  const [previewPath, setPreviewPath] = useState<string | null>(null) // @useState-hatch — follow-focus file preview
  const [currentRoot, setCurrentRoot] = useState('src')
  const [sortKey, setSortKey] = useState<SortKey | null>(null) // @useState-hatch
  const [sortDir, setSortDir] = useState<SortDir>('asc') // @useState-hatch
  const [filters, setFilters] = useState<string[]>([]) // @useState-hatch

  const [sizes, setSizes] = useState<PaneSize[]>(() => {
    const saved = localStorage.getItem(TREE_RATIO_KEY)
    const ratio = saved ? parseFloat(saved) : DEFAULT_TREE_RATIO
    return [Number.isFinite(ratio) ? ratio : DEFAULT_TREE_RATIO, 'flex']
  })
  useEffect(() => {
    const ratio = sizes[0]
    if (typeof ratio === 'number') localStorage.setItem(TREE_RATIO_KEY, String(ratio))
  }, [sizes])

  useEffect(() => {
    localStorage.setItem(VIEWMODE_KEY, viewMode)
  }, [viewMode])

  useEffect(() => {
    const initialFilePath = urlPathToFilePath(window.location.pathname, 'viewer', DEFAULT_ROOT)
    fetchTree(resolveRoot(currentRoot)).then((tree) => {
      let store = treeToStore(tree)
      if (initialFilePath && store.entities[initialFilePath]) {
        store = withInitialFileSelected(store, initialFilePath)
      }
      setInitialStore(store)
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only, sidebar switch uses handleSidebarActivate
  }, [])

  // Re-fetch tree on file add/remove (HMR custom event from vite-plugin-fs)
  useEffect(() => {
    if (!import.meta.hot) return
    const handler = () => {
      fetchTree(resolveRoot(currentRoot)).then((tree) => {
        setInitialStore(prev => {
          const next = treeToStore(tree)
          if (!prev) return next
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
  }, [currentRoot])

  const focusedFileRef = useRef<string | null>(null)

  const handleChange = useCallback((newStore: NormalizedData) => {
    const focusedId = (newStore.entities['__focus__']?.focusedId as string) ?? ''
    const entity = newStore.entities[focusedId]
    if (entity?.data && (entity.data as unknown as FileNodeData).type === 'file') {
      const path = (entity.data as unknown as FileNodeData).path
      focusedFileRef.current = path
      setPreviewPath(path)
      navigate(filePathToUrlPath(path, 'viewer', DEFAULT_ROOT), { replace: true })
    } else {
      focusedFileRef.current = null
      setPreviewPath(null)
    }
  }, [navigate])

  const handleActivate = useCallback((nodeId: string) => {
    if (!initialStore) return
    const entity = initialStore.entities[nodeId]
    if (entity?.data && (entity.data as unknown as FileNodeData).type === 'file') {
      setQuickLookPath((entity.data as unknown as FileNodeData).path)
    }
  }, [initialStore])

  const handleSidebarActivate = useCallback((nodeId: string) => {
    if (nodeId === 'src' || nodeId === 'docs') {
      setQuickLookPath(null)
      setPreviewPath(null)
      setCurrentRoot(nodeId)
      setLoading(true)
      fetchTree(resolveRoot(nodeId)).then((tree) => {
        setInitialStore(treeToStore(tree))
        setLoading(false)
      })
    }
  }, [])

  const setQuickOpenVisibleRef = useRef(setQuickOpenVisible)
  useEffect(() => { setQuickOpenVisibleRef.current = setQuickOpenVisible }, [setQuickOpenVisible])

  const setQuickLookPathRef = useRef(setQuickLookPath)
  useEffect(() => { setQuickLookPathRef.current = setQuickLookPath }, [setQuickLookPath])

  const quickOpenKeyMap = useMemo(() => ({
    'Meta+p': defineRouteKey('viewer:quick-open', () => setQuickOpenVisibleRef.current(true), 'Viewer'),
    'Space': defineRouteKey('viewer:quick-look', () => {
      const path = focusedFileRef.current
      if (path) {
        setQuickLookPathRef.current(prev => prev === path ? null : path)
      }
    }, 'Viewer'),
  }), [])

  const listStore = useMemo(() => {
    if (!initialStore) return null
    let store = initialStore
    if (filters.length > 0) store = filterStore(store, filters)
    if (sortKey) store = sortStore(store, sortKey, sortDir)
    return store
  }, [initialStore, filters, sortKey, sortDir])

  const handleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        return key
      }
      setSortDir(key === 'loc' ? 'desc' : 'asc')
      return key
    })
  }, [])

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
    <div className={`${ax({ layout: 'row' })} h-full min-h-0`}>
      <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes} minRatio={0.1}>
        <Panel surface="display">
          <div className={ax({ padding: 'xs' })}>
            <NavList
              data={sidebarData}
              onActivate={handleSidebarActivate}
              aria-label="Sidebar"
            />
          </div>
        </Panel>

        <div className={ax({ layout: 'fill' })}>
          <FinderToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onSearchClick={() => setQuickOpenVisible(true)}
          />
          {viewMode === 'list' && (
            <FilterBar
              filters={filters.map(ext => ({ id: ext, label: ext, onRemove: () => setFilters(f => f.filter(e => e !== ext)) }))}
            >
              <button className={ax({ surface: 'ghost', recipe: 'control-sm', interactive: 'button' })} onClick={() => handleSort('name')}>
                Name <SortIndicator direction={sortKey === 'name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined} />
              </button>
              <button className={ax({ surface: 'ghost', recipe: 'control-sm', interactive: 'button' })} onClick={() => handleSort('type')}>
                Type <SortIndicator direction={sortKey === 'type' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined} />
              </button>
              <button className={ax({ surface: 'ghost', recipe: 'control-sm', interactive: 'button' })} onClick={() => handleSort('loc')}>
                LOC <SortIndicator direction={sortKey === 'loc' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined} />
              </button>
              {['.tsx', '.ts', '.css', '.md', '.test.ts', '.test.tsx'].map(ext => (
                <button
                  key={ext}
                  className={ax({
                    surface: filters.includes(ext) ? 'display' : 'ghost',
                    recipe: 'control-sm',
                    interactive: 'button',
                  })}
                  onClick={() => setFilters(f => f.includes(ext) ? f.filter(e => e !== ext) : [...f, ext])}
                >
                  {ext}
                </button>
              ))}
            </FilterBar>
          )}
          <div className={ax({ layout: 'row-fill', flex: '1' })}>
            {viewMode === 'list' ? (
              listStore && Object.keys(listStore.entities).filter(k => !k.startsWith('__')).length > 0 ? (
                <div className={ax({ layout: 'fill', flex: '1' })}>
                  <TreeGrid
                    data={listStore}
                    onChange={handleChange}
                    onActivate={handleActivate}
                    itemSlots={{
                      rightContent: (node) => {
                        const d = node.data as Record<string, unknown>
                        if (d.type === 'directory') return null
                        const name = (d.name as string) ?? ''
                        const ext = name.includes('.') ? name.split('.').pop() ?? '' : ''
                        const loc = d.loc as number | undefined
                        return (
                          <span className={ax({ layout: 'bar', gap: 'sm', text: 'muted', textStyle: 'caption' })}>
                            <span>{ext}</span>
                            {loc != null && <span>{loc}</span>}
                          </span>
                        )
                      },
                    }}
                    aria-label="File browser"
                  />
                </div>
              ) : filters.length > 0 ? (
                <EmptyState title="No files match filter" description="Try removing some filters" />
              ) : null
            ) : (
              <MillerColumns
                data={initialStore}
                onChange={handleChange}
                onActivate={handleActivate}
                renderPreview={(nodeId) => <FilePanel path={nodeId} />}
                aria-label="File browser"
              />
            )}
            {viewMode === 'list' && (
              <SidePanel>
                {previewPath ? (
                  <FilePanel path={previewPath} />
                ) : (
                  <EmptyState title="No file selected" description="Click a file to preview" />
                )}
              </SidePanel>
            )}
          </div>
        </div>
      </SplitPane>

      {quickOpenVisible && initialStore && (
        <QuickOpen
          fileStore={initialStore}
          root={DEFAULT_ROOT}
          onSelect={setQuickLookPath}
          onClose={() => setQuickOpenVisible(false)}
        />
      )}

      <FileViewerModal
        filePath={quickLookPath}
        onClose={() => setQuickLookPath(null)}
      />
    </div>
    </AriaRoute>
  )
}
