import { useState, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, List, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Breadcrumb } from '@os/ui/Breadcrumb'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
import { TocNavList } from '@os/ui/TocNavList'
import { SpreadReader } from '@os/ui/SpreadReader'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { defineRouteKey } from '@os/primitives/defineRouteKey'
import { ax } from '@styles/ax'
import { buildBook, buildTocStore, type BookPage, type Chapter } from './bookContent'
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

  // ── TOC store ──
  const tocStore = useMemo(
    () => buildTocStore(chapters, page?.id ?? ''),
    [chapters, page?.id],
  )

  // ── Navigation ──
  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < pages.length) {
      navigate(`/book/${pages[index].id}`, { replace: true })
      setTocOpen(false)
    }
  }, [pages, navigate])

  const handleTocActivate = useCallback((nodeId: string) => {
    const index = pageIndexById.get(nodeId)
    if (index != null) goTo(index)
  }, [pageIndexById, goTo])

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

  // ── Page-level keyMap (ArrowUp/Down for page jumps) ──
  const keyMap = useMemo(() => ({
    ArrowDown: defineRouteKey('book:next-page', () => {
      if (currentPage < pages.length - 1) goTo(currentPage + 1)
    }, 'Book'),
    ArrowUp: defineRouteKey('book:prev-page', () => {
      if (currentPage > 0) goTo(currentPage - 1)
    }, 'Book'),
  }), [currentPage, pages.length, goTo])

  const prevPage = pages[currentPage - 1]
  const nextPage = pages[currentPage + 1]
  const isFirstSpread = spread <= 0 && currentPage === 0
  const isLastSpread = spread >= totalSpreads - 1 && currentPage === pages.length - 1

  if (pages.length === 0) {
    return (
      <div className={`${ax({ surface: 'base', text: 'primary' })} book`}>
        <div className={`${ax({ layout: 'center', gap: 'lg', text: 'muted' })} book-empty`}>
          <BookOpen size={48} className={ax({ opacity: 'dim' })} />
          <span>No content found</span>
        </div>
      </div>
    )
  }

  const progressPercent = ((currentPage + 1) / pages.length) * 100

  return (
    <AriaRoute keyMap={keyMap} label="Book">
      <div className={`${ax({ surface: 'base', text: 'primary' })} book`}>
        {/* ── Page content ── */}
        <div className={`relative book-page-area`} ref={areaRef} onMouseMove={handleAreaMouseMove} onMouseLeave={handleAreaMouseLeave}>
          {/* ── Floating pill — top-left ── */}
          <div className={`book-pill ${ax({ surface: 'overlay', layout: 'bar', gap: 'sm', padding: 'sm', shape: 'pill' })}`} data-visible={chromeVisible}>
            <button
              className={`${ax({ surface: 'ghost', layout: 'center', shape: 'pill', text: 'secondary' })} book-pill-btn`}
              onClick={() => setTocOpen(true)}
              aria-label="Open table of contents"
            >
              <List size={14} />
            </button>
            <span className={ax({ textStyle: 'caption', text: 'muted', clamp: '1' })}>{page?.chapter}</span>
            <span className={ax({ textStyle: 'caption', text: 'secondary', clamp: '1' })}>{page?.title}</span>
          </div>

          {/* ── Page footer — breadcrumb + page number, bottom-center ── */}
          <div className={`${ax({ layout: 'bar', gap: 'sm', textStyle: 'caption', text: 'muted', placement: 'bottom-center' })} book-page-number`}>
            {page && <Breadcrumb path={page.id} root="" />}
            <span>{currentPage + 1}/{pages.length}</span>
          </div>

          {/* ── Progress — bottom edge ── */}
          <div className={`${ax({ placement: 'bottom' })} book-progress-bar`} data-visible={chromeVisible}>
            <div className="book-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <SpreadReader
            resetKey={page?.id}
            initialSpread={arrivedFromNext ? 'last' : 'first'}
            onNextBoundary={handleNextBoundary}
            onPrevBoundary={handlePrevBoundary}
            onSpreadChange={handleSpreadChange}
          >
            {page && <MarkdownViewer content={page.content} />}
          </SpreadReader>

          {/* Spread / page navigation */}
          <nav className={`${ax({ placement: 'bottom' })} book-page-nav`} data-visible={chromeVisible}>
            <div>
              {!isFirstSpread && (
                <button
                  className={ax({ surface: 'overlay', controlSize: 'sm', padding: 'sm', content: 'text', layout: 'bar', gap: 'sm' })}
                  onClick={() => handlePrevBoundary()}
                >
                  <ChevronLeft size={14} />
                  {spread === 0 && prevPage && (
                    <span className={ax({ layout: 'column', gap: 'xs' })}>
                      <span className={ax({ textStyle: 'caption', text: 'muted' })}>Previous</span>
                      <span className={ax({ textStyle: 'caption', text: 'bright' })}>{prevPage.title}</span>
                    </span>
                  )}
                </button>
              )}
            </div>
            <div>
              {!isLastSpread && (
                <button
                  className={ax({ surface: 'overlay', controlSize: 'sm', padding: 'sm', content: 'text', layout: 'bar', gap: 'sm' })}
                  onClick={() => handleNextBoundary()}
                >
                  {spread >= totalSpreads - 1 && nextPage && (
                    <span className={ax({ layout: 'column', gap: 'xs' })}>
                      <span className={ax({ textStyle: 'caption', text: 'muted' })}>Next</span>
                      <span className={ax({ textStyle: 'caption', text: 'bright' })}>{nextPage.title}</span>
                    </span>
                  )}
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </nav>

          {/* ── Overlay TOC ── */}
          <div className={`${ax({ placement: 'center' })} book-toc-overlay`} data-open={tocOpen}>
            <div className="book-toc-panel">
              <div className={ax({ layout: 'spread', padding: 'md', border: 'bottom' })}>
                <span className={ax({ textStyle: 'section', text: 'bright' })}>Contents</span>
                <button
                  className={`${ax({ surface: 'ghost', layout: 'center', shape: 'pill', text: 'secondary' })} book-pill-btn`}
                  onClick={() => setTocOpen(false)}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <div className={ax({ layout: 'scroll', padding: 'sm' })}>
                <TocNavList
                  data={tocStore}
                  onActivate={handleTocActivate}
                  aria-label="Table of contents"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AriaRoute>
  )
}
