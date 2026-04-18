// ② finder-viewer-prd.md
// @useState-hatch — sortKey/sortDir/filters: view preference; initialStore/loading: async tree fetch; quickOpenVisible: dismiss axis candidate; viewMode: view preference localStorage; currentRoot: sidebar selection; previewPath: follow-focus file preview
import { useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Folder, Code2, BookText, Image, Boxes } from 'lucide-react'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { defineRouteKey } from '@os/primitives/defineRouteKey'
import { FlatLayout } from '@os/ui/FlatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { baseLayout } from './viewerLayout'
import { updateEntityData } from '@os/store/createStore'
import { QuickOpen } from '@os/ui/QuickOpen'
import type { NormalizedData } from '@os/store/types'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import { sortStore, type SortKey, type SortDir } from './viewerSort'
import { filterStore } from './viewerFilter'
import { FOCUS_ID } from '@os/axis/navigate'
import { EXPANDED_ID } from '@os/axis/expand'
import { DEFAULT_ROOT, type FileNodeData } from './types'
import { fetchTree } from './fsClient'
import { treeToStore, urlPathToFilePath, filePathToUrlPath, withInitialFileSelected } from './treeTransform'
import { fetchMddbIndex } from './knowledgeFetch'
import { indexToTree } from './knowledgeTransform'
import { pathParser } from '@os/plugins/urlParsers'
import { useUrlSync } from '@os/plugins/useUrlSync'
import { ax } from '@styles/ax'
import { ViewerProvider, type ViewerContextValue } from './viewerContext'
import {
  ViewerSidebarWidget,
  ViewerToolbarWidget,
  ViewerSortBarWidget,
  ViewerTreeGridWidget,
  ViewerPreviewWidget,
  ViewerMillerWidget,
} from './viewerWidgets'

const VIEWMODE_KEY = 'viewer-viewmode'

type FavoriteRoot = { id: string; name: string; path: string; icon: ReactNode; hint: string }

const ICON_SIZE = 14

const FAVORITES: FavoriteRoot[] = [
  { id: 'root',        name: '/',           path: DEFAULT_ROOT,                       icon: <Folder size={ICON_SIZE} />,   hint: 'all' },
  { id: 'src',         name: 'src',         path: `${DEFAULT_ROOT}/src`,              icon: <Code2 size={ICON_SIZE} />,    hint: 'app' },
  { id: 'docs',        name: 'docs',        path: `${DEFAULT_ROOT}/docs`,             icon: <BookText size={ICON_SIZE} />, hint: 'PARA' },
  { id: 'screenshots', name: 'screenshots', path: `${DEFAULT_ROOT}/screenshots`,      icon: <Image size={ICON_SIZE} />,    hint: 'snap' },
]

const DEFAULT_FAVORITE_ID = 'src'

const KNOWLEDGE_ID = 'knowledge'

const hintHtml = (text: string) => <span className={ax({ textStyle: 'caption' })}>{text}</span>

const sidebarData = createStore({
  entities: {
    'favorites': { id: 'favorites', data: { type: 'group', label: 'Favorites' } },
    ...Object.fromEntries(
      FAVORITES.map((f) => [f.id, { id: f.id, data: { name: f.name, type: 'directory', icon: f.icon, rightContent: hintHtml(f.hint) } }]),
    ),
    [KNOWLEDGE_ID]: { id: KNOWLEDGE_ID, data: { name: 'Knowledge', type: 'directory', icon: <Boxes size={ICON_SIZE} />, rightContent: hintHtml('mddb') } },
  },
  relationships: {
    [ROOT_ID]: ['favorites'],
    'favorites': [...FAVORITES.map((f) => f.id), KNOWLEDGE_ID],
  },
})

const viewerWidgets = createWidgetRegistry({
  ViewerSidebar: ViewerSidebarWidget,
  ViewerToolbar: ViewerToolbarWidget,
  ViewerSortBar: ViewerSortBarWidget,
  ViewerTreeGrid: ViewerTreeGridWidget,
  ViewerPreview: ViewerPreviewWidget,
  ViewerMiller: ViewerMillerWidget,
})

function resolveRoot(key: string): string {
  return FAVORITES.find((f) => f.id === key)?.path ?? DEFAULT_ROOT
}

function detectRootFromSeg(seg: string | undefined): string {
  return FAVORITES.find((f) => f.id === seg)?.id ?? DEFAULT_FAVORITE_ID
}

function detectRootFromPath(id: string): string {
  return FAVORITES.find((f) => f.id !== 'root' && id.startsWith(f.path + '/'))?.id ?? DEFAULT_FAVORITE_ID
}

export default function PageViewer() {
  const navigate = useNavigate()

  const [initialStore, setInitialStore] = useState<NormalizedData | null>(null) // @useState-hatch
  const [quickOpenVisible, setQuickOpenVisible] = useState(false) // @useState-hatch
  const [viewMode, setViewMode] = useState<'list' | 'columns'>(() => {
    const saved = localStorage.getItem(VIEWMODE_KEY)
    return saved === 'columns' ? 'columns' : 'list'
  })
  const [previewPath, setPreviewPath] = useState<string | null>(null) // @useState-hatch
  const [currentRoot, setCurrentRoot] = useState(() => detectRootFromSeg(window.location.pathname.split('/')[2]))
  const [sortKey, setSortKey] = useState<SortKey | null>(null) // @useState-hatch
  const [sortDir, setSortDir] = useState<SortDir>('asc') // @useState-hatch
  const [filters, setFilters] = useState<string[]>([]) // @useState-hatch

  useEffect(() => { localStorage.setItem(VIEWMODE_KEY, viewMode) }, [viewMode])

  // ── Tree fetch ──

  useEffect(() => {
    const initialFilePath = urlPathToFilePath(window.location.pathname, 'viewer', DEFAULT_ROOT)
    fetchTree(resolveRoot(currentRoot)).then((tree) => {
      let store = treeToStore(tree)
      if (initialFilePath && store.entities[initialFilePath]) {
        store = withInitialFileSelected(store, initialFilePath)
      }
      setInitialStore(store)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // ── URL sync ──

  const viewerParser = useMemo(() => pathParser({ prefix: 'viewer', root: DEFAULT_ROOT }), [])
  const fetchIdRef = useRef(0)
  const currentRootRef = useRef(currentRoot)
  useEffect(() => { currentRootRef.current = currentRoot }, [currentRoot])

  const handleUrlChange = useCallback((id: string | null) => {
    if (!id) return
    const newRoot = detectRootFromPath(id)
    if (newRoot === currentRootRef.current) {
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

  // ── Handlers ──

  const handleChange = useCallback((newStore: NormalizedData) => {
    const focusedId = (newStore.entities['__focus__']?.focusedId as string) ?? ''
    const entity = newStore.entities[focusedId]
    if (entity?.data && (entity.data as unknown as FileNodeData).type === 'file') {
      const path = (entity.data as unknown as FileNodeData).path
      setPreviewPath(path)
      navigate(filePathToUrlPath(path, 'viewer', DEFAULT_ROOT), { replace: false })
    } else {
      setPreviewPath(null)
    }
  }, [navigate])

  const handleSidebarActivate = useCallback((nodeId: string) => {
    if (nodeId === KNOWLEDGE_ID) {
      setPreviewPath(null)
      setCurrentRoot(KNOWLEDGE_ID)
      fetchMddbIndex().then((idx) => {
        setInitialStore(indexToTree(idx, 'topic'))
      }).catch((err) => {
        console.error('[viewer] failed to load mddb-index.json', err)
      })
      return
    }
    if (FAVORITES.some((f) => f.id === nodeId)) {
      setPreviewPath(null)
      setCurrentRoot(nodeId)
      fetchTree(resolveRoot(nodeId)).then((tree) => {
        setInitialStore(treeToStore(tree))
      })
    }
  }, [])

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

  // ── Derived ──

  const listStore = useMemo(() => {
    if (!initialStore || viewMode !== 'list') return null
    let store = initialStore
    if (filters.length > 0) store = filterStore(store, filters)
    if (sortKey) store = sortStore(store, sortKey, sortDir)
    return store
  }, [initialStore, viewMode, filters, sortKey, sortDir])

  // ── Layout: viewMode에 따라 hidden 토글 ──

  const layoutData = useMemo(() => {
    const isList = viewMode === 'list'
    let data = baseLayout
    data = updateEntityData(data, 'sort-bar', { hidden: !isList })
    data = updateEntityData(data, 'tree-area', { hidden: !isList })
    data = updateEntityData(data, 'preview', { hidden: !isList || !previewPath })
    data = updateEntityData(data, 'main', { hidden: !isList })
    data = updateEntityData(data, 'miller', { hidden: isList })
    return data
  }, [viewMode, previewPath])

  // ── KeyMap ──

  const setQuickOpenVisibleRef = useRef(setQuickOpenVisible)
  useEffect(() => { setQuickOpenVisibleRef.current = setQuickOpenVisible }, [setQuickOpenVisible])

  const quickOpenKeyMap = useMemo(() => ({
    'Meta+p': defineRouteKey('viewer:quick-open', () => setQuickOpenVisibleRef.current(true), 'Viewer'),
  }), [])

  // ── Context ──

  const viewerCtx = useMemo<ViewerContextValue>(() => ({
    initialStore: initialStore!,
    listStore,
    sidebarData,
    viewMode, setViewMode,
    sortKey, sortDir, onSort: handleSort,
    filters, setFilters,
    previewPath,
    onSidebarActivate: handleSidebarActivate,
    onSearchClick: () => setQuickOpenVisible(true),
    onChange: handleChange,
  }), [initialStore, listStore, viewMode, sortKey, sortDir, handleSort, filters, previewPath, handleSidebarActivate, handleChange])

  if (!initialStore) return null

  return (
    <AriaRoute keyMap={quickOpenKeyMap}>
      <div className={ax({ layout: 'row', flex: '1' })}>
        <ViewerProvider value={viewerCtx}>
          <FlatLayout data={layoutData} registry={viewerWidgets} aria-label="File viewer" />
        </ViewerProvider>

        {quickOpenVisible && initialStore && (
          <QuickOpen
            fileStore={initialStore}
            root={DEFAULT_ROOT}
            persistKey="viewer-quickopen-query"
            onSelect={(filePath) => {
              setPreviewPath(filePath)
              navigate(filePathToUrlPath(filePath, 'viewer', DEFAULT_ROOT))
            }}
            onClose={() => setQuickOpenVisible(false)}
          />
        )}
      </div>
    </AriaRoute>
  )
}
