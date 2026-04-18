/**
 * PageSlides — LLM-first Slides app root.
 *
 * Two independent engines sit under the provider:
 *   - deckEngine  → deck/slide/block NormalizedData
 *   - chatEngine  → chat NormalizedData (messages + revisions)
 *
 * buildPromptSubmit returns a {userCommand, llmPromise} tuple. userCommand goes
 * to chatEngine; llmPromise resolves with [assistantMessage, revisionCreate] — both
 * chat-side. Deck mutations come later via dispatchRevisionAccept (replays revision
 * ops into deckEngine).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { defineRouteKey } from '@os/primitives/defineRouteKey'
import { RouteModal } from '@os/ui/RouteModal'
import { FlatLayout } from '@os/ui/FlatLayout'
import { definePage } from '@os/layout'
import { useEngine } from '@os/engine/useEngine'
import { history } from '@os/plugins/history'
import { crud } from '@os/plugins/crud'
import { ax } from '@styles/ax'

import {
  createSampleDeck,
  createEmptyChatStore,
} from '../../entities/deck/deckFixtures'
import {
  buildPromptSubmit,
  dispatchRevisionAccept,
  dispatchRevisionReject,
} from '../../entities/deck/deckCommands'
import { deckPlugin } from '../../entities/deck/deckPlugin'
import { getCurrentDeck, getSlidesOfDeck } from '../../entities/deck/deckSelectors'

import { SlidesProvider } from './slidesContext'
import type { SlidesContextValue, SlidesViewMode } from './slidesContext'
import { slidesWidgets } from './slidesWidgets'
import SlidesPresent from './slidesPresent'

// ─────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────

const slidesLayout = definePage({
  entities: {
    root: {
      data: { type: 'split', direction: 'vertical', sizes: [0.06, 'flex'], resizable: false },
      children: ['header', 'body'],
    },
    header: { data: { type: 'widget', widget: 'DeckHeader', surface: 'raised' } },
    body: {
      data: { type: 'split', direction: 'horizontal', sizes: [0.15, 'flex', 0.28] },
      children: ['slidesCol', 'canvas', 'chat'],
    },
    slidesCol: {
      data: { type: 'stack', gap: 'sm' },
      children: ['slideSearch', 'slideFilter', 'slideRail'],
    },
    slideSearch: { data: { type: 'widget', widget: 'SlideSearch' } },
    slideFilter: { data: { type: 'widget', widget: 'SlideFilter' } },
    slideRail:   { data: { type: 'widget', widget: 'SlideRail', surface: 'sunken' } },
    canvas: { data: { type: 'tab' }, children: ['normal', 'outline', 'sorter'] },
    normal:  { data: { type: 'widget', widget: 'SlideCanvas', label: 'Normal' } },
    outline: { data: { type: 'widget', widget: 'OutlineView', label: 'Outline' } },
    sorter:  { data: { type: 'widget', widget: 'SlideSorter', label: 'Sorter' } },
    chat: {
      data: { type: 'stack', gap: 'sm' },
      children: ['chatFeed', 'suggestions', 'composer'],
    },
    chatFeed:    { data: { type: 'widget', widget: 'ChatFeed', surface: 'sunken' } },
    suggestions: { data: { type: 'widget', widget: 'SuggestionChips' } },
    composer:    { data: { type: 'widget', widget: 'PromptComposer' } },
  },
})

// Fixed initial stores — created once at module load.
const INITIAL_DECK = createSampleDeck()
const INITIAL_CHAT = createEmptyChatStore()

export default function PageSlides() {
  const { engine: deckEngine, store: deckStore } = useEngine({
    data: INITIAL_DECK,
    plugins: [history(), crud(), deckPlugin()],
  })
  const { engine: chatEngine, store: chatStore } = useEngine({
    data: INITIAL_CHAT,
    plugins: [history(), crud(), deckPlugin()],
  })

  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [bulkSelection, setBulkSelection] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<SlidesViewMode>('normal')
  const [filterText, setFilterText] = useState('')
  const [hideHidden, setHideHidden] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [commentForBlockId, setCommentForBlockId] = useState<string | null>(null)
  const [presenting, setPresenting] = useState(false)

  // Auto-select first slide once deck has slides.
  useEffect(() => {
    if (selectedSlideId) return
    const deck = getCurrentDeck(deckStore)
    if (!deck) return
    const first = getSlidesOfDeck(deckStore, deck.id)[0]
    if (first) setSelectedSlideId(first)
  }, [deckStore, selectedSlideId])

  const toggleBulk = useCallback((id: string) => {
    setBulkSelection((prev) => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }, [])

  const clearBulk = useCallback(() => setBulkSelection([]), [])

  const submitPrompt = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const { userCommand, llmPromise } = buildPromptSubmit(deckStore, trimmed, {
      selectedSlideId: selectedSlideId ?? undefined,
      selectedBlockId: selectedBlockId ?? undefined,
    })
    // user message + assistant reply + revision all live on the chat engine.
    chatEngine.dispatch(userCommand)
    const commands = await llmPromise
    for (const cmd of commands) chatEngine.dispatch(cmd)
  }, [deckStore, selectedSlideId, selectedBlockId, chatEngine])

  const acceptRevision = useCallback((revisionId: string) => {
    dispatchRevisionAccept(chatEngine, deckEngine, revisionId)
  }, [chatEngine, deckEngine])

  const rejectRevision = useCallback((revisionId: string) => {
    dispatchRevisionReject(chatEngine, revisionId)
  }, [chatEngine])

  const ctx = useMemo<SlidesContextValue>(() => ({
    deckEngine, chatEngine, deckStore, chatStore,
    selectedSlideId, selectedBlockId, bulkSelection,
    viewMode, filterText, hideHidden,
    selectSlide: setSelectedSlideId,
    selectBlock: setSelectedBlockId,
    setViewMode,
    setFilterText,
    setHideHidden,
    toggleBulk,
    clearBulk,
    submitPrompt,
    acceptRevision,
    rejectRevision,
    settingsOpen,
    openSettings: () => setSettingsOpen(true),
    closeSettings: () => setSettingsOpen(false),
    commentForBlockId,
    openComment: setCommentForBlockId,
    closeComment: () => setCommentForBlockId(null),
    presenting,
    enterPresent: () => setPresenting(true),
    exitPresent: () => setPresenting(false),
  }), [
    deckEngine, chatEngine, deckStore, chatStore,
    selectedSlideId, selectedBlockId, bulkSelection,
    viewMode, filterText, hideHidden,
    toggleBulk, clearBulk, submitPrompt, acceptRevision, rejectRevision,
    settingsOpen, commentForBlockId, presenting,
  ])

  const slidesKeyMap = useMemo(() => ({
    'Mod+\\': defineRouteKey('slides:toggle-present', () => setPresenting(p => !p), 'Slides'),
  }), [])

  return (
    <AriaRoute keyMap={slidesKeyMap} label="Slides">
      <SlidesProvider value={ctx}>
        <div className={ax({ layout: 'stack', flex: '1', width: 'full' })}>
          <FlatLayout data={slidesLayout} registry={slidesWidgets} aria-label="Slides Layout" />

          {/* Deck settings overlay — rendered outside FlatLayout to float above */}
          <div className={ax({ placement: 'float-top-center' })}>
            {/* DeckSettings widget is controlled via context; rendering is self-gated */}
          </div>

          <RouteModal active={presenting} label="Presentation">
            <SlidesPresent
              deckStore={deckStore}
              startSlideId={selectedSlideId}
              onExit={() => setPresenting(false)}
            />
          </RouteModal>
        </div>
      </SlidesProvider>
    </AriaRoute>
  )
}
