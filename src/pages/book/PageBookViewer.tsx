// @useState-hatch
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, List, ChevronLeft, ChevronRight, X, Star, Search, Layers } from 'lucide-react'
import { Breadcrumb } from '@os/ui/Breadcrumb'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
import { TocNavList } from '@os/ui/TocNavList'
import { SpreadReader } from '@os/ui/SpreadReader'
import { QuickOpen } from '@os/ui/QuickOpen'
import { NavList } from '@os/ui/NavList'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { defineRouteKey } from '@os/primitives/defineRouteKey'
import { ax } from '@styles/ax'
import { ScrollArea } from '@os/ui/ScrollArea'
import { TextInput } from '@os/ui/TextInput'
import { FlatLayout } from '@os/ui/FlatLayout'
import { definePage, createWidgetRegistry } from '@os/layout'
import { updateEntityData } from '@os/store/createStore'
import { buildBook, buildTocStore, type BookPage, type Chapter } from './bookContent'
import {
  addRecent,
  toggleFavorite,
  isFavorite,
  buildQuickOpenStore,
  buildAddToLayerStore,
  addToLayer,
  removeFromLayer,
  createLayer,
  getLayers,
} from './bookNavStore'
import './PageBookViewer.css'

// ── Preload: cache book data so first render is instant ──

let _cache: { chapters: Chapter[]; pages: BookPage[] } | null = null

function getBook() {
  if (!_cache) _cache = buildBook()
  return _cache
}

/** Call from router loader or on link hover to warm up */
export function loader() {
  return getBook()
}

// ── Widgets ──

function BookReader(props: Record<string, unknown>) {
  const page = props.page as BookPage | undefined
  const linkTransform = props.linkTransform as ((href: string) => { href: string; onClick?: (e: React.MouseEvent) => void })
  const arrivedFromNext = props.arrivedFromNext as boolean
  const onNextBoundary = props.onNextBoundary as () => void
  const onPrevBoundary = props.onPrevBoundary as () => void
  const onSpreadChange = props.onSpreadChange as (s: number, total: number) => void

  return (
    <SpreadReader
      resetKey={page?.id}
      initialSpread={arrivedFromNext ? 'last' : 'first'}
      onNextBoundary={onNextBoundary}
      onPrevBoundary={onPrevBoundary}
      onSpreadChange={onSpreadChange}
    >
      {page && <MarkdownViewer content={page.content} linkTransform={linkTransform} />}
    </SpreadReader>
  )
}

function BookPill(props: Record<string, unknown>) {
  const page = props.page as BookPage | undefined
  const chromeVisible = props.chromeVisible as boolean
  const currentIsFavorite = props.currentIsFavorite as boolean
  const onToggleFavorite = props.onToggleFavorite as () => void
  const onOpenToc = props.onOpenToc as () => void
  const onOpenLayerOverlay = props.onOpenLayerOverlay as () => void
  const onOpenQuickOpen = props.onOpenQuickOpen as () => void
  const layerCount = props.layerCount as number

  return (
    <div className={`book-pill ${ax({ surface: 'overlay', width: 'fit', layout: 'bar', gap: 'sm', padding: 'sm', shape: 'pill' })}`} data-visible={chromeVisible}>
      <button
        className={`${ax({ surface: 'ghost', layout: 'center', shape: 'pill', text: 'secondary', flex: 'none' })} book-pill-btn`}
        onClick={onOpenToc}
        aria-label="Open table of contents"
      >
        <List size={14} />
      </button>
      <span className={ax({ textStyle: 'caption', text: 'muted', clamp: '1' })}>{page?.chapter}</span>
      <span className={ax({ textStyle: 'caption', text: 'secondary', clamp: '1' })}>{page?.title}</span>
      <button
        className={`${ax({ surface: 'ghost', layout: 'center', shape: 'pill', text: currentIsFavorite ? 'bright' : 'muted', flex: 'none' })} book-pill-btn`}
        onClick={onToggleFavorite}
        aria-label={currentIsFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star size={12} fill={currentIsFavorite ? 'currentColor' : 'none'} />
      </button>
      <button
        className={`${ax({ surface: 'ghost', layout: 'center', shape: 'pill', text: layerCount > 0 ? 'bright' : 'muted', flex: 'none' })} book-pill-btn`}
        onClick={onOpenLayerOverlay}
        aria-label="Add to layer"
      >
        <Layers size={12} />
      </button>
      <button
        className={`${ax({ surface: 'ghost', layout: 'center', shape: 'pill', text: 'secondary', flex: 'none' })} book-pill-btn`}
        onClick={onOpenQuickOpen}
        aria-label="Quick open"
      >
        <Search size={12} />
      </button>
    </div>
  )
}

function BookNav(props: Record<string, unknown>) {
  const chromeVisible = props.chromeVisible as boolean
  const isFirstSpread = props.isFirstSpread as boolean
  const isLastSpread = props.isLastSpread as boolean
  const prevPage = props.prevPage as BookPage | undefined
  const nextPage = props.nextPage as BookPage | undefined
  const spread = props.spread as number
  const totalSpreads = props.totalSpreads as number
  const onPrevBoundary = props.onPrevBoundary as () => void
  const onNextBoundary = props.onNextBoundary as () => void

  return (
    <nav className={`${ax({ placement: 'bottom', layout: 'spread' })} book-page-nav`} data-visible={chromeVisible}>
      <div>
        {!isFirstSpread && (
          <button
            className={ax({ surface: 'overlay', width: 'fit', padding: 'sm', content: 'text', layout: 'bar', gap: 'sm', shape: 'md', textStyle: 'caption' })}
            onClick={onPrevBoundary}
          >
            <ChevronLeft size={14} />
            {spread === 0 && prevPage && (
              <span className={ax({ text: 'muted' })}>Previous <span className={ax({ text: 'bright' })}>{prevPage.title}</span></span>
            )}
          </button>
        )}
      </div>
      <div>
        {!isLastSpread && (
          <button
            className={ax({ surface: 'overlay', width: 'fit', padding: 'sm', content: 'text', layout: 'bar', gap: 'sm', shape: 'md', textStyle: 'caption' })}
            onClick={onNextBoundary}
          >
            {spread >= totalSpreads - 1 && nextPage && (
              <span className={ax({ text: 'muted' })}>Next <span className={ax({ text: 'bright' })}>{nextPage.title}</span></span>
            )}
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </nav>
  )
}

function BookFooter(props: Record<string, unknown>) {
  const page = props.page as BookPage | undefined
  const currentPage = props.currentPage as number
  const totalPages = props.totalPages as number

  return (
    <div className={`${ax({ layout: 'bar', gap: 'sm', textStyle: 'caption', text: 'muted', placement: 'bottom-center' })} book-page-number`}>
      {page && <Breadcrumb path={page.id} root="" />}
      <span>{currentPage + 1}/{totalPages}</span>
    </div>
  )
}

function BookProgress(props: Record<string, unknown>) {
  const chromeVisible = props.chromeVisible as boolean
  const progressPercent = props.progressPercent as number

  return (
    <div className={`${ax({ placement: 'bottom' })} book-progress-bar`} data-visible={chromeVisible}>
      <div className="book-progress-fill" style={{ '--progress': `${progressPercent}%` } as React.CSSProperties} />
    </div>
  )
}

function BookTocOverlay(props: Record<string, unknown>) {
  const tocOpen = props.tocOpen as boolean
  const tocStore = props.tocStore as import('@os/store/types').NormalizedData
  const onActivate = props.onActivate as (nodeId: string) => void
  const onClose = props.onClose as () => void

  return (
    <div className={`${ax({ placement: 'center', layout: 'center' })} book-toc-overlay`} data-open={tocOpen}>
      <div className={`${ax({ scroll: 'hidden', layout: 'column' })} book-toc-panel`}>
        <div className={ax({ layout: 'spread', padding: 'md', border: 'bottom' })}>
          <span className={ax({ textStyle: 'section', text: 'bright' })}>Contents</span>
          <button
            className={`${ax({ surface: 'ghost', layout: 'center', shape: 'pill', text: 'secondary', flex: 'none' })} book-pill-btn`}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <ScrollArea className={ax({ padding: 'sm' })}>
          <TocNavList
            data={tocStore}
            onActivate={onActivate}
            aria-label="Table of contents"
          />
        </ScrollArea>
      </div>
    </div>
  )
}

function BookQuickOpen(props: Record<string, unknown>) {
  const quickOpenVisible = props.quickOpenVisible as boolean
  const quickOpenStore = props.quickOpenStore as import('@os/store/types').NormalizedData
  const quickOpenFilter = props.quickOpenFilter as string
  const onQueryChange = props.onQueryChange as (q: string) => void
  const onActivate = props.onActivate as (nodeId: string) => void
  const onClose = props.onClose as () => void

  return (
    <div
      className={`${ax({ placement: 'center' })} book-quick-open-overlay`}
      data-open={quickOpenVisible}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {quickOpenVisible && (
        <QuickOpen
          data={quickOpenStore}
          query={quickOpenFilter}
          onQueryChange={onQueryChange}
          onActivate={onActivate}
          onClose={onClose}
          placeholder="Search pages..."
          aria-label="Quick open"
          dialog={false}
        />
      )}
    </div>
  )
}

function BookLayerOverlay(props: Record<string, unknown>) {
  const layerOverlayVisible = props.layerOverlayVisible as boolean
  const addToLayerStore = props.addToLayerStore as import('@os/store/types').NormalizedData
  const onActivate = props.onActivate as (nodeId: string) => void
  const onClose = props.onClose as () => void
  const layerNameMode = props.layerNameMode as boolean
  const layerNameInput = props.layerNameInput as string
  const onLayerNameChange = props.onLayerNameChange as (v: string) => void
  const onLayerNameSubmit = props.onLayerNameSubmit as () => void

  return (
    <div
      className={`${ax({ placement: 'center' })} book-quick-open-overlay`}
      data-open={layerOverlayVisible}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`${ax({ surface: 'overlay', width: 'lg', shape: 'xl' })} book-quick-open-panel`}>
        <div className={ax({ layout: 'spread', padding: 'md', border: 'bottom' })}>
          <span className={ax({ textStyle: 'section', text: 'bright' })}>Add to Layer</span>
          <span className={ax({ textStyle: 'caption', text: 'muted' })}>Cmd+L</span>
        </div>
        {layerNameMode ? (
          <form className={ax({ padding: 'md' })} onSubmit={(e) => { e.preventDefault(); onLayerNameSubmit() }}>
            <TextInput
              value={layerNameInput}
              onChange={(e) => onLayerNameChange(e.target.value)}
              placeholder="Layer name..."
              autoFocus
            />
          </form>
        ) : (
          <ScrollArea className={ax({ padding: 'sm' })}>
            <NavList
              data={addToLayerStore}
              onActivate={onActivate}
              aria-label="Add to layer"
            />
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

// ── Widget registry ──

const bookWidgets = createWidgetRegistry({
  BookReader,
  BookPill,
  BookNav,
  BookFooter,
  BookProgress,
  BookTocOverlay,
  BookQuickOpen,
  BookLayerOverlay,
})

// ── Base layout definition ──

const baseLayout = definePage({
  entities: {
    root:             { data: { type: 'stack' as const, gap: 'md' as const }, children: ['reader', 'pill', 'footer', 'progress', 'nav'] },
    reader:           { data: { type: 'widget' as const, widget: 'BookReader' } },
    pill:             { data: { type: 'widget' as const, widget: 'BookPill' } },
    footer:           { data: { type: 'widget' as const, widget: 'BookFooter' } },
    progress:         { data: { type: 'widget' as const, widget: 'BookProgress' } },
    nav:              { data: { type: 'widget' as const, widget: 'BookNav' } },
    'toc-overlay':    { data: { type: 'overlay' as const, overlayType: 'modal' as const, visible: false }, children: ['toc-content'] },
    'toc-content':    { data: { type: 'widget' as const, widget: 'BookTocOverlay' } },
    'quick-open':     { data: { type: 'overlay' as const, overlayType: 'popup' as const, visible: false }, children: ['qo-content'] },
    'qo-content':     { data: { type: 'widget' as const, widget: 'BookQuickOpen' } },
    'layer-overlay':  { data: { type: 'overlay' as const, overlayType: 'popup' as const, visible: false }, children: ['layer-content'] },
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
  const [chromeVisible, setChromeVisible] = useState(false)
  const [arrivedFromNext, setArrivedFromNext] = useState(false)
  const [quickOpenVisible, setQuickOpenVisible] = useState(false)
  const [quickOpenFilter, setQuickOpenFilter] = useState('')
  const [favToggle, setFavToggle] = useState(0) // @useState-hatch
  const [layerOverlayVisible, setLayerOverlayVisible] = useState(false) // @useState-hatch
  const [layerToggle, setLayerToggle] = useState(0) // @useState-hatch
  const [layerNameInput, setLayerNameInput] = useState('') // @useState-hatch — inline layer naming
  const [layerNameMode, setLayerNameMode] = useState(false) // @useState-hatch
  const areaRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // ── Chrome: show on mouse near edges, hide after idle ──
  const EDGE = 80
  const HIDE_DELAY = 2500

  const handleAreaMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const nearEdge =
      e.clientY - rect.top < EDGE ||
      rect.bottom - e.clientY < EDGE ||
      e.clientX - rect.left < EDGE ||
      rect.right - e.clientX < EDGE
    if (nearEdge) {
      clearTimeout(hideTimer.current)
      setChromeVisible(true)
      hideTimer.current = setTimeout(() => setChromeVisible(false), HIDE_DELAY)
    }
  }, [])

  const handleAreaMouseLeave = useCallback(() => {
    clearTimeout(hideTimer.current)
    setChromeVisible(false)
  }, [])

  // ── Page index lookup ──
  const pageIndexById = useMemo(() => {
    const map = new Map<string, number>()
    for (let i = 0; i < pages.length; i++) map.set(pages[i].id, i)
    return map
  }, [pages])

  // ── URL → page index ──
  const slug = location.pathname.replace('/book', '').replace(/^\//, '')
  const currentPage = slug ? (pageIndexById.get(slug) ?? 0) : 0
  const page = pages[currentPage]

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
    () => pages.map(p => ({ id: p.id, title: p.title, chapter: p.chapter })),
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

  // ── FlatLayout data with dynamic widget props + overlay visibility ──
  const layoutData = useMemo(() => {
    let data = baseLayout
    // Widget props
    data = updateEntityData(data, 'reader', { props: { page, linkTransform, arrivedFromNext, onNextBoundary: handleNextBoundary, onPrevBoundary: handlePrevBoundary, onSpreadChange: handleSpreadChange } })
    data = updateEntityData(data, 'pill', { props: { page, chromeVisible, currentIsFavorite, onToggleFavorite: handleToggleFavorite, onOpenToc: () => setTocOpen(true), onOpenLayerOverlay: openLayerOverlay, onOpenQuickOpen: openQuickOpen, layerCount: getLayers().length } })
    data = updateEntityData(data, 'footer', { props: { page, currentPage, totalPages: pages.length } })
    data = updateEntityData(data, 'progress', { props: { chromeVisible, progressPercent } })
    data = updateEntityData(data, 'nav', { props: { chromeVisible, isFirstSpread, isLastSpread, prevPage, nextPage, spread, totalSpreads, onPrevBoundary: handlePrevBoundary, onNextBoundary: handleNextBoundary } })
    data = updateEntityData(data, 'toc-content', { props: { tocOpen, tocStore, onActivate: handleTocActivate, onClose: () => setTocOpen(false) } })
    data = updateEntityData(data, 'qo-content', { props: { quickOpenVisible, quickOpenStore, quickOpenFilter, onQueryChange: setQuickOpenFilter, onActivate: handleQuickOpenActivate, onClose: closeQuickOpen } })
    data = updateEntityData(data, 'layer-content', { props: { layerOverlayVisible, addToLayerStore: addToLayerStoreData, onActivate: handleLayerActivate, onClose: closeLayerOverlay, layerNameMode, layerNameInput, onLayerNameChange: setLayerNameInput, onLayerNameSubmit: handleLayerNameSubmit } })
    // Overlay visibility
    if (tocOpen) data = updateEntityData(data, 'toc-overlay', { visible: true })
    if (quickOpenVisible) data = updateEntityData(data, 'quick-open', { visible: true })
    if (layerOverlayVisible) data = updateEntityData(data, 'layer-overlay', { visible: true })
    return data
  }, [page, linkTransform, arrivedFromNext, handleNextBoundary, handlePrevBoundary, handleSpreadChange, chromeVisible, currentIsFavorite, handleToggleFavorite, openLayerOverlay, openQuickOpen, currentPage, pages.length, progressPercent, isFirstSpread, isLastSpread, prevPage, nextPage, spread, totalSpreads, tocOpen, tocStore, handleTocActivate, quickOpenVisible, quickOpenStore, quickOpenFilter, handleQuickOpenActivate, closeQuickOpen, layerOverlayVisible, addToLayerStoreData, handleLayerActivate, closeLayerOverlay, layerNameMode, layerNameInput, handleLayerNameSubmit])

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
      <div className={`${ax({ surface: 'base', text: 'primary', width: 'full', scroll: 'hidden' })} h-full book`}>
        <div className={`${ax({ placement: 'relative', layout: 'column', width: 'full', scroll: 'hidden' })} h-full book-page-area`} ref={areaRef} onMouseMove={handleAreaMouseMove} onMouseLeave={handleAreaMouseLeave}>
          <FlatLayout data={layoutData} registry={bookWidgets} aria-label="Book" />
        </div>
      </div>
    </AriaRoute>
  )
}
