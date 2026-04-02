import { useState, useCallback, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import { BookOpen, List, ChevronLeft, ChevronRight, X, Columns2, Layers } from 'lucide-react'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
import { NavList } from '@os/ui/NavList'
import { Aria } from '@os/primitives/aria'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import { FOCUS_ID } from '@os/axis/navigate'
import { SELECTION_ID } from '@os/axis/select'
import type { NormalizedData } from '@os/store/types'
import type { NodeState, PatternContext } from '@os/pattern/types'
import type { Command } from '@os/engine/types'
import styles from './PageBookViewer.module.css'

// ── Content loading ──

interface MetaEntry {
  label: string
  description?: string
  order: string[]
}

const metaModules = import.meta.glob<{ default: string }>('/contents/**/_meta.yaml', {
  query: '?raw',
  eager: true,
})

const mdModules = import.meta.glob<{ default: string }>('/contents/**/*.md', {
  query: '?raw',
  eager: true,
})

const docModules = import.meta.glob<{ default: string }>('/docs/**/*.md', {
  query: '?raw',
  eager: true,
})

function parseMeta(raw: string): MetaEntry {
  const lines = raw.split('\n')
  let label = ''
  let description = ''
  const order: string[] = []
  let inOrder = false

  for (const line of lines) {
    if (line.startsWith('label:')) {
      label = line.slice(6).trim()
    } else if (line.startsWith('description:')) {
      description = line.slice(12).trim()
    } else if (line.match(/^order:\s*$/)) {
      inOrder = true
    } else if (line.match(/^order:\s*\[/)) {
      const items = line.slice(line.indexOf('[') + 1, line.lastIndexOf(']'))
      order.push(...items.split(',').map(s => s.trim()).filter(Boolean))
    } else if (inOrder) {
      const m = line.match(/^\s+-\s+(.+)/)
      if (m) order.push(m[1].trim())
      else if (!line.match(/^\s*$/) && !line.startsWith('#')) inOrder = false
    }
  }

  return { label, description, order }
}

// ── Book structure ──

interface BookPage {
  id: string
  title: string
  chapter: string
  chapterIndex: number
  pageIndex: number
  content: string
  depth: number
}

interface Chapter {
  id: string
  label: string
  pages: BookPage[]
}

function buildBook(): { chapters: Chapter[]; pages: BookPage[] } {
  const rootMeta = metaModules['/contents/_meta.yaml']
  if (!rootMeta) return { chapters: [], pages: [] }

  const rootOrder = parseMeta(rootMeta.default).order
  const chapters: Chapter[] = []
  const allPages: BookPage[] = []

  for (const section of rootOrder) {
    const introPath = `/contents/${section}.md`
    const introMod = mdModules[introPath]
    const metaPath = `/contents/${section}/_meta.yaml`
    const metaMod = metaModules[metaPath]

    const chapterIndex = chapters.length
    const chapterLabel = metaMod
      ? parseMeta(metaMod.default).label
      : section.charAt(0).toUpperCase() + section.slice(1)

    const chapterPages: BookPage[] = []

    if (introMod) {
      chapterPages.push({
        id: `${section}`,
        title: chapterLabel,
        chapter: chapterLabel,
        chapterIndex,
        pageIndex: allPages.length + chapterPages.length,
        content: introMod.default,
        depth: 0,
      })
    }

    if (metaMod) {
      const meta = parseMeta(metaMod.default)
      for (const sub of meta.order) {
        const mdPath = `/contents/${section}/${sub}.md`
        const md = mdModules[mdPath]
        if (md) {
          chapterPages.push({
            id: `${section}/${sub}`,
            title: sub,
            chapter: chapterLabel,
            chapterIndex,
            pageIndex: allPages.length + chapterPages.length,
            content: md.default,
            depth: 1,
          })
        }
      }
    }

    if (chapterPages.length > 0) {
      chapters.push({ id: section, label: chapterLabel, pages: chapterPages })
      allPages.push(...chapterPages)
    }
  }

  // ── docs/ chapters (no _meta.yaml — directory-based) ──
  const DOCS_ORDER = ['0-inbox', '1-projects', '2-areas', '3-resources', '4-archive', '5-backlogs']
  const DOCS_LABELS: Record<string, string> = {
    '0-inbox': 'Inbox',
    '1-projects': 'Projects',
    '2-areas': 'Areas',
    '3-resources': 'Resources',
    '4-archive': 'Archive',
    '5-backlogs': 'Backlogs',
  }

  // Collect root-level docs
  const rootDocs: string[] = []
  for (const path of Object.keys(docModules).sort()) {
    const rel = path.replace('/docs/', '')
    if (!rel.includes('/')) rootDocs.push(path)
  }
  if (rootDocs.length > 0) {
    const chapterIndex = chapters.length
    const chapterPages: BookPage[] = []
    for (const fullPath of rootDocs) {
      const filename = fullPath.replace('/docs/', '').replace('.md', '')
      chapterPages.push({
        id: `docs/${filename}`,
        title: filename,
        chapter: 'Docs',
        chapterIndex,
        pageIndex: allPages.length + chapterPages.length,
        content: docModules[fullPath].default,
        depth: 0,
      })
    }
    chapters.push({ id: 'docs', label: 'Docs', pages: chapterPages })
    allPages.push(...chapterPages)
  }

  // Collect docs subdirectories
  for (const dir of DOCS_ORDER) {
    const prefix = `/docs/${dir}/`
    const files = Object.keys(docModules)
      .filter(p => p.startsWith(prefix))
      .sort()
    if (files.length === 0) continue

    const chapterIndex = chapters.length
    const chapterLabel = DOCS_LABELS[dir] ?? dir
    const chapterPages: BookPage[] = []

    for (const fullPath of files) {
      const rel = fullPath.slice(prefix.length).replace('.md', '')
      const title = rel.split('/').pop() ?? rel
      chapterPages.push({
        id: `docs/${dir}/${rel}`,
        title,
        chapter: chapterLabel,
        chapterIndex,
        pageIndex: allPages.length + chapterPages.length,
        content: docModules[fullPath].default,
        depth: rel.includes('/') ? 1 : 0,
      })
    }

    chapters.push({ id: `docs/${dir}`, label: chapterLabel, pages: chapterPages })
    allPages.push(...chapterPages)
  }

  return { chapters, pages: allPages }
}

// ── TOC store builder ──

function buildTocStore(chapters: Chapter[], currentPageId: string): NormalizedData {
  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  for (const chapter of chapters) {
    const groupId = `group:${chapter.id}`
    entities[groupId] = { id: groupId, data: { label: chapter.label, type: 'group' } }
    relationships[ROOT_ID].push(groupId)

    const childIds: string[] = []
    for (const page of chapter.pages) {
      entities[page.id] = {
        id: page.id,
        data: { label: page.title, pageIndex: page.pageIndex, depth: page.depth },
      }
      childIds.push(page.id)
    }
    relationships[groupId] = childIds
  }

  entities[FOCUS_ID] = { id: FOCUS_ID, focusedId: currentPageId } as never
  entities[SELECTION_ID] = { id: SELECTION_ID, selectedIds: [currentPageId] } as never

  return createStore({ entities, relationships })
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
      className={`${styles.tocItem}${depth > 0 ? ` ${styles.tocItemChild}` : ''}`}
      aria-current={state.selected ? 'page' : undefined}
    >
      <span className={styles.tocItemNumber}>{(data.pageIndex as number) + 1}</span>
      {label}
    </div>
  )
}

// ── Mode type ──

type ViewMode = 'kindle' | 'apple'

// ── Main component ──

export default function PageBookViewer() {
  const { chapters, pages } = useMemo(() => buildBook(), [])
  const [currentPage, setCurrentPage] = useState(0)
  const [spread, setSpread] = useState(0)
  const [totalSpreads, setTotalSpreads] = useState(1)
  const [mode, setMode] = useState<ViewMode>('kindle')
  const [tocOpen, setTocOpen] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  const page = pages[currentPage]

  // ── Page index lookup ──
  const pageIndexById = useMemo(() => {
    const map = new Map<string, number>()
    for (let i = 0; i < pages.length; i++) map.set(pages[i].id, i)
    return map
  }, [pages])

  // ── TOC store ──
  const tocStore = useMemo(
    () => buildTocStore(chapters, page?.id ?? ''),
    [chapters, page?.id],
  )

  // ── Spread measurement (Readium technique: overflow auto → measure → hidden) ──
  const spreadWidthRef = useRef(0)
  useLayoutEffect(() => {
    const el = pageRef.current
    if (!el) return
    // Temporarily allow scroll to measure true column extent
    el.style.overflowX = 'auto'
    const viewportWidth = el.clientWidth
    const fullWidth = el.scrollWidth
    el.style.overflowX = ''
    spreadWidthRef.current = viewportWidth
    const spreads = Math.max(1, Math.ceil(fullWidth / viewportWidth))
    setTotalSpreads(spreads)
    setSpread(0)
    el.scrollLeft = 0
  }, [currentPage])

  // ── Navigation ──
  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < pages.length) {
      setCurrentPage(index)
      setTocOpen(false)
    }
  }, [pages.length])

  const handleTocActivate = useCallback((nodeId: string) => {
    const index = pageIndexById.get(nodeId)
    if (index != null) goTo(index)
  }, [pageIndexById, goTo])

  const goSpread = useCallback((dir: 1 | -1) => {
    const next = spread + dir
    if (next < 0) {
      // Go to previous page, last spread
      if (currentPage > 0) {
        setCurrentPage(currentPage - 1)
        // totalSpreads will be recalculated, set spread to -1 as sentinel
        setSpread(-1)
      }
    } else if (next >= totalSpreads) {
      // Go to next page
      if (currentPage < pages.length - 1) goTo(currentPage + 1)
    } else {
      setSpread(next)
    }
  }, [spread, totalSpreads, currentPage, pages.length, goTo])

  // ── Spread KeyMap (os-based) ──
  const goSpreadRef = useRef(goSpread)
  useEffect(() => { goSpreadRef.current = goSpread })

  const spreadKeyMap = useMemo<Record<string, (ctx: PatternContext) => Command | void>>(() => ({
    ArrowRight: () => {
      goSpreadRef.current(1)
      return { type: 'core:activate', payload: { nodeId: 'spread' } }
    },
    ArrowLeft: () => {
      goSpreadRef.current(-1)
      return { type: 'core:activate', payload: { nodeId: 'spread' } }
    },
  }), [])

  const spreadStore = useMemo(() => createStore({
    entities: { spread: { id: 'spread', data: {} } },
    relationships: { [ROOT_ID]: ['spread'] },
  }), [])

  // When arriving from next page (spread = -1 sentinel), jump to last spread
  useLayoutEffect(() => {
    if (spread === -1) {
      const el = pageRef.current
      if (!el) return
      el.style.overflowX = 'auto'
      const spreads = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth))
      el.style.overflowX = ''
      setTotalSpreads(spreads)
      setSpread(spreads - 1)
    }
  }, [spread])

  // ── Spread scroll (scrollLeft instead of translateX) ──
  useLayoutEffect(() => {
    const el = pageRef.current
    if (!el || spread < 0) return
    el.scrollLeft = spread * spreadWidthRef.current
  }, [spread])

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
    <div className={styles.book}>
      {/* ── Header ── */}
      <header className={styles.header}>
        {mode === 'kindle' ? (
          <button
            className={styles.headerBtn}
            onClick={() => setMode('apple')}
            aria-label="Switch to overlay TOC"
          >
            <Layers size={16} />
          </button>
        ) : (
          <button
            className={styles.headerBtn}
            onClick={() => setTocOpen(!tocOpen)}
            aria-label={tocOpen ? 'Close TOC' : 'Open TOC'}
          >
            <List size={16} />
          </button>
        )}
        <span className={styles.headerTitle}>{page?.chapter}</span>
        <span className={styles.headerChapter}>{page?.title}</span>

        <div className={styles.modeSwitcher}>
          <button
            className={styles.modeBtn}
            aria-pressed={mode === 'kindle'}
            aria-label="Sidebar TOC"
            onClick={() => { setMode('kindle'); setTocOpen(false) }}
          >
            <Columns2 size={14} />
          </button>
          <button
            className={styles.modeBtn}
            aria-pressed={mode === 'apple'}
            aria-label="Overlay TOC"
            onClick={() => setMode('apple')}
          >
            <Layers size={14} />
          </button>
        </div>

        <span className={styles.pageCounter}>
          {currentPage + 1} / {pages.length}
          {totalSpreads > 1 && ` · ${spread + 1}/${totalSpreads}`}
        </span>
      </header>

      {/* ── Progress ── */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>
        {/* Kindle sidebar TOC */}
        {mode === 'kindle' && (
          <div className={styles.tocSidebar}>
            <NavList
              data={tocStore}
              onActivate={handleTocActivate}
              renderItem={renderTocItem}
              aria-label="Table of contents"
            />
          </div>
        )}

        {/* Page content */}
        <div className={styles.pageArea}>
          {/* Aria keyMap for ← → spread navigation */}
          <Aria
            data={spreadStore}
            plugins={[]}
            keyMap={spreadKeyMap}
            aria-label="Page spreads"
            autoFocus={false}
          >
          <div className={styles.pageViewport} ref={viewportRef} tabIndex={0}>
            <div
              className={styles.page}
              key={page?.id}
              ref={pageRef}
            >
              {page && <MarkdownViewer content={page.content} />}
            </div>
          </div>

          {/* Spread / page navigation */}
          <nav className={styles.pageNav}>
            <button
              className={styles.pageNavBtn}
              disabled={isFirstSpread}
              onClick={() => goSpread(-1)}
            >
              <ChevronLeft size={16} />
              {spread === 0 && prevPage && (
                <span className={styles.pageNavLabel}>
                  <span className={styles.pageNavDirection}>Previous</span>
                  <span className={styles.pageNavTitle}>{prevPage.title}</span>
                </span>
              )}
            </button>
            <button
              className={styles.pageNavBtn}
              disabled={isLastSpread}
              onClick={() => goSpread(1)}
            >
              {spread >= totalSpreads - 1 && nextPage && (
                <span className={styles.pageNavLabel}>
                  <span className={styles.pageNavDirection}>Next</span>
                  <span className={styles.pageNavTitle}>{nextPage.title}</span>
                </span>
              )}
              <ChevronRight size={16} />
            </button>
          </nav>
          </Aria>
        </div>

        {/* Apple overlay TOC */}
        {mode === 'apple' && (
          <div className={styles.tocOverlay} data-open={tocOpen}>
            <div className={styles.tocOverlayPanel}>
              <div className={styles.tocOverlayHeader}>
                <span className={styles.tocOverlayTitle}>Contents</span>
                <button
                  className={styles.headerBtn}
                  onClick={() => setTocOpen(false)}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <div className={styles.tocOverlayBody}>
                <NavList
                  data={tocStore}
                  onActivate={handleTocActivate}
                  renderItem={renderTocItem}
                  aria-label="Table of contents"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
