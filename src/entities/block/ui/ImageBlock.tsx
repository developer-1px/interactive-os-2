// Image block renderer — img + caption.
import type React from 'react'
import type { BlockData } from '../../deck/deckTypes'
import { ax } from '@styles/ax'

type ImageData = Extract<BlockData, { type: 'image' }>

export interface ImageBlockProps {
  data: ImageData
  editable?: boolean
  onEdit?: (patch: Partial<ImageData>) => void
}

export function ImageBlock({ data, editable, onEdit }: ImageBlockProps): React.ReactElement {
  return (
    <figure
      className={`${ax({ layout: 'stack', width: 'full' })} ${ax.raw({ gap: 'xs' })}`}
    >
      <img
        src={data.src}
        alt={data.alt}
        className={`${ax({ width: 'full', aspect: 'video' })} ${ax.raw({ shape: 'sm' })}`}
      />
      {data.caption !== undefined && (
        <figcaption
          className={ax({ textStyle: 'caption' })}
          contentEditable={editable || undefined}
          suppressContentEditableWarning
          onBlur={editable && onEdit ? (e) => onEdit({ caption: e.currentTarget.textContent ?? '' }) : undefined}
        >
          {data.caption}
        </figcaption>
      )}
    </figure>
  )
}
