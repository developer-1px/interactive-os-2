import { A2UISurface } from '../A2UISurface'
import type { A2UIPayload } from '../a2uiAdapter'
import type { DataBlock } from './types'
import { ax } from '@styles/ax'

export function A2UIBlock({ block }: { block: DataBlock }) {
  const payload = block.data as A2UIPayload
  if (!payload?.components) return null

  return (
    <div className={ax({ surface: 'display' })}>
      <A2UISurface payload={payload} />
    </div>
  )
}
