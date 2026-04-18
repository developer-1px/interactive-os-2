// Stat block renderer — 큰 숫자 + 라벨 + caption(옵션).
import type React from 'react'
import type { BlockData } from '../../deck/deckTypes'
import { ax } from '@styles/ax'

type StatData = Extract<BlockData, { type: 'stat' }>

export interface StatBlockProps {
  data: StatData
  editable?: boolean
  onEdit?: (patch: Partial<StatData>) => void
}

export function StatBlock({ data, editable, onEdit }: StatBlockProps): React.ReactElement {
  return (
    <div
      className={`${ax({ layout: 'stack', width: 'full' })} ${ax.raw({ gap: 'xs', padding: 'md' })}`}
    >
      <strong
        className={ax({ cs: 'xl', textStyle: 'hero' })}
        contentEditable={editable || undefined}
        suppressContentEditableWarning
        onBlur={editable && onEdit ? (e) => onEdit({ value: e.currentTarget.textContent ?? '' }) : undefined}
      >
        {data.value}
      </strong>
      <span
        className={ax({ textStyle: 'label' })}
        contentEditable={editable || undefined}
        suppressContentEditableWarning
        onBlur={editable && onEdit ? (e) => onEdit({ label: e.currentTarget.textContent ?? '' }) : undefined}
      >
        {data.label}
      </span>
      {data.caption !== undefined && (
        <span
          className={ax({ textStyle: 'caption' })}
          contentEditable={editable || undefined}
          suppressContentEditableWarning
          onBlur={editable && onEdit ? (e) => onEdit({ caption: e.currentTarget.textContent ?? '' }) : undefined}
        >
          {data.caption}
        </span>
      )}
    </div>
  )
}
