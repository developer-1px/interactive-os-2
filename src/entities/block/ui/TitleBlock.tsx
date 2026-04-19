// Title block renderer — 큰 제목.
import type React from 'react'
import type { BlockData } from '../../deck/deckTypes'
import { ax } from '@styles/ax'

type TitleData = Extract<BlockData, { type: 'title' }>

export interface TitleBlockProps {
  data: TitleData
  editable?: boolean
  onEdit?: (patch: Partial<TitleData>) => void
}

export function TitleBlock({ data, editable, onEdit }: TitleBlockProps): React.ReactElement {
  return (
    <h1
      className={ax({ textStyle: 'display', width: 'full', clamp: '2' })}
      contentEditable={editable || undefined}
      suppressContentEditableWarning
      onBlur={editable && onEdit ? (e) => onEdit({ text: e.currentTarget.textContent ?? '' }) : undefined}
    >
      {data.text}
    </h1>
  )
}
