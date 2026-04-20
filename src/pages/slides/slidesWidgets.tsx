/**
 * Slides widgets registry.
 *
 * 이동됨:
 *  - slidesTransform.ts — SlideRow / computeSlideRows / slidesToNormalizedData
 *  - slidesDeckWidgets.tsx — DeckHeader, SlideSearch, SlideFilter, SlideCanvas, OutlineView
 *  - slidesChatWidgets.tsx — SuggestionChips, PromptComposer
 *  - slidesOverlayWidgets.tsx — CommentThread
 *
 * 잔류:
 *  - SlideRail — @FIXME(os): renderItem 인라인 + 직접 scroll. SlideThumbItem을
 *    ListBox renderItem 시그니처 (props, node, state)로 래핑하는 items/ 컴포넌트 신설 +
 *    defineLayout slideRail 노드에 scroll 오너십 이관 필요.
 *  - SlideSorter / ChatFeed / DeckSettings — os 위반 해소 완료.
 */
/* eslint-disable react-refresh/only-export-components */
import React, { useMemo, useRef, useCallback } from 'react'
import type { ReactElement } from 'react'
import { ax } from '@styles/ax'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { createStore } from '@os/store/createStore'

import { Button } from '@os/ui/Button'
import { ListBox } from '@os/ui/ListBox'
import { EmptyState } from '@os/ui/EmptyState'
import { StreamFeed } from '@os/ui/StreamFeed'
import { RadioGroup } from '@os/ui/RadioGroup'
import { Select } from '@os/ui/Select'
import { SlideThumbItem, ChatMessageItem, type ChatMessageItemProps } from '@os/ui/items'
import type { NodeState } from '@os/pattern/types'

import { useSlides } from './slidesContext'
import {
  getCurrentDeck,
  getMessages,
  getRevision,
} from '../../entities/deck/deckSelectors'
import { deckCommands } from '../../entities/deck/deckCommands'
import type { BlockData, DeckData } from '../../entities/deck/deckTypes'

import { computeSlideRows, slidesToNormalizedData } from './slidesTransform'
import {
  DeckHeader,
  SlideSearch,
  SlideFilter,
  SlideCanvas,
  OutlineView,
} from './slidesDeckWidgets'
import { SuggestionChips, PromptComposer } from './slidesChatWidgets'
import { CommentThread } from './slidesOverlayWidgets'

// ─────────────────────────────────────────────────────────────
// SlideRail — ListBox of slide thumbnails
// ─────────────────────────────────────────────────────────────

function SlideRail(): ReactElement {
  const {
    deckStore, deckEngine,
    filterText, hideHidden,
    selectedSlideId, selectSlide,
  } = useSlides()

  const deck = getCurrentDeck(deckStore)
  const rows = useMemo(
    () => deck ? computeSlideRows(deckStore, deck.id, filterText, hideHidden) : [],
    [deckStore, deck, filterText, hideHidden],
  )

  const data = useMemo(() => slidesToNormalizedData(rows), [rows])
  const ratio = (deck?.ratio ?? '16:9') as '16:9' | '4:3'

  const renderItem = useCallback(
    (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): ReactElement => {
      const id = item.id as string
      const row = rows.find(r => r.id === id)
      if (!row) return <div {...props} />
      return (
        <SlideThumbItem
          {...props}
          index={row.index}
          slideId={id}
          titleText={row.titleText}
          blockTypes={row.blockTypes}
          ratio={ratio}
          hidden={row.hidden}
          selected={state.focused || state.selected || selectedSlideId === id}
        />
      )
    },
    [rows, ratio, selectedSlideId],
  )

  const addSlide = useCallback(() => {
    if (!deck) return
    deckEngine.dispatch(deckCommands.slideInsert(deck.id))
  }, [deck, deckEngine])

  if (rows.length === 0) {
    return (
      <div className={`${ax({ layout: 'stack', flex: '1' })} ${ax.raw({ gap: 'md' })}`}>
        <EmptyState
          title="No slides"
          description={filterText ? 'No matches for your search.' : 'Add your first slide to begin.'}
          action={!filterText ? { label: 'Add slide', onClick: addSlide } : undefined}
        />
      </div>
    )
  }

  return (
    <div className={`${ax({ layout: 'stack', flex: '1' })} ${ax.raw({ gap: 'xs' })}`}>
      <div className={`${ax({ flex: '1', layout: 'scroll' })}`}>
        <ListBox
          data={data}
          aria-label="Slides"
          renderItem={renderItem}
          onFocusChange={(id) => selectSlide(id)}
          onActivate={(id) => selectSlide(id)}
        />
      </div>
      <div className={`${ax({ flex: 'none', layout: 'bar' })} ${ax.raw({ padding: 'xs' })}`}>
        <Button variant="ghost" onClick={addSlide} aria-label="Add slide">+ Add slide</Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SlideSorter — grid of larger thumbs
// ─────────────────────────────────────────────────────────────

function SlideSorter(): ReactElement {
  const { deckStore, selectSlide, selectedSlideId } = useSlides()
  const deck = getCurrentDeck(deckStore)
  const rows = useMemo(
    () => deck ? computeSlideRows(deckStore, deck.id, '', false) : [],
    [deckStore, deck],
  )
  const ratio = (deck?.ratio ?? '16:9') as '16:9' | '4:3'

  if (rows.length === 0) {
    return <EmptyState title="No slides" description="Add slides to arrange them." />
  }

  return (
    <div
      className={`${ax({ layout: 'grid-3', flex: '1', width: 'full' })} ${ax.raw({ padding: 'lg', gap: 'md' })}`}
      style={{ overflowY: 'auto' } as React.CSSProperties}
    >
      {rows.map((r) => (
        <Button
          key={r.id}
          variant="ghost"
          interactive="item"
          onClick={() => selectSlide(r.id)}
        >
          <SlideThumbItem
            index={r.index}
            slideId={r.id}
            titleText={r.titleText}
            blockTypes={r.blockTypes}
            ratio={ratio}
            hidden={r.hidden}
            selected={r.id === selectedSlideId}
          />
        </Button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ChatFeed — StreamFeed of chat messages with diff revisions inline
// ─────────────────────────────────────────────────────────────

function ChatFeed(): ReactElement {
  const { chatStore, acceptRevision, rejectRevision } = useSlides()
  const messages = useMemo(() => getMessages(chatStore), [chatStore])
  const feedRef = useRef<HTMLDivElement>(null)

  // Pre-shape messages to ChatMessageItemProps — renderItem은 identifier만 받음 (hooks 불가).
  const items = useMemo<ChatMessageItemProps[]>(() => messages.map(msg => {
    if (msg.role === 'user') return { role: 'user', content: msg.content }
    if (msg.role === 'system') return { role: 'system', content: msg.content }
    if (msg.revisionId) {
      const rev = getRevision(chatStore, msg.revisionId)
      if (rev) {
        return {
          role: 'assistant',
          content: msg.content,
          variant: 'diff',
          diff: {
            summary: rev.summary,
            ops: rev.ops.map(o => ({ op: o.op, target: (o.args.slideId as string) ?? (o.args.blockId as string) ?? undefined })),
            status: rev.status,
            onAccept: rev.status === 'pending' ? () => acceptRevision(rev.id) : undefined,
            onReject: rev.status === 'pending' ? () => rejectRevision(rev.id) : undefined,
          },
        }
      }
    }
    return { role: 'assistant', content: msg.content }
  }), [messages, chatStore, acceptRevision, rejectRevision])

  if (items.length === 0) {
    return (
      <div className={`${ax({ layout: 'center', flex: '1' })} ${ax.raw({ padding: 'lg' })}`}>
        <EmptyState
          title="Slides Copilot"
          description="Ask for slides, edits, or tone changes. The LLM replies with a diff you can Accept or Reject."
        />
      </div>
    )
  }

  return (
    <StreamFeed
      items={items}
      feedRef={feedRef}
      renderItem={ChatMessageItem}
    />
  )
}

// ─────────────────────────────────────────────────────────────
// DeckSettings — ratio + theme (overlay content)
// ─────────────────────────────────────────────────────────────

function DeckSettings(): ReactElement | null {
  const { settingsOpen, closeSettings, deckEngine, deckStore } = useSlides()
  const deck = getCurrentDeck(deckStore)

  const ratioData = useMemo<NormalizedData>(() => createStore({
    entities: {
      '16:9': { id: '16:9', data: { label: '16:9 widescreen' } },
      '4:3':  { id: '4:3',  data: { label: '4:3 standard' } },
    },
    relationships: { [ROOT_ID]: ['16:9', '4:3'] },
  }), [])

  const themeData = useMemo<NormalizedData>(() => createStore({
    entities: {
      trigger: { id: 'trigger', data: { label: deck?.themeId ?? 'default' } },
      default:   { id: 'default',   data: { label: 'Default' } },
      minimal:   { id: 'minimal',   data: { label: 'Minimal' } },
      executive: { id: 'executive', data: { label: 'Executive' } },
    },
    relationships: {
      [ROOT_ID]: ['trigger'],
      trigger: ['default', 'minimal', 'executive'],
    },
  }), [deck?.themeId])

  if (!settingsOpen || !deck) return null

  const setRatio = (value: NormalizedData) => {
    const selected = (value.entities['__selection__']?.selectedIds as string[] | undefined)?.[0]
    if (selected === '16:9' || selected === '4:3') {
      deckEngine.dispatch(deckCommands.blockEdit(deck.id, { ratio: selected } as Partial<DeckData> as Partial<BlockData>))
    }
  }

  const setTheme = (id: string) => {
    deckEngine.dispatch(deckCommands.blockEdit(deck.id, { themeId: id } as Partial<DeckData> as Partial<BlockData>))
  }

  return (
    <div className={`${ax({ layout: 'stack' })} ${ax.raw({ shape: 'lg', border: 'subtle', padding: 'xl', gap: 'md' })}`}>
      <div className={ax({ layout: 'bar', width: 'full' })}>
        <span className={`${ax({ flex: '1', textStyle: 'section' })}`}>Deck Settings</span>
        <Button variant="ghost" onClick={closeSettings}>Close</Button>
      </div>

      <div className={`${ax({ layout: 'stack' })} ${ax.raw({ gap: 'sm' })}`}>
        <span className={ax({ textStyle: 'label' })}>Aspect ratio</span>
        <RadioGroup data={ratioData} aria-label="Aspect ratio" onChange={setRatio} />
      </div>

      <div className={`${ax({ layout: 'stack' })} ${ax.raw({ gap: 'sm' })}`}>
        <span className={ax({ textStyle: 'label' })}>Theme</span>
        <Select data={themeData} aria-label="Theme" onActivate={setTheme} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────

export const slidesWidgets = createWidgetRegistry({
  DeckHeader,
  SlideSearch,
  SlideFilter,
  SlideRail,
  SlideCanvas,
  OutlineView,
  SlideSorter,
  ChatFeed,
  SuggestionChips,
  PromptComposer,
  CommentThread,
  DeckSettings,
})
