// ② flatlayout-pull-transition-prd.md
import { createDomainContext } from '@os/layout'
import type { NormalizedData } from '@os/store/types'
import type { BookPage } from './bookContent'

export interface BookLinkTransformResult {
  href: string
  onClick?: (e: React.MouseEvent) => void
}

export interface BookContextValue {
  // ── Common ──
  page: BookPage | undefined
  currentPage: number
  totalPages: number
  linkTransform: (href: string) => BookLinkTransformResult

  // ── Reader ──
  arrivedFromNext: boolean
  onNextBoundary: () => void
  onPrevBoundary: () => void
  onSpreadChange: (s: number, total: number) => void

  // ── Pill ──
  chromeVisible: boolean
  currentIsFavorite: boolean
  onToggleFavorite: () => void
  onOpenToc: () => void
  onOpenLayerOverlay: () => void
  onOpenQuickOpen: () => void
  layerCount: number

  // ── Progress ──
  progressPercent: number
  chapterName: string
  chapterPageIndex: number
  chapterPageCount: number

  // ── Prev / Next buttons ──
  isFirstSpread: boolean
  isLastSpread: boolean
  prevPage: BookPage | undefined
  nextPage: BookPage | undefined
  spread: number
  totalSpreads: number

  // ── 3-pane: Chapter / Page list ──
  chapterStore: NormalizedData
  chapterPageStore: NormalizedData
  currentChapterLabel: string
  onChapterActivate: (nodeId: string) => void
  onPageListActivate: (nodeId: string) => void

  // ── TOC overlay ──
  tocOpen: boolean
  tocStore: NormalizedData
  onTocActivate: (nodeId: string) => void
  onTocClose: () => void

  // ── Quick Open ──
  quickOpenVisible: boolean
  quickOpenStore: NormalizedData
  quickOpenFilter: string
  onQueryChange: (q: string) => void
  onQuickOpenActivate: (nodeId: string) => void
  onQuickOpenClose: () => void

  // ── Slide mode ──
  slideMode: boolean
  slides: string[]
  currentSlide: number
  totalSlides: number
  onSlideNext: () => void
  onSlidePrev: () => void
  onSlideGoTo: (index: number) => void
  onToggleSlideMode: () => void

  // ── Layer overlay ──
  layerOverlayVisible: boolean
  addToLayerStore: NormalizedData
  onLayerActivate: (nodeId: string) => void
  onLayerClose: () => void
  layerNameMode: boolean
  layerNameInput: string
  onLayerNameChange: (v: string) => void
  onLayerNameSubmit: () => void
}

export const [BookProvider, useBook] = createDomainContext<BookContextValue>('Book')
