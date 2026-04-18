// Quote block renderer — blockquote + attribution.
import type React from 'react'
import type { BlockData } from '../../deck/deckTypes'
import { ax } from '@styles/ax'

type QuoteData = Extract<BlockData, { type: 'quote' }>

export interface QuoteBlockProps {
  data: QuoteData
  editable?: boolean
  onEdit?: (patch: Partial<QuoteData>) => void
}

export function QuoteBlock({ data, editable, onEdit }: QuoteBlockProps): React.ReactElement {
  return (
    <blockquote
      className={`${ax({ role: 'control-group', surface: 'sunken', layout: 'stack', width: 'full' })} ${ax.raw({
        gap: 'sm', padding: 'md', border: 'start', shape: 'sm',
      })}`}
    >
      <p
        className={ax({ textStyle: 'body', clamp: '4' })}
        contentEditable={editable || undefined}
        suppressContentEditableWarning
        onBlur={editable && onEdit ? (e) => onEdit({ text: e.currentTarget.textContent ?? '' }) : undefined}
      >
        {data.text}
      </p>
      {data.attribution !== undefined && (
        <cite
          className={ax({ textStyle: 'caption' })}
          contentEditable={editable || undefined}
          suppressContentEditableWarning
          onBlur={editable && onEdit ? (e) => onEdit({ attribution: e.currentTarget.textContent ?? '' }) : undefined}
        >
          — {data.attribution}
        </cite>
      )}
    </blockquote>
  )
}
