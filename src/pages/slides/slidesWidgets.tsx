/**
 * Slides widgets — all FlatLayout widgets for the Slides app.
 *
 * Each widget pulls shared state from `useSlides()` (and occasionally
 * `useFlatLayout()`). None of the widgets touch engine/store directly —
 * mutations flow through context-provided actions.
 */
import { useMemo, useRef, useCallback } from 'react'
import type { ReactElement, CSSProperties } from 'react'
import { ax } from '@styles/ax'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { createStore } from '@os/store/createStore'

import { Button } from '@os/ui/Button'
import { TextInput } from '@os/ui/TextInput'
import { Breadcrumb } from '@os/ui/Breadcrumb'
import { MenuButton } from '@os/ui/MenuButton'
import { ButtonToggle } from '@os/ui/ButtonToggle'
import { ButtonToolbar } from '@os/ui/ButtonToolbar'
import { ListBox } from '@os/ui/ListBox'
import { EmptyState } from '@os/ui/EmptyState'
import { StreamFeed } from '@os/ui/StreamFeed'
import { Composer } from '@os/ui/Composer'
import { RadioGroup } from '@os/ui/RadioGroup'
import { Select } from '@os/ui/Select'
import { DisclosureGroup } from '@os/ui/DisclosureGroup'
import { Badge } from '@os/ui/Badge'
import { SlideThumbItem, ChatMessageItem } from '@os/ui/items'
import type { NodeState } from '@os/pattern/types'

import { useSlides } from './slidesContext'
import {
  getCurrentDeck,
  getSlidesOfDeck,
  getBlocksOfSlide,
  getMessages,
  getRevision,
} from '../../entities/deck/deckSelectors'
import { deckCommands } from '../../entities/deck/deckCommands'
import type { BlockData, BlockType, DeckData } from '../../entities/deck/deckTypes'
import { renderBlock } from '../../entities/block/ui/blockRegistry'

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

interface SlideRow {
  id: string
  index: number
  titleText?: string
  blockTypes: BlockType[]
  hidden: boolean
}

function computeSlideRows(
  deckStore: NormalizedData,
  deckId: string,
  filterText: string,
  hideHidden: boolean,
): SlideRow[] {
  const allIds = getSlidesOfDeck(deckStore, deckId)
  const q = filterText.trim().toLowerCase()
  const rows: SlideRow[] = []

  allIds.forEach((slideId, i) => {
    const slideData = deckStore.entities[slideId]?.data as { hidden?: boolean } | undefined
    const hidden = slideData?.hidden ?? false
    if (hideHidden && hidden) return

    const blockIds = getBlocksOfSlide(deckStore, slideId)
    const blockTypes: BlockType[] = []
    let titleText: string | undefined

    for (const bid of blockIds) {
      const bd = deckStore.entities[bid]?.data as BlockData | undefined
      if (!bd) continue
      blockTypes.push(bd.type)
      if (bd.type === 'title' && titleText === undefined) titleText = bd.text
    }

    if (q) {
      const hay = `${titleText ?? ''} ${blockTypes.join(' ')}`.toLowerCase()
      if (!hay.includes(q)) return
    }

    rows.push({ id: slideId, index: i + 1, titleText, blockTypes, hidden })
  })

  return rows
}

function slidesToNormalizedData(rows: SlideRow[]): NormalizedData {
  const entities: NormalizedData['entities'] = {}
  for (const r of rows) {
    entities[r.id] = { id: r.id, data: { label: r.titleText ?? `Slide ${r.index}` } }
  }
  return createStore({
    entities,
    relationships: { [ROOT_ID]: rows.map(r => r.id) },
  })
}

// ─────────────────────────────────────────────────────────────
// DeckHeader — breadcrumb, title, actions
// ─────────────────────────────────────────────────────────────

function DeckHeader(): ReactElement {
  const { deckEngine, deckStore, enterPresent, openSettings } = useSlides()
  const deck = getCurrentDeck(deckStore)

  const onTitleChange = useCallback((value: string) => {
    if (!deck) return
    deckEngine.dispatch(deckCommands.blockEdit(deck.id, { title: value } as Partial<DeckData> as Partial<BlockData>))
  }, [deck, deckEngine])

  const menuData = useMemo<NormalizedData>(() => createStore({
    entities: {
      trigger: { id: 'trigger', data: { label: 'More' } },
      settings: { id: 'settings', data: { label: 'Settings' } },
      export:   { id: 'export',   data: { label: 'Export (soon)' } },
      duplicate:{ id: 'duplicate',data: { label: 'Duplicate (soon)' } },
    },
    relationships: {
      [ROOT_ID]: ['trigger'],
      trigger: ['settings', 'export', 'duplicate'],
    },
  }), [])

  const handleMenuActivate = useCallback((id: string) => {
    if (id === 'settings') openSettings()
  }, [openSettings])

  return (
    <div className={`${ax({ layout: 'bar', width: 'full' })} ${ax.raw({ padding: 'sm', gap: 'md' })}`}>
      <div className={ax({ layout: 'bar', flex: '1' })}>
        <Breadcrumb root="" path={`Slides / ${deck?.title ?? 'Untitled'}`} />
      </div>
      <div className={`${ax({ layout: 'bar', flex: 'none' })} ${ax.raw({ gap: 'sm' })}`}>
        <TextInput
          aria-label="Deck title"
          defaultValue={deck?.title ?? ''}
          onBlur={(e) => onTitleChange(e.currentTarget.value)}
        />
        <Button variant="accent" onClick={enterPresent}>Present</Button>
        <Button variant="ghost" onClick={() => { /* share: no-op MVP */ }}>Share</Button>
        <MenuButton data={menuData} aria-label="Deck menu" onActivate={handleMenuActivate} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SlideSearch — plain input wired to filterText
// ─────────────────────────────────────────────────────────────

function SlideSearch(): ReactElement {
  const { filterText, setFilterText } = useSlides()
  return (
    <div className={`${ax({ layout: 'bar', width: 'full' })} ${ax.raw({ padding: 'xs' })}`}>
      <TextInput
        aria-label="Search slides"
        placeholder="Search slides..."
        value={filterText}
        onChange={(e) => setFilterText(e.currentTarget.value)}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SlideFilter — hideHidden toggle
// ─────────────────────────────────────────────────────────────

function SlideFilter(): ReactElement {
  const { hideHidden, setHideHidden } = useSlides()

  const data = useMemo<NormalizedData>(() => createStore({
    entities: {
      hide: { id: 'hide', data: { label: 'Hide hidden' } },
    },
    relationships: { [ROOT_ID]: ['hide'] },
    // Initialize checked state via meta entity
  }), [])

  return (
    <div className={`${ax({ layout: 'bar', width: 'full' })} ${ax.raw({ padding: 'xs' })}`}>
      <ButtonToggle
        data={data}
        aria-label="Slide filters"
        onChange={(next) => {
          const checked = (next.entities['__checked__']?.checkedIds as string[] | undefined) ?? []
          setHideHidden(checked.includes('hide'))
        }}
      />
      <span className={`${ax({ flex: '1', textStyle: 'caption' })} ${ax.raw({ padding: 'xs' })}`}>
        {hideHidden ? 'hidden off' : 'all slides'}
      </span>
    </div>
  )
}

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
// SlideCanvas — Normal view (stacked blocks of current slide)
// ─────────────────────────────────────────────────────────────

function SlideCanvas(): ReactElement {
  const { deckEngine, deckStore, selectedSlideId } = useSlides()

  if (!selectedSlideId) {
    return (
      <div className={ax({ layout: 'center', flex: '1', width: 'full' })}>
        <EmptyState
          title="Nothing selected"
          description="Pick a slide from the left, or ask the copilot on the right to start."
        />
      </div>
    )
  }

  const blockIds = getBlocksOfSlide(deckStore, selectedSlideId)

  if (blockIds.length === 0) {
    return (
      <div className={ax({ layout: 'center', flex: '1', width: 'full' })}>
        <EmptyState
          title="Empty slide"
          description="Add a block to begin."
          action={{
            label: '+ Add title',
            onClick: () => deckEngine.dispatch(deckCommands.blockInsert(selectedSlideId, 'title')),
          }}
        />
      </div>
    )
  }

  // scroll 오너는 defineLayout 노드 `normal` (scroll:'y'). widget은 overflow에 관여 X.
  return (
    <div
      className={`${ax({ layout: 'stack', flex: '1', width: 'full' })} ${ax.raw({ padding: 'xl', gap: 'lg' })}`}
      style={{ aspectRatio: '16 / 9' } as CSSProperties}
    >
      {blockIds.map((bid) => {
        const data = deckStore.entities[bid]?.data as BlockData | undefined
        if (!data) return null
        return (
          <div key={bid} data-block-id={bid} className={ax({ width: 'full' })}>
            {renderBlock(data, {
              editable: true,
              onEdit: (patch) => deckEngine.dispatch(deckCommands.blockEdit(bid, patch)),
            })}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// OutlineView — DisclosureGroup of slides + their title/bullets
// ─────────────────────────────────────────────────────────────

function OutlineView(): ReactElement {
  const { deckStore } = useSlides()
  const deck = getCurrentDeck(deckStore)
  const slideIds = deck ? getSlidesOfDeck(deckStore, deck.id) : []

  const data = useMemo<NormalizedData>(() => {
    const entities: NormalizedData['entities'] = {}
    const rels: NormalizedData['relationships'] = { [ROOT_ID]: slideIds }
    slideIds.forEach((sid, i) => {
      const slideChildren = getBlocksOfSlide(deckStore, sid)
      const titleBlockId = slideChildren.find((bid) => {
        const d = deckStore.entities[bid]?.data as BlockData | undefined
        return d?.type === 'title'
      })
      const titleText = titleBlockId
        ? (deckStore.entities[titleBlockId]?.data as { text?: string } | undefined)?.text
        : undefined

      entities[sid] = { id: sid, data: { label: titleText ?? `Slide ${i + 1}` } }
      const childNodeIds: string[] = []
      for (const bid of slideChildren) {
        const bd = deckStore.entities[bid]?.data as BlockData | undefined
        if (!bd) continue
        const rowId = `outline-${bid}`
        let label: string
        if (bd.type === 'title') label = bd.text
        else if (bd.type === 'bullets') label = bd.items.join(' • ')
        else if (bd.type === 'quote') label = bd.text
        else if (bd.type === 'stat') label = `${bd.value} — ${bd.label}`
        else label = bd.type
        entities[rowId] = { id: rowId, data: { label } }
        childNodeIds.push(rowId)
      }
      rels[sid] = childNodeIds
    })
    return createStore({ entities, relationships: rels })
  }, [deckStore, slideIds])

  if (slideIds.length === 0) {
    return <EmptyState title="No slides" description="Add slides to see an outline." />
  }

  // scroll 오너는 defineLayout 노드 `outline` (scroll:'y'). widget은 overflow에 관여 X.
  return (
    <div className={`${ax({ layout: 'stack', flex: '1' })} ${ax.raw({ padding: 'lg' })}`}>
      <DisclosureGroup data={data} aria-label="Outline" />
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
      style={{ overflowY: 'auto' } as CSSProperties}
    >
      {rows.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => selectSlide(r.id)}
          className={ax({ surface: 'ghost', role: 'control', interactive: 'item' })}
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
        </button>
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

  if (messages.length === 0) {
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
      items={messages}
      feedRef={feedRef}
      renderItem={(msg) => {
        if (msg.role === 'user') {
          return <ChatMessageItem role="user" content={msg.content} />
        }
        if (msg.role === 'system') {
          return <ChatMessageItem role="system" content={msg.content} />
        }
        // assistant
        if (msg.revisionId) {
          const rev = getRevision(chatStore, msg.revisionId)
          if (rev) {
            return (
              <ChatMessageItem
                role="assistant"
                content={msg.content}
                variant="diff"
                diff={{
                  summary: rev.summary,
                  ops: rev.ops.map(o => ({ op: o.op, target: (o.args.slideId as string) ?? (o.args.blockId as string) ?? undefined })),
                  status: rev.status,
                  onAccept: rev.status === 'pending' ? () => acceptRevision(rev.id) : undefined,
                  onReject: rev.status === 'pending' ? () => rejectRevision(rev.id) : undefined,
                }}
              />
            )
          }
        }
        return <ChatMessageItem role="assistant" content={msg.content} />
      }}
    />
  )
}

// ─────────────────────────────────────────────────────────────
// SuggestionChips — context-aware prompt starters
// ─────────────────────────────────────────────────────────────

function SuggestionChips(): ReactElement {
  const { deckStore, selectedSlideId, selectedBlockId, submitPrompt } = useSlides()
  const deck = getCurrentDeck(deckStore)
  const slideCount = deck ? getSlidesOfDeck(deckStore, deck.id).length : 0

  const chips = useMemo<string[]>(() => {
    if (selectedBlockId) return ['Rewrite this block', 'Change tone', 'Make it shorter']
    if (selectedSlideId) return ['Make it more concise', 'Shift to business tone', 'Add a chart']
    if (slideCount === 0) return ['Draft a marketing funnel deck', '5-slide company intro', 'Insights dashboard']
    return ['Add a conclusion slide', 'Improve the intro', 'Suggest a chart']
  }, [selectedBlockId, selectedSlideId, slideCount])

  const data = useMemo<NormalizedData>(() => {
    const entities: NormalizedData['entities'] = {}
    const ids: string[] = []
    chips.forEach((chip, i) => {
      const id = `chip-${i}`
      entities[id] = { id, data: { label: chip } }
      ids.push(id)
    })
    return createStore({ entities, relationships: { [ROOT_ID]: ids } })
  }, [chips])

  const onActivate = useCallback((id: string) => {
    const idx = Number(id.replace('chip-', ''))
    const text = chips[idx]
    if (text) void submitPrompt(text)
  }, [chips, submitPrompt])

  return (
    <div className={`${ax({ layout: 'bar', width: 'full', flex: 'none' })} ${ax.raw({ padding: 'xs', gap: 'xs' })}`}>
      <ButtonToolbar data={data} aria-label="Prompt suggestions" onActivate={onActivate} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PromptComposer — text field + submit
// ─────────────────────────────────────────────────────────────

function PromptComposer(): ReactElement {
  const { submitPrompt } = useSlides()

  return (
    <div className={`${ax({ layout: 'stack', width: 'full', flex: 'none' })} ${ax.raw({ padding: 'sm', gap: 'xs' })}`}>
      <Composer
        placeholder="Ask the copilot…"
        onSubmit={(text) => void submitPrompt(text)}
      />
      <div className={ax({ layout: 'bar', width: 'full' })}>
        <span className={`${ax({ flex: '1', textStyle: 'caption' })}`}>Enter to send · Shift+Enter for newline</span>
        <Badge tone="neutral">mock-llm</Badge>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CommentThread — stub thread panel for a block's comments
// ─────────────────────────────────────────────────────────────

function CommentThread(): ReactElement | null {
  const { commentForBlockId, closeComment } = useSlides()
  if (!commentForBlockId) return null

  return (
    <div className={`${ax({ layout: 'stack' })} ${ax.raw({ shape: 'md', border: 'subtle', padding: 'md', gap: 'sm' })}`}>
      <div className={ax({ layout: 'bar', width: 'full' })}>
        <span className={ax({ flex: '1', textStyle: 'label' })}>Comments on {commentForBlockId}</span>
        <Button variant="ghost" onClick={closeComment} aria-label="Close">×</Button>
      </div>
      <div className={`${ax({ textStyle: 'caption' })}`}>
        No comments yet. (MVP stub — wiring lives in B-stage schema.)
      </div>
    </div>
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
    <div className={`${ax({ placement: 'center', layout: 'stack' })} ${ax.raw({ shape: 'lg', border: 'subtle', padding: 'xl', gap: 'md' })}`}>
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
