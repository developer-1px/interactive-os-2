// Bullets block renderer — ul list.
import type React from 'react'
import type { BlockData } from '../../deck/deckTypes'
import { ax } from '@styles/ax'

type BulletsData = Extract<BlockData, { type: 'bullets' }>

export interface BulletsBlockProps {
  data: BulletsData
  editable?: boolean
  onEdit?: (patch: Partial<BulletsData>) => void
}

export function BulletsBlock({ data, editable, onEdit }: BulletsBlockProps): React.ReactElement {
  return (
    <ul
      className={`${ax({ layout: 'stack', width: 'full', textStyle: 'body' })} ${ax.raw({ gap: 'sm', padding: 'sm' })}`}
    >
      {data.items.map((item, i) => (
        <li
          key={i}
          className={`${ax({ layout: 'bar', width: 'full' })} ${ax.raw({ gap: 'sm' })}`}
          contentEditable={editable || undefined}
          suppressContentEditableWarning
          onBlur={
            editable && onEdit
              ? (e) => {
                  const next = [...data.items]
                  next[i] = e.currentTarget.textContent ?? ''
                  onEdit({ items: next })
                }
              : undefined
          }
        >
          <span className={ax({ flex: 'none' })}>•</span>
          <span className={ax({ flex: '1' })}>{item}</span>
        </li>
      ))}
    </ul>
  )
}
