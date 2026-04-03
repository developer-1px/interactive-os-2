import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, List, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
import { NavList } from '@os/ui/NavList'
import { SpreadReader } from '@os/ui/SpreadReader'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { ax } from '@styles/ax'
import type { NodeState } from '@os/pattern/types'
import { buildBook, buildTocStore, type BookPage, type Chapter } from './bookContent'
import styles from './PageBookViewer.module.css'

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

// ── TOC item renderer ──

const renderTocItem = (
  props: React.HTMLAttributes<HTMLElement>,
  item: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const data = item.data as Record<string, unknown>
  const label = data.label as string
  const depth = data.depth as number
  return (
    <div
      {...props}
      className={ax({ layout: 'bar', gap: 'sm', padding: 'sm', textStyle: 'caption', text: state.selected ? 'bright' : 'muted' })}
      data-indent={depth > 0 ? '' : undefined}
      aria-current={state.selected ? 'page' : undefined}
    >
      <span className={ax({ textStyle: 'caption', text: 'muted' })}>{(data.pageIndex as number) + 1}</span>
      {label}
    </div>
  )
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
  useEffect(() => {
    const area = areaRef.current
    if (!area) return
    const EDGE = 80
    const HIDE_DELAY = 2500

    const show = () => {
      clearTimeout(hideTimer.current)
      setChromeVisible(true)
      hideTimer.current = setTimeout(() => setChromeVisible(false), HIDE_DELAY)
    }

    const handleMove = (e: MouseEvent) => {
      const rect = area.getBoundingClientRect()
      const nearEdge =
        e.clientY - rect.top < EDGE ||
        rect.bottom - e.clientY < EDGE ||
        e.clientX - rect.left < EDGE ||
        rect.right - e.clientX < EDGE
      if (nearEdge) show()
    }

    const handleLeave = () => {
      clearTimeout(hideTimer.current)
      setChromeVisible(false)
    }

    area.addEventListener('mousemove', handleMove)
    area.addEventListener('mouseleave', handleLeave)
    return () => {
      clearTimeout(hideTimer.current)
      area.removeEventListener('mousemove', handleMove)
      area.removeEventListener('mouseleave', handleLeave)
    }
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
    ArrowDown: () => {
      if (currentPage < pages.length - 1) goTo(currentPage + 1)
      return { type: 'book:next-page', payload: { page: currentPage + 1 } } as const
    },
    ArrowUp: () => {
      if (currentPage > 0) goTo(currentPage - 1)
      return { type: 'book:prev-page', payload: { page: currentPage - 1 } } as const
    },
  }), [currentPage, pages.length, goTo])

  const prevPage = pages[currentPage - 1]
  const nextPage = pages[currentPage + 1]
  const isFirstSpread = spread <= 0 && currentPage === 0
  const isLastSpread = spread >= totalSpreads - 1 && currentPage === pages.length - 1

  if (pages.length === 0) {
    return (
      <div className={styles.book}>
        <div className={styles.empty}>
          <BookOpen size={48} className={styles.emptyIcon} />
          <span>No content found</span>
        </div>
      </div>
    )
  }

  const progressPercent = ((currentPage + 1) / pages.length) * 100

  return (
    <AriaRoute keyMap={keyMap}>
      <div className={styles.book}>
        {/* ── Page content ── */}
        <div className={styles.pageArea} ref={areaRef}>
          {/* ── Floating pill — top-left ── */}
          <div className={`${styles.pill} ${ax({ surface: 'overlay', layout: 'bar', gap: 'sm', padding: 'sm', shape: 'pill' })}`} data-visible={chromeVisible}>
            <button
              className={styles.pillBtn}
              onClick={() => setTocOpen(true)}
              aria-label="Open table of contents"
            >
              <List size={14} />
            </button>
            <span className={ax({ textStyle: 'caption', text: 'muted', clamp: '1' })}>{page?.chapter}</span>
            <span className={ax({ textStyle: 'caption', text: 'secondary', clamp: '1' })}>{page?.title}</span>
          </div>

          {/* ── Page number — always visible, bottom-center ── */}
          <div className={styles.pageNumber}>
            <span className={ax({ textStyle: 'caption', text: 'muted' })}>
              {currentPage + 1}/{pages.length}
              {totalSpreads > 1 && ` · ${spread + 1}/${totalSpreads}`}
            </span>
          </div>

          {/* ── Progress — bottom edge ── */}
          <div className={styles.progressBar} data-visible={chromeVisible}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
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
          <nav className={styles.pageNav} data-visible={chromeVisible}>
            <div>
              {!isFirstSpread && (
                <button
                  className={ax({ surface: 'overlay', controlSize: 'sm', layout: 'bar', gap: 'sm' })}
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
                  className={ax({ surface: 'overlay', controlSize: 'sm', layout: 'bar', gap: 'sm' })}
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
          <div className={styles.tocOverlay} data-open={tocOpen}>
            <div className={styles.tocOverlayPanel}>
              <div className={`${ax({ layout: 'spread', padding: 'md' })} ${styles.tocOverlayHeader}`}>
                <span className={ax({ textStyle: 'section', text: 'bright' })}>Contents</span>
                <button
                  className={styles.pillBtn}
                  onClick={() => setTocOpen(false)}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <div className={ax({ layout: 'scroll', padding: 'sm' })}>
                <NavList
                  data={tocStore}
                  onActivate={handleTocActivate}
                  renderItem={renderTocItem}
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
