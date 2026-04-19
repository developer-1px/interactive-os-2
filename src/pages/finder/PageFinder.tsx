// ② finder-viewer-prd.md
// @useState-hatch — sortKey/sortDir/filters: view preference; initialStore/loading: async tree fetch; quickOpenVisible: dismiss axis candidate; viewMode: view preference localStorage; currentRoot: sidebar selection; previewPath: follow-focus file preview
import { useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Folder, Code2, BookText, Image, Boxes, CalendarDays, CalendarClock, Hash, Tag, Activity, Component } from 'lucide-react'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { defineRouteKey } from '@os/primitives/defineRouteKey'
import { FlatLayout } from '@os/ui/FlatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { baseLayout } from './finderLayout'
import { updateEntityData } from '@os/store/createStore'
import { QuickOpen } from '@os/ui/QuickOpen'
import type { NormalizedData } from '@os/store/types'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import { sortStore, type SortKey, type SortDir } from './finderSort'
import { filterStore } from './finderFilter'
import { FOCUS_ID } from '@os/axis/navigate'
import { EXPANDED_ID } from '@os/axis/expand'
import { DEFAULT_ROOT, type FileNodeData } from './types'
import { fetchTree } from './fsClient'
import { treeToStore, urlPathToFilePath, filePathToUrlPath, withInitialFileSelected } from './treeTransform'
import { fetchMddbIndex } from './knowledgeFetch'
import { indexToTree, type KnowledgeGroupBy } from './knowledgeTransform'
import { pathParser } from '@os/plugins/urlParsers'
import { useUrlSync } from '@os/plugins/useUrlSync'
import { ax } from '@styles/ax'
import { FinderProvider, type FinderContextValue } from './finderContext'
import {
  FinderSidebarWidget,
  FinderToolbarWidget,
  FinderTreeGridWidget,
  FinderPreviewWidget,
  FinderMillerWidget,
} from './finderWidgets'

const VIEWMODE_KEY = 'finder-viewmode'

type FavoriteRoot = { id: string; name: string; path: string; icon: ReactNode }

const ICON_SIZE = 14

function toLocalDateParts(d: Date): { yyyy: string; mm: string; dd: string } {
  return {
    yyyy: String(d.getFullYear()),
    mm: String(d.getMonth() + 1).padStart(2, '0'),
    dd: String(d.getDate()).padStart(2, '0'),
  }
}

function docsDayPath(d: Date): string {
  const { yyyy, mm, dd } = toLocalDateParts(d)
  return `${DEFAULT_ROOT}/docs/${yyyy}/${yyyy}-${mm}/${yyyy}-${mm}-${dd}`
}

const NOW = new Date()
const YESTERDAY = new Date(NOW.getTime() - 24 * 60 * 60 * 1000)

const RECENT: FavoriteRoot[] = [
  { id: 'today',       name: 'Today',       path: docsDayPath(NOW),                   icon: <CalendarDays size={ICON_SIZE} /> },
  { id: 'yesterday',   name: 'Yesterday',   path: docsDayPath(YESTERDAY),             icon: <CalendarClock size={ICON_SIZE} /> },
]

const FAVORITES: FavoriteRoot[] = [
  { id: 'root',        name: '/',           path: DEFAULT_ROOT,                       icon: <Folder size={ICON_SIZE} /> },
  { id: 'src',         name: 'src',         path: `${DEFAULT_ROOT}/src`,              icon: <Code2 size={ICON_SIZE} /> },
  { id: 'docs',        name: 'docs',        path: `${DEFAULT_ROOT}/docs`,             icon: <BookText size={ICON_SIZE} /> },
  { id: 'ui',          name: 'UI Showcase', path: `${DEFAULT_ROOT}/contents/ui`,      icon: <Component size={ICON_SIZE} /> },
  { id: 'screenshots', name: 'screenshots', path: `${DEFAULT_ROOT}/screenshots`,      icon: <Image size={ICON_SIZE} /> },
]

const SIDEBAR_ROOTS: FavoriteRoot[] = [...RECENT, ...FAVORITES]

const DEFAULT_FAVORITE_ID = 'src'

// Knowledge 가상 폴더: mddb-index를 frontmatter 필드로 그룹핑
const KNOWLEDGE_VIRTUAL: Array<{ id: string; name: string; groupBy: KnowledgeGroupBy; icon: ReactNode }> = [
  { id: 'knowledge-all', name: 'All (mddb)', groupBy: 'tag', icon: <Boxes size={ICON_SIZE} /> },
  { id: 'knowledge-by-type', name: 'By Type', groupBy: 'type', icon: <Tag size={ICON_SIZE} /> },
  { id: 'knowledge-by-tag', name: 'By Tag', groupBy: 'tag', icon: <Hash size={ICON_SIZE} /> },
  { id: 'knowledge-by-status', name: 'By Status', groupBy: 'status', icon: <Activity size={ICON_SIZE} /> },
]

const KNOWLEDGE_GROUP_BY_ID: Record<string, KnowledgeGroupBy> = Object.fromEntries(
  KNOWLEDGE_VIRTUAL.map((v) => [v.id, v.groupBy]),
)

const sidebarData = createStore({
  entities: {
    'recent': { id: 'recent', data: { type: 'group', label: 'Recent' } },
    'favorites': { id: 'favorites', data: { type: 'group', label: 'Favorites' } },
    'knowledge-group': { id: 'knowledge-group', data: { type: 'group', label: 'Knowledge' } },
    ...Object.fromEntries(
      SIDEBAR_ROOTS.map((f) => [f.id, { id: f.id, data: { name: f.name, type: 'directory', icon: f.icon } }]),
    ),
    ...Object.fromEntries(
      KNOWLEDGE_VIRTUAL.map((v) => [v.id, { id: v.id, data: { name: v.name, type: 'directory', icon: v.icon } }]),
    ),
  },
  relationships: {
    [ROOT_ID]: ['recent', 'favorites', 'knowledge-group'],
    'recent': RECENT.map((f) => f.id),
    'favorites': FAVORITES.map((f) => f.id),
    'knowledge-group': KNOWLEDGE_VIRTUAL.map((v) => v.id),
  },
})

const finderWidgets = createWidgetRegistry({
  FinderSidebar: FinderSidebarWidget,
  FinderToolbar: FinderToolbarWidget,
  FinderTreeGrid: FinderTreeGridWidget,
  FinderPreview: FinderPreviewWidget,
  FinderMiller: FinderMillerWidget,
})

function resolveRoot(key: string): string {
  return SIDEBAR_ROOTS.find((f) => f.id === key)?.path ?? DEFAULT_ROOT
}

function detectRootFromSeg(seg: string | undefined): string {
  return SIDEBAR_ROOTS.find((f) => f.id === seg)?.id ?? DEFAULT_FAVORITE_ID
}

function detectRootFromPath(id: string): string {
  return SIDEBAR_ROOTS.find((f) => f.id !== 'root' && id.startsWith(f.path + '/'))?.id ?? DEFAULT_FAVORITE_ID
}

export default function PageFinder() {
  const navigate = useNavigate()

  const [initialStore, setInitialStore] = useState<NormalizedData | null>(null) // @useState-hatch
  const titleMapRef = useRef<Map<string, string>>(new Map())
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
    const initialFilePath = urlPathToFilePath(window.location.pathname, 'finder', DEFAULT_ROOT)
    // mddb-index 먼저 로드하여 md 파일의 frontmatter.title을 tree display name으로 사용
    Promise.all([
      fetchMddbIndex().then((idx) => {
        const map = new Map<string, string>()
        for (const e of idx.entries) {
          if (e.frontmatter.title) map.set(`${DEFAULT_ROOT}/${e.path}`, e.frontmatter.title)
        }
        titleMapRef.current = map
      }).catch(() => { /* mddb 없으면 파일명 그대로 사용 */ }),
      fetchTree(resolveRoot(currentRoot)),
    ]).then(([, tree]) => {
      let store = treeToStore(tree, titleMapRef.current)
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
          const next = treeToStore(tree, titleMapRef.current)
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

  const finderParser = useMemo(() => pathParser({ prefix: 'finder', root: DEFAULT_ROOT }), [])
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
      let store = treeToStore(tree, titleMapRef.current)
      if (store.entities[id]) {
        store = withInitialFileSelected(store, id)
        setPreviewPath(id)
      } else {
        setPreviewPath(null)
      }
      setInitialStore(store)
    })
  }, [])
  useUrlSync({ parser: finderParser, onUrlChange: handleUrlChange })

  // ── Handlers ──

  const handleChange = useCallback((newStore: NormalizedData) => {
    const focusedId = (newStore.entities['__focus__']?.focusedId as string) ?? ''
    const entity = newStore.entities[focusedId]
    if (entity?.data && (entity.data as unknown as FileNodeData).type === 'file') {
      const path = (entity.data as unknown as FileNodeData).path
      setPreviewPath(path)
      navigate(filePathToUrlPath(path, 'finder', DEFAULT_ROOT), { replace: false })
    } else {
      setPreviewPath(null)
    }
  }, [navigate])

  const handleSidebarActivate = useCallback((nodeId: string) => {
    const groupBy = KNOWLEDGE_GROUP_BY_ID[nodeId]
    if (groupBy) {
      setPreviewPath(null)
      setCurrentRoot(nodeId)
      fetchMddbIndex().then((idx) => {
        setInitialStore(indexToTree(idx, groupBy))
      }).catch((err) => {
        console.error('[finder] failed to load mddb-index.json', err)
      })
      return
    }
    if (SIDEBAR_ROOTS.some((f) => f.id === nodeId)) {
      setPreviewPath(null)
      setCurrentRoot(nodeId)
      fetchTree(resolveRoot(nodeId)).then((tree) => {
        setInitialStore(treeToStore(tree, titleMapRef.current))
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
    'Meta+p': defineRouteKey('finder:quick-open', () => setQuickOpenVisibleRef.current(true), 'Finder'),
  }), [])

  // ── Context ──

  const finderCtx = useMemo<FinderContextValue>(() => ({
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
        <FinderProvider value={finderCtx}>
          <FlatLayout data={layoutData} registry={finderWidgets} aria-label="File finder" />
        </FinderProvider>

        {quickOpenVisible && initialStore && (
          <QuickOpen
            fileStore={initialStore}
            root={DEFAULT_ROOT}
            persistKey="finder-quickopen-query"
            onSelect={(filePath) => {
              setPreviewPath(filePath)
              navigate(filePathToUrlPath(filePath, 'finder', DEFAULT_ROOT))
            }}
            onClose={() => setQuickOpenVisible(false)}
          />
        )}
      </div>
    </AriaRoute>
  )
}
