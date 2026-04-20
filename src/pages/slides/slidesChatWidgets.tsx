// Copilot 채팅 widget — 위반 없는 2개.
// ChatFeed(renderItem 인라인)는 os 위반으로 slidesWidgets.tsx 잔류.
import { useMemo, useCallback } from 'react'
import type { ReactElement } from 'react'
import { ax } from '@styles/ax'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { createStore } from '@os/store/createStore'

import { ButtonToolbar } from '@os/ui/ButtonToolbar'
import { Composer } from '@os/ui/Composer'
import { Badge } from '@os/ui/Badge'

import { useSlides } from './slidesContext'
import { getCurrentDeck, getSlidesOfDeck } from '../../entities/deck/deckSelectors'

export function SuggestionChips(): ReactElement {
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

export function PromptComposer(): ReactElement {
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
