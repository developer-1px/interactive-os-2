// Block type → renderer mapping (OCP — add new block types here only).
import type React from 'react'
import type { BlockData, BlockType } from '../../deck/deckTypes'
import { TitleBlock } from './TitleBlock'
import { BulletsBlock } from './BulletsBlock'
import { StatBlock } from './StatBlock'
import { ImageBlock } from './ImageBlock'
import { QuoteBlock } from './QuoteBlock'
import { CodeBlock } from './CodeBlock'
import { ChartBlock } from './ChartBlock'

export interface BlockRendererProps<T extends BlockData = BlockData> {
  data: T
  editable?: boolean
  onEdit?: (patch: Partial<T>) => void
}

// Erase variant-specific prop types — renderer map is invariant over BlockData subtype.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRenderer = React.ComponentType<BlockRendererProps<any>>

export const blockRenderers: Record<BlockType, AnyRenderer> = {
  title:   TitleBlock,
  bullets: BulletsBlock,
  stat:    StatBlock,
  image:   ImageBlock,
  quote:   QuoteBlock,
  code:    CodeBlock,
  chart:   ChartBlock,
}

export function renderBlock(
  data: BlockData,
  props?: { editable?: boolean; onEdit?: (patch: Partial<BlockData>) => void },
): React.ReactElement | null {
  const Renderer = blockRenderers[data.type]
  if (!Renderer) return null
  return <Renderer data={data} {...props} />
}
