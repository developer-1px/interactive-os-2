/**
 * Slides domain context — shared state bridge between the page root and widgets.
 *
 * Two engines sit behind the scenes:
 *   - deckEngine  → deck/slide/block tree
 *   - chatEngine  → chat store (messages + revisions)
 *
 * Selection / viewMode / filter / overlay flags live in React state and are
 * exposed here for widget pull (per FlatLayout convention).
 */
import { createDomainContext } from '@os/layout'
import type { CommandEngine } from '@os/engine/createCommandEngine'
import type { NormalizedData } from '@os/store/types'

export type SlidesViewMode = 'normal' | 'outline' | 'sorter'

export interface SlidesContextValue {
  // Engines & stores
  deckEngine: CommandEngine
  chatEngine: CommandEngine
  deckStore: NormalizedData
  chatStore: NormalizedData

  // Selection / view state
  selectedSlideId: string | null
  selectedBlockId: string | null
  bulkSelection: string[]
  viewMode: SlidesViewMode
  filterText: string
  hideHidden: boolean

  // Setters
  selectSlide: (id: string | null) => void
  selectBlock: (id: string | null) => void
  setViewMode: (v: SlidesViewMode) => void
  setFilterText: (v: string) => void
  setHideHidden: (v: boolean) => void
  toggleBulk: (id: string) => void
  clearBulk: () => void

  // Domain actions
  submitPrompt: (text: string) => Promise<void>
  acceptRevision: (revisionId: string) => void
  rejectRevision: (revisionId: string) => void

  // Modal / overlay triggers
  settingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
  commentForBlockId: string | null
  openComment: (blockId: string) => void
  closeComment: () => void

  // Present mode
  presenting: boolean
  enterPresent: () => void
  exitPresent: () => void
}

export const [SlidesProvider, useSlides] = createDomainContext<SlidesContextValue>('Slides')
