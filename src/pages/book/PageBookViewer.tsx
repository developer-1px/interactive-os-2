// @useState-hatch
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { defineRouteKey } from '@os/primitives/defineRouteKey'
import { ax } from '@styles/ax'
import { FlatLayout } from '@os/ui/FlatLayout'
import { definePage } from '@os/layout'
import { updateEntityData } from '@os/store/createStore'
import { buildBook, buildTocStore, type BookPage, type Chapter } from './bookContent'
import { BookProvider, type BookContextValue } from './bookContext'
import {
  addRecent,
  getRecent,
  toggleFavorite,
  isFavorite,
  buildQuickOpenStore,
  buildAddToLayerStore,
  addToLayer,
  removeFromLayer,
  createLayer,
  getLayers,
} from './bookNavStore'
import { bookWidgets } from './bookWidgets'
import './PageBookViewer.css'

// ── Preload: cache book data so first render is instant ──

let _cache: { chapters: Chapter[]; pages: BookPage[] } | null = null

function getBook() {
  if (!_cache) _cache = buildBook()
  return _cache
}

/** Call from router loader or on link hover to warm up */
// eslint-disable-next-line react-refresh/only-export-components
export function loader() {
  return getBook()
}

// ── Base layout definition ──

const baseLayout = definePage({
  entities: {
    root:             { data: { type: 'stack' as const, gap: 'md' as const }, children: ['reader', 'pill-float', 'nav-float', 'progress'] },
    reader:           { data: { type: 'widget' as const, widget: 'BookReader' } },
    'pill-float':     { data: { type: 'floating' as const, anchor: 'float-top-start' as const }, children: ['pill'] },
    pill:             { data: { type: 'widget' as const, widget: 'BookPill' } },
    'nav-float':      { data: { type: 'floating' as const, anchor: 'float-bottom' as const }, children: ['nav'] },
    nav:              { data: { type: 'bar' as const, justify: 'between' as const, padding: 'lg' as const }, children: ['prev-btn', 'footer', 'next-btn'] },
    'prev-btn':       { data: { type: 'widget' as const, widget: 'BookPrevButton' } },
    footer:           { data: { type: 'widget' as const, widget: 'BookFooter' } },
    'next-btn':       { data: { type: 'widget' as const, widget: 'BookNextButton' } },
    progress:         { data: { type: 'widget' as const, widget: 'BookProgress' } },
    'toc-overlay':    { data: { type: 'overlay' as const, overlayType: 'modal' as const, visible: false }, children: ['toc-content'] },
    'toc-content':    { data: { type: 'widget' as const, widget: 'BookTocOverlay' } },
    'quick-open':     { data: { type: 'overlay' as const, overlayType: 'modal' as const, visible: false }, children: ['qo-content'] },
    'qo-content':     { data: { type: 'widget' as const, widget: 'BookQuickOpen' } },
    'layer-overlay':  { data: { type: 'overlay' as const, overlayType: 'modal' as const, visible: false }, children: ['layer-content'] },
    'layer-content':  { data: { type: 'widget' as const, widget: 'BookLayerOverlay' } },
  },
})

// ── Main component ──

export default function PageBookViewer() {
  const { chapters, pages } = useMemo(() => getBook(), [])
  const navigate = useNavigate()
  const location = useLocation()
  const [spread, setSpread] = useState(0)
  const [totalSpreads, setTotalSpreads] = useState(1)
  const [tocOpen, setTocOpen] = useState(false)
  const [arrivedFromNext, setArrivedFromNext] = useState(false)
  const [quickOpenVisible, setQuickOpenVisible] = useState(false)
  const [quickOpenFilter, setQuickOpenFilter] = useState('')
  const [favToggle, setFavToggle] = useState(0) // @useState-hatch
  const [layerOverlayVisible, setLayerOverlayVisible] = useState(false) // @useState-hatch
  const [layerToggle, setLayerToggle] = useState(0) // @useState-hatch
  const [layerNameInput, setLayerNameInput] = useState('') // @useState-hatch — inline layer naming
  const [layerNameMode, setLayerNameMode] = useState(false) // @useState-hatch
  const areaRef = useRef<HTMLDivElement>(null)
  const chromeVisible = true

  // ── Page index lookup ──
  const pageIndexById = useMemo(() => {
    const map = new Map<string, number>()
    for (let i = 0; i < pages.length; i++) map.set(pages[i].id, i)
    return map
  }, [pages])

  // ── URL → page index (auto-resume: redirect to last read page) ──
  const slug = location.pathname.replace('/book', '').replace(/^\//, '')
  const resolvedSlug = slug || (() => {
    const recent = getRecent()
    for (const id of recent) {
      if (pageIndexById.has(id)) return id
    }
    return ''
  })()
  const currentPage = resolvedSlug ? (pageIndexById.get(resolvedSlug) ?? 0) : 0
  const page = pages[currentPage]

  // ── Auto-resume: update URL if resolved from recent ──
  useEffect(() => {
    if (!slug && resolvedSlug && page) {
      navigate(`/book/${page.id}`, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Track recent on page change ──
  useEffect(() => {
    if (page) addRecent(page.id)
  }, [page?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── TOC store ──
  const tocStore = useMemo(
    () => buildTocStore(chapters, page?.id ?? ''),
    [chapters, page?.id],
  )

  // ── Quick Open store ──
  const pageInfos = useMemo(
    () => pages.map(p => ({ id: p.id, title: p.title, chapter: p.chapter, content: p.content })),
    [pages],
  )
  const quickOpenStore = useMemo(
    () => buildQuickOpenStore(pageInfos, quickOpenFilter),
    [pageInfos, quickOpenFilter, favToggle], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // ── Navigation ──
  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < pages.length) {
      navigate(`/book/${pages[index].id}`, { replace: true })
      setTocOpen(false)
      setQuickOpenVisible(false)
      setQuickOpenFilter('')
    }
  }, [pages, navigate])

  const goToId = useCallback((pageId: string) => {
    const index = pageIndexById.get(pageId)
    if (index != null) goTo(index)
  }, [pageIndexById, goTo])

  // ── Link transform for MarkdownViewer ──
  const linkTransform = useCallback((href: string) => {
    const match = href.match(/^\/?([\w/.-]+?)(?:\.mdx?)?$/)
    if (match && !href.startsWith('http')) {
      const pageId = match[1]
      return {
        href: `/book/${pageId}`,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault()
          goToId(pageId)
        },
      }
    }
    return { href }
  }, [goToId])

  const handleTocActivate = useCallback((nodeId: string) => {
    goToId(nodeId)
  }, [goToId])

  const handleQuickOpenActivate = useCallback((nodeId: string) => {
    const entity = quickOpenStore.entities[nodeId]
    const pageId = (entity?.data as Record<string, unknown>)?.pageId as string | undefined
    if (pageId) goToId(pageId)
  }, [quickOpenStore, goToId])

  // ── SpreadReader callbacks ──
  const handleNextBoundary = useCallback(() => {
    if (currentPage < pages.length - 1) {
      setArrivedFromNext(false)
      goTo(currentPage + 1)
    }
  }, [currentPage, pages.length, goTo])

  const handlePrevBoundary = useCallback(() => {
    if (currentPage > 0) {
      setArrivedFromNext(true)
      navigate(`/book/${pages[currentPage - 1].id}`, { replace: true })
    }
  }, [currentPage, pages, navigate])

  const handleSpreadChange = useCallback((s: number, total: number) => {
    setSpread(s)
    setTotalSpreads(total)
  }, [])

  // ── Favorite toggle ──
  const handleToggleFavorite = useCallback(() => {
    if (page) {
      toggleFavorite(page.id)
      setFavToggle(v => v + 1)
    }
  }, [page])

  const currentIsFavorite = page ? isFavorite(page.id) : false

  // ── Quick Open open/close ──
  const openQuickOpen = useCallback(() => {
    setQuickOpenVisible(true)
    setQuickOpenFilter('')
  }, [])

  const closeQuickOpen = useCallback(() => {
    setQuickOpenVisible(false)
    setQuickOpenFilter('')
  }, [])

  // ── Layer overlay ──
  const currentPageId = page?.id ?? ''
  const addToLayerStoreData = useMemo(
    () => buildAddToLayerStore(currentPageId),
    [currentPageId, layerToggle], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const openLayerOverlay = useCallback(() => {
    if (!page) return
    setLayerOverlayVisible(true)
  }, [page])

  const closeLayerOverlay = useCallback(() => {
    setLayerOverlayVisible(false)
    setLayerNameMode(false)
    setLayerNameInput('')
  }, [])

  const handleLayerActivate = useCallback((nodeId: string) => {
    if (!page) return
    const entity = addToLayerStoreData.entities[nodeId]
    const data = entity?.data as Record<string, unknown> | undefined
    const action = data?.action as string | undefined

    if (action === 'create') {
      setLayerNameMode(true)
      return
    } else if (action === 'add') {
      const layerId = data?.layerId as string
      addToLayer(layerId, page.id)
    } else if (action === 'remove') {
      const layerId = data?.layerId as string
      removeFromLayer(layerId, page.id)
    }

    setLayerToggle(v => v + 1)
    closeLayerOverlay()
  }, [page, addToLayerStoreData, closeLayerOverlay])

  const handleLayerNameSubmit = useCallback(() => {
    if (!page || !layerNameInput.trim()) return
    const layerId = createLayer(layerNameInput.trim())
    addToLayer(layerId, page.id)
    setLayerToggle(v => v + 1)
    closeLayerOverlay()
  }, [page, layerNameInput, closeLayerOverlay])

  // ── Page-level keyMap ──
  const modalOpen = quickOpenVisible || tocOpen || layerOverlayVisible
  const keyMap = useMemo(() => ({
    ...(modalOpen ? {} : {
      ArrowDown: defineRouteKey('book:next-page', () => {
        if (currentPage < pages.length - 1) goTo(currentPage + 1)
      }, 'Book'),
      ArrowUp: defineRouteKey('book:prev-page', () => {
        if (currentPage > 0) goTo(currentPage - 1)
      }, 'Book'),
      Home: defineRouteKey('book:first-page', () => {
        goTo(0)
      }, 'Book'),
      End: defineRouteKey('book:last-page', () => {
        goTo(pages.length - 1)
      }, 'Book'),
    }),
    'Mod+P': defineRouteKey('book:quick-open', () => {
      if (quickOpenVisible) closeQuickOpen()
      else openQuickOpen()
    }, 'Book'),
    'Mod+D': defineRouteKey('book:toggle-favorite', () => {
      handleToggleFavorite()
    }, 'Book'),
    'Mod+L': defineRouteKey('book:add-to-layer', () => {
      if (layerOverlayVisible) closeLayerOverlay()
      else openLayerOverlay()
    }, 'Book'),
    Escape: defineRouteKey('book:close-overlay', () => {
      if (layerOverlayVisible) closeLayerOverlay()
      else if (quickOpenVisible) closeQuickOpen()
      else if (tocOpen) setTocOpen(false)
    }, 'Book'),
  }), [currentPage, pages.length, goTo, openQuickOpen, handleToggleFavorite, quickOpenVisible, closeQuickOpen, tocOpen, modalOpen, layerOverlayVisible, closeLayerOverlay, openLayerOverlay, handleQuickOpenActivate])

  const prevPage = pages[currentPage - 1]
  const nextPage = pages[currentPage + 1]
  const isFirstSpread = spread <= 0 && currentPage === 0
  const isLastSpread = spread >= totalSpreads - 1 && currentPage === pages.length - 1
  const progressPercent = ((currentPage + 1) / pages.length) * 100

  // ── Chapter position ──
  const currentChapter = page ? chapters[page.chapterIndex] : undefined
  const chapterName = currentChapter?.label ?? ''
  const chapterPageIndex = currentChapter ? currentPage - (pageIndexById.get(currentChapter.pages[0].id) ?? 0) : 0
  const chapterPageCount = currentChapter?.pages.length ?? 1

  // ── FlatLayout data: static baseLayout + overlay visibility flips only ──
  // ② flatlayout-pull-transition-prd.md — widget props는 BookContext pull로 이동
  const layoutData = useMemo(() => {
    let data = baseLayout
    if (tocOpen) data = updateEntityData(data, 'toc-overlay', { visible: true })
    if (quickOpenVisible) data = updateEntityData(data, 'quick-open', { visible: true })
    if (layerOverlayVisible) data = updateEntityData(data, 'layer-overlay', { visible: true })
    return data
  }, [tocOpen, quickOpenVisible, layerOverlayVisible])

  // ── BookContext value (pull 대상) ──
  const openToc = useCallback(() => setTocOpen(true), [])
  const closeToc = useCallback(() => setTocOpen(false), [])

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const bookCtx = useMemo<BookContextValue>(() => ({
    page,
    currentPage,
    totalPages: pages.length,
    linkTransform,
    arrivedFromNext,
    onNextBoundary: handleNextBoundary,
    onPrevBoundary: handlePrevBoundary,
    onSpreadChange: handleSpreadChange,
    chromeVisible,
    currentIsFavorite,
    onToggleFavorite: handleToggleFavorite,
    onOpenToc: openToc,
    onOpenLayerOverlay: openLayerOverlay,
    onOpenQuickOpen: openQuickOpen,
    layerCount: getLayers().length,
    progressPercent,
    chapterName,
    chapterPageIndex,
    chapterPageCount,
    isFirstSpread,
    isLastSpread,
    prevPage,
    nextPage,
    spread,
    totalSpreads,
    tocOpen,
    tocStore,
    onTocActivate: handleTocActivate,
    onTocClose: closeToc,
    quickOpenVisible,
    quickOpenStore,
    quickOpenFilter,
    onQueryChange: setQuickOpenFilter,
    onQuickOpenActivate: handleQuickOpenActivate,
    onQuickOpenClose: closeQuickOpen,
    layerOverlayVisible,
    addToLayerStore: addToLayerStoreData,
    onLayerActivate: handleLayerActivate,
    onLayerClose: closeLayerOverlay,
    layerNameMode,
    layerNameInput,
    onLayerNameChange: setLayerNameInput,
    onLayerNameSubmit: handleLayerNameSubmit,
  }), [page, currentPage, pages.length, linkTransform, arrivedFromNext, handleNextBoundary, handlePrevBoundary, handleSpreadChange, chromeVisible, currentIsFavorite, handleToggleFavorite, openToc, openLayerOverlay, openQuickOpen, layerToggle, progressPercent, isFirstSpread, isLastSpread, prevPage, nextPage, spread, totalSpreads, tocOpen, tocStore, handleTocActivate, closeToc, quickOpenVisible, quickOpenStore, quickOpenFilter, handleQuickOpenActivate, closeQuickOpen, layerOverlayVisible, addToLayerStoreData, handleLayerActivate, closeLayerOverlay, layerNameMode, layerNameInput, handleLayerNameSubmit]) // eslint-disable-line react-hooks/exhaustive-deps

  if (pages.length === 0) {
    return (
      <div className={`${ax({ surface: 'base', text: 'primary', width: 'full', scroll: 'hidden' })} h-full book`}>
        <div className={`${ax({ layout: 'center', gap: 'lg', text: 'muted' })} h-full book-empty`}>
          <BookOpen size={48} className={ax({ opacity: 'dim' })} />
          <span>No content found</span>
        </div>
      </div>
    )
  }

  return (
    <AriaRoute keyMap={keyMap} label="Book">
      {/* ② flatlayout-pull-transition-prd.md — widget은 useBook()으로 pull */}
      <BookProvider value={bookCtx}>
        <div className={`${ax({ surface: 'base', text: 'primary', width: 'full', scroll: 'hidden' })} h-full book`}>
          <div className={`${ax({ placement: 'relative', layout: 'stack', width: 'full', scroll: 'hidden' })} h-full book-page-area`} ref={areaRef}>
            <FlatLayout data={layoutData} registry={bookWidgets} aria-label="Book" />
          </div>
        </div>
      </BookProvider>
    </AriaRoute>
  )
}
