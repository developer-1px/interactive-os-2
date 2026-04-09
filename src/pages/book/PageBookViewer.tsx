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

  // ── Link transform for MarkdownViewer — keep links within /book ──
  const linkTransform = useCallback((href: string) => {
    // Internal .mdx / relative links → SPA navigate to /book/{pageId}
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
    // External links — open in new tab
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
  const addToLayerStore = useMemo(
    () => buildAddToLayerStore(currentPageId),
    [currentPageId, layerToggle], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const openLayerOverlay = useCallback(() => {
    if (!page) return
    setLayerOverlayVisible(true)
  }, [page])

  const closeLayerOverlay = useCallback(() => {
    setLayerOverlayVisible(false)
  }, [])

  const handleLayerActivate = useCallback((nodeId: string) => {
    if (!page) return
    const entity = addToLayerStore.entities[nodeId]
    const data = entity?.data as Record<string, unknown> | undefined
    const action = data?.action as string | undefined

    if (action === 'create') {
      const name = prompt('Layer name:')
      if (name) {
        const layerId = createLayer(name)
        addToLayer(layerId, page.id)
      }
    } else if (action === 'add') {
      const layerId = data?.layerId as string
      addToLayer(layerId, page.id)
    } else if (action === 'remove') {
      const layerId = data?.layerId as string
      removeFromLayer(layerId, page.id)
    }

    setLayerToggle(v => v + 1)
    closeLayerOverlay()
  }, [page, addToLayerStore, closeLayerOverlay])

  // ── Page-level keyMap ──
  // Modal open → suppress page-level navigation keys
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

  const progressPercent = ((currentPage + 1) / pages.length) * 100

  return (
    <AriaRoute keyMap={keyMap} label="Book">
      <div className={`${ax({ surface: 'base', text: 'primary', width: 'full', scroll: 'hidden' })} h-full book`}>
        {/* ── Page content ── */}
        <div className={`${ax({ placement: 'relative', layout: 'column', width: 'full', scroll: 'hidden' })} h-full book-page-area`} ref={areaRef} onMouseMove={handleAreaMouseMove} onMouseLeave={handleAreaMouseLeave}>
          {/* ── Floating pill — top-left ── */}
          <div className={`book-pill ${ax({ surface: 'overlay', layout: 'bar', gap: 'sm', padding: 'sm', shape: 'pill' })}`} data-visible={chromeVisible}>
            <button
              className={`${ax({ surface: 'ghost', layout: 'center', shape: 'pill', text: 'secondary', flex: 'none' })} book-pill-btn`}
              onClick={() => setTocOpen(true)}
              aria-label="Open table of contents"
            >
              <List size={14} />
            </button>
            <span className={ax({ textStyle: 'caption', text: 'muted', clamp: '1' })}>{page?.chapter}</span>
            <span className={ax({ textStyle: 'caption', text: 'secondary', clamp: '1' })}>{page?.title}</span>
            <button
              className={`${ax({ surface: 'ghost', layout: 'center', shape: 'pill', text: currentIsFavorite ? 'bright' : 'muted', flex: 'none' })} book-pill-btn`}
              onClick={handleToggleFavorite}
              aria-label={currentIsFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star size={12} fill={currentIsFavorite ? 'currentColor' : 'none'} />
            </button>
            <button
              className={`${ax({ surface: 'ghost', layout: 'center', shape: 'pill', text: getLayers().length > 0 ? 'bright' : 'muted', flex: 'none' })} book-pill-btn`}
              onClick={openLayerOverlay}
              aria-label="Add to layer"
            >
              <Layers size={12} />
            </button>
            <button
              className={`${ax({ surface: 'ghost', layout: 'center', shape: 'pill', text: 'secondary', flex: 'none' })} book-pill-btn`}
              onClick={openQuickOpen}
              aria-label="Quick open"
            >
              <Search size={12} />
            </button>
          </div>

          {/* ── Page footer — breadcrumb + page number, bottom-center ── */}
          <div className={`${ax({ layout: 'bar', gap: 'sm', textStyle: 'caption', text: 'muted', placement: 'bottom-center' })} book-page-number`}>
            {page && <Breadcrumb path={page.id} root="" />}
            <span>{currentPage + 1}/{pages.length}</span>
          </div>

          {/* ── Progress — bottom edge ── */}
          <div className={`${ax({ placement: 'bottom' })} book-progress-bar`} data-visible={chromeVisible}>
            <div className="book-progress-fill" style={{ '--progress': `${progressPercent}%` } as React.CSSProperties} />
          </div>
          <SpreadReader
            resetKey={page?.id}
            initialSpread={arrivedFromNext ? 'last' : 'first'}
            onNextBoundary={handleNextBoundary}
            onPrevBoundary={handlePrevBoundary}
            onSpreadChange={handleSpreadChange}
          >
            {page && <MarkdownViewer content={page.content} linkTransform={linkTransform} />}
          </SpreadReader>

          {/* Spread / page navigation */}
          <nav className={`${ax({ placement: 'bottom', layout: 'spread' })} book-page-nav`} data-visible={chromeVisible}>
            <div>
              {!isFirstSpread && (
                <button
                  className={ax({ surface: 'overlay', padding: 'sm', content: 'text', layout: 'bar', gap: 'sm', shape: 'md', textStyle: 'caption' })}
                  onClick={() => handlePrevBoundary()}
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
                  className={ax({ surface: 'overlay', padding: 'sm', content: 'text', layout: 'bar', gap: 'sm', shape: 'md', textStyle: 'caption' })}
                  onClick={() => handleNextBoundary()}
                >
                  {spread >= totalSpreads - 1 && nextPage && (
                    <span className={ax({ text: 'muted' })}>Next <span className={ax({ text: 'bright' })}>{nextPage.title}</span></span>
                  )}
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </nav>

          {/* ── Overlay TOC ── */}
          <div className={`${ax({ placement: 'center', layout: 'center' })} book-toc-overlay`} data-open={tocOpen}>
            <div className={`${ax({ scroll: 'hidden', layout: 'column' })} book-toc-panel`}>
              <div className={ax({ layout: 'spread', padding: 'md', border: 'bottom' })}>
                <span className={ax({ textStyle: 'section', text: 'bright' })}>Contents</span>
                <button
                  className={`${ax({ surface: 'ghost', layout: 'center', shape: 'pill', text: 'secondary', flex: 'none' })} book-pill-btn`}
                  onClick={() => setTocOpen(false)}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <ScrollArea className={ax({ padding: 'sm' })}>
                <TocNavList
                  data={tocStore}
                  onActivate={handleTocActivate}
                  aria-label="Table of contents"
                />
              </ScrollArea>
            </div>
          </div>

          {/* ── Quick Open overlay ── */}
          <div
            className={`${ax({ placement: 'center' })} book-quick-open-overlay`}
            data-open={quickOpenVisible}
            onClick={(e) => { if (e.target === e.currentTarget) closeQuickOpen() }}
          >
            {quickOpenVisible && (
              <QuickOpen
                data={quickOpenStore}
                query={quickOpenFilter}
                onQueryChange={setQuickOpenFilter}
                onActivate={handleQuickOpenActivate}
                onClose={closeQuickOpen}
                placeholder="Search pages..."
                aria-label="Quick open"
                dialog={false}
              />
            )}
          </div>

          {/* ── Layer overlay ── */}
          <div
            className={`${ax({ placement: 'center' })} book-quick-open-overlay`}
            data-open={layerOverlayVisible}
            onClick={(e) => { if (e.target === e.currentTarget) closeLayerOverlay() }}
          >
            <div className={`${ax({ surface: 'overlay', shape: 'xl', width: 'lg' })} book-quick-open-panel`}>
              <div className={ax({ layout: 'spread', padding: 'md', border: 'bottom' })}>
                <span className={ax({ textStyle: 'section', text: 'bright' })}>Add to Layer</span>
                <span className={ax({ textStyle: 'caption', text: 'muted' })}>Cmd+L</span>
              </div>
              <ScrollArea className={ax({ padding: 'sm' })}>
                <NavList
                  data={addToLayerStore}
                  onActivate={handleLayerActivate}
                  aria-label="Add to layer"
                />
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </AriaRoute>
  )
}
