// Overlay widget — CommentThread만. DeckSettings는 placement 위반으로 slidesWidgets.tsx 잔류.
import type { ReactElement } from 'react'
import { ax } from '@styles/ax'

import { Button } from '@os/ui/Button'

import { useSlides } from './slidesContext'

export function CommentThread(): ReactElement | null {
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
