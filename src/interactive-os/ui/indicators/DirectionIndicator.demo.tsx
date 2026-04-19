/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { DirectionIndicator } from './DirectionIndicator'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'direction-indicator',
  category: 'indicator' as const,
  label: 'DirectionIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'bar' })}>
      <DirectionIndicator direction="prev" />
      <DirectionIndicator direction="next" />
      <DirectionIndicator direction="prev" double />
      <DirectionIndicator direction="next" double />
      <DirectionIndicator direction="prev" orientation="vertical" />
      <DirectionIndicator direction="next" orientation="vertical" />
    </div>
  )
}
