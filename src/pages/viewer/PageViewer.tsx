// ② finder-viewer-prd.md
// @useState-hatch — sortKey/sortDir/filters: view preference; initialStore/loading: async tree fetch; quickOpenVisible: dismiss axis candidate; viewMode: view preference localStorage; currentRoot: sidebar selection; sizes: SplitPane local; previewPath: follow-focus file preview
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { defineRouteKey } from '@os/primitives/defineRouteKey'
import { TreeGrid } from '@os/ui/TreeGrid'
import { MillerColumns } from '@os/ui/MillerColumns'
import { Button } from '@os/ui/Button'
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
import { FOCUS_ID } from '@os/axis/navigate'
import { EXPANDED_ID } from '@os/axis/expand'
import { DEFAULT_ROOT, type FileNodeData } from './types'
import { fetchTree } from './fsClient'
import { treeToStore, urlPathToFilePath, filePathToUrlPath, withInitialFileSelected } from './treeTransform'
import { pathParser } from '@os/plugins/urlParsers'
import { useUrlSync } from '@os/plugins/useUrlSync'
import { FileIcon } from '@os/ui/FileIcon'
import { ax } from '@styles/ax'
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
  const navigate = useNavigate()

  const [initialStore, setInitialStore] = useState<NormalizedData | null>(null) // @useState-hatch — async tree fetch
  const [quickOpenVisible, setQuickOpenVisible] = useState(false) // @useState-hatch — dismiss axis candidate
  const [viewMode, setViewMode] = useState<'list' | 'columns'>(() => {
    const saved = localStorage.getItem(VIEWMODE_KEY)
    return saved === 'columns' ? 'columns' : 'list'
  })
  const [previewPath, setPreviewPath] = useState<string | null>(null) // @useState-hatch — follow-focus file preview
  // ② url-sync-v2-prd.md — L1 bug fix: derive currentRoot from URL
  // @useState-hatch — sidebar selection derived from URL pathname
  const [currentRoot, setCurrentRoot] = useState(() => {
    const seg = window.location.pathname.split('/')[2]
    return seg === 'docs' ? 'docs' : 'src'
  })
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

  // ② url-sync-v2-prd.md — popstate → store re-initialization
  const viewerParser = useMemo(() => pathParser({ prefix: 'viewer', root: DEFAULT_ROOT }), [])
  const fetchIdRef = useRef(0)
  const currentRootRef = useRef(currentRoot)
  useEffect(() => { currentRootRef.current = currentRoot }, [currentRoot])
  const handleUrlChange = useCallback((id: string | null) => {
    if (!id) return
    const newRoot = id.startsWith(DEFAULT_ROOT + '/docs') ? 'docs' : 'src'
    if (newRoot === currentRootRef.current) {
      // Same tree — reuse current store, just update selection
      setInitialStore(prev => {
        if (!prev) return prev
        if (!prev.entities[id]) { setPreviewPath(null); return prev }
        setPreviewPath(id)
        return withInitialFileSelected(prev, id)
      })
      return
    }
    setCurrentRoot(newRoot)
    const thisId = ++fetchIdRef.current
    fetchTree(resolveRoot(newRoot)).then((tree) => {
      if (fetchIdRef.current !== thisId) return
      let store = treeToStore(tree)
      if (store.entities[id]) {
        store = withInitialFileSelected(store, id)
        setPreviewPath(id)
      } else {
        setPreviewPath(null)
      }
      setInitialStore(store)
    })
  }, [])
  useUrlSync({ parser: viewerParser, onUrlChange: handleUrlChange })

  const handleChange = useCallback((newStore: NormalizedData) => {
    const focusedId = (newStore.entities['__focus__']?.focusedId as string) ?? ''
    const entity = newStore.entities[focusedId]
    if (entity?.data && (entity.data as unknown as FileNodeData).type === 'file') {
      const path = (entity.data as unknown as FileNodeData).path
      setPreviewPath(path)
      // ② url-sync-v2-prd.md — push for back/forward navigation
      navigate(filePathToUrlPath(path, 'viewer', DEFAULT_ROOT), { replace: false })
    } else {
      setPreviewPath(null)
    }
  }, [navigate])

  const handleSidebarActivate = useCallback((nodeId: string) => {
    if (nodeId === 'src' || nodeId === 'docs') {
      setPreviewPath(null)
      setCurrentRoot(nodeId)
      fetchTree(resolveRoot(nodeId)).then((tree) => {
        setInitialStore(treeToStore(tree))
      })
    }
  }, [])

  const setQuickOpenVisibleRef = useRef(setQuickOpenVisible)
  useEffect(() => { setQuickOpenVisibleRef.current = setQuickOpenVisible }, [setQuickOpenVisible])

  const quickOpenKeyMap = useMemo(() => ({
    'Meta+p': defineRouteKey('viewer:quick-open', () => setQuickOpenVisibleRef.current(true), 'Viewer'),
  }), [])

  const listStore = useMemo(() => {
    if (!initialStore || viewMode !== 'list') return null
    let store = initialStore
    if (filters.length > 0) store = filterStore(store, filters)
    if (sortKey) store = sortStore(store, sortKey, sortDir)
    return store
  }, [initialStore, viewMode, filters, sortKey, sortDir])

  const sortDirection = (key: SortKey) =>
    sortKey === key ? (sortDir === 'asc' ? 'ascending' as const : 'descending' as const) : undefined

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

  if (!initialStore) return null

  return (
    <AriaRoute keyMap={quickOpenKeyMap}>
    <div className={`${ax({ layout: 'row' })} h-full min-h-0`}>
      <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes} minRatio={0.1}>
        <Panel surface="sunken">
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
            <div className={ax({ layout: 'bar', gap: 'xs', padding: 'xs', border: 'bottom' })}>
              <Button size="sm" onClick={() => handleSort('name')}>
                Name <SortIndicator direction={sortDirection('name')} />
              </Button>
              <Button size="sm" onClick={() => handleSort('type')}>
                Type <SortIndicator direction={sortDirection('type')} />
              </Button>
              <Button size="sm" onClick={() => handleSort('loc')}>
                LOC <SortIndicator direction={sortDirection('loc')} />
              </Button>
              <span className={ax({ border: 'end', flex: 'none' })} />
              {['.tsx', '.ts', '.css', '.md'].map(ext => (
                <Button
                  key={ext}
                  size="sm"
                  variant={filters.includes(ext) ? 'dialog' : 'ghost'}
                  onClick={() => setFilters(f => f.includes(ext) ? f.filter(e => e !== ext) : [...f, ext])}
                >
                  {ext}
                </Button>
              ))}
            </div>
          )}
          <div className={ax({ layout: 'row-fill', flex: '1' })}>
            {viewMode === 'list' ? (
              listStore && Object.keys(listStore.entities).filter(k => !k.startsWith('__')).length > 0 ? (
                <div className={ax({ layout: 'fill', flex: '1' })}>
                  <TreeGrid
                    data={listStore}
                    onChange={handleChange}
                    itemSlots={{
                      icon: (node, state) => {
                        const d = node.data as Record<string, unknown>
                        return <FileIcon name={d.name as string} type={d.type as string} expanded={state.expanded} />
                      },
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
                renderPreview={(nodeId) => <FilePanel path={nodeId} />}
                aria-label="File browser"
              />
            )}
            {viewMode === 'list' && previewPath && (
              <SidePanel surface="raised">
                <FilePanel path={previewPath} />
              </SidePanel>
            )}
          </div>
        </div>
      </SplitPane>

      {quickOpenVisible && initialStore && (
        <QuickOpen
          fileStore={initialStore}
          root={DEFAULT_ROOT}
          onSelect={setPreviewPath}
          onClose={() => setQuickOpenVisible(false)}
        />
      )}

    </div>
    </AriaRoute>
  )
}
