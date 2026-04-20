// deck store → widget이 소비하는 row/NormalizedData 변환.

import type { NormalizedData } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { createStore } from '@os/store/createStore'
import { getSlidesOfDeck, getBlocksOfSlide } from '../../entities/deck/deckSelectors'
import type { BlockData, BlockType } from '../../entities/deck/deckTypes'

export interface SlideRow {
  id: string
  index: number
  titleText?: string
  blockTypes: BlockType[]
  hidden: boolean
}

export function computeSlideRows(
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

export function slidesToNormalizedData(rows: SlideRow[]): NormalizedData {
  const entities: NormalizedData['entities'] = {}
  for (const r of rows) {
    entities[r.id] = { id: r.id, data: { label: r.titleText ?? `Slide ${r.index}` } }
  }
  return createStore({
    entities,
    relationships: { [ROOT_ID]: rows.map(r => r.id) },
  })
}
