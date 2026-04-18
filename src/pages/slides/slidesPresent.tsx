/**
 * Present mode — full-screen single-slide viewer.
 * Left/Right (and Space/Shift+Space) steps through slides. Escape exits.
 * Minimal MVP: fills the RouteModal with stacked block renderers.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactElement, CSSProperties } from 'react'
import { ax } from '@styles/ax'
import type { NormalizedData } from '@os/store/types'
import { Button } from '@os/ui/Button'

import {
  getCurrentDeck,
  getSlidesOfDeck,
  getBlocksOfSlide,
} from '../../entities/deck/deckSelectors'
import type { BlockData } from '../../entities/deck/deckTypes'
import { renderBlock } from '../../entities/block/ui/blockRegistry'

interface SlidesPresentProps {
  deckStore: NormalizedData
  startSlideId: string | null
  onExit: () => void
}

export default function SlidesPresent({ deckStore, startSlideId, onExit }: SlidesPresentProps): ReactElement {
  const deck = getCurrentDeck(deckStore)
  const slideIds = useMemo(
    () => deck ? getSlidesOfDeck(deckStore, deck.id).filter((sid) => {
      const d = deckStore.entities[sid]?.data as { hidden?: boolean } | undefined
      return !d?.hidden
    }) : [],
    [deckStore, deck],
  )

  const startIdx = Math.max(0, startSlideId ? slideIds.indexOf(startSlideId) : 0)
  const [idx, setIdx] = useState(startIdx)

  const next = useCallback(() => setIdx((i) => Math.min(slideIds.length - 1, i + 1)), [slideIds.length])
  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onExit() }
      else if (e.key === 'ArrowRight' || (e.key === ' ' && !e.shiftKey)) { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft' || (e.key === ' ' && e.shiftKey)) { e.preventDefault(); prev() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, onExit])

  if (slideIds.length === 0) {
    return (
      <div className={ax({ layout: 'center', width: 'full' })} style={{ height: '100vh' } as CSSProperties}>
        <span className={ax({ textStyle: 'section' })}>No slides to present.</span>
        <Button variant="ghost" onClick={onExit}>Exit</Button>
      </div>
    )
  }

  const currentSlideId = slideIds[idx]
  const blockIds = currentSlideId ? getBlocksOfSlide(deckStore, currentSlideId) : []

  return (
    <div
      className={ax({ layout: 'stack', width: 'full' })}
      style={{ height: '100vh' } as CSSProperties}
    >
      <div
        className={`${ax({ layout: 'stack', flex: '1', width: 'full' })} ${ax.raw({ padding: 'xl', gap: 'lg' })}`}
        style={{ aspectRatio: '16 / 9' } as CSSProperties}
      >
        {blockIds.map((bid) => {
          const data = deckStore.entities[bid]?.data as BlockData | undefined
          if (!data) return null
          return (
            <div key={bid} className={ax({ width: 'full' })}>
              {renderBlock(data)}
            </div>
          )
        })}
      </div>

      <div className={`${ax({ layout: 'bar', width: 'full' })} ${ax.raw({ padding: 'md', gap: 'md' })}`}>
        <Button variant="ghost" onClick={prev} aria-label="Previous slide">←</Button>
        <span className={`${ax({ flex: '1', textStyle: 'caption' })}`}>
          {idx + 1} / {slideIds.length}
        </span>
        <Button variant="ghost" onClick={next} aria-label="Next slide">→</Button>
        <Button variant="accent" onClick={onExit}>Exit (Esc)</Button>
      </div>
    </div>
  )
}
