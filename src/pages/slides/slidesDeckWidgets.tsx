// Deck·Slide 편집 widget — 위반 없는 5개 (Header, Search, Filter, Canvas, Outline).
// SlideRail, SlideSorter는 os 위반으로 slidesWidgets.tsx 잔류.
import { useMemo, useCallback } from 'react'
import type { ReactElement, CSSProperties } from 'react'
import { ax } from '@styles/ax'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { createStore } from '@os/store/createStore'

import { Button } from '@os/ui/Button'
import { TextInput } from '@os/ui/TextInput'
import { Breadcrumb } from '@os/ui/Breadcrumb'
import { MenuButton } from '@os/ui/MenuButton'
import { ButtonToggle } from '@os/ui/ButtonToggle'
import { EmptyState } from '@os/ui/EmptyState'
import { DisclosureGroup } from '@os/ui/DisclosureGroup'

import { useSlides } from './slidesContext'
import {
  getCurrentDeck,
  getSlidesOfDeck,
  getBlocksOfSlide,
} from '../../entities/deck/deckSelectors'
import { deckCommands } from '../../entities/deck/deckCommands'
import type { BlockData, DeckData } from '../../entities/deck/deckTypes'
import { renderBlock } from '../../entities/block/ui/blockRegistry'

export function DeckHeader(): ReactElement {
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

export function SlideSearch(): ReactElement {
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

export function SlideFilter(): ReactElement {
  const { hideHidden, setHideHidden } = useSlides()

  const data = useMemo<NormalizedData>(() => createStore({
    entities: {
      hide: { id: 'hide', data: { label: 'Hide hidden' } },
    },
    relationships: { [ROOT_ID]: ['hide'] },
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

export function SlideCanvas(): ReactElement {
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

export function OutlineView(): ReactElement {
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

  return (
    <div className={`${ax({ layout: 'stack', flex: '1' })} ${ax.raw({ padding: 'lg' })}`}>
      <DisclosureGroup data={data} aria-label="Outline" />
    </div>
  )
}
