/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { TierCell } from './TierCell'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'tier-cell',
  category: 'cell' as const,
  label: 'TierCell',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'stack', gap: 'sm' })}>
      <TierCell text="User Need" tier="need" subtitle="Core requirement" />
      <TierCell text="User Story" tier="story" />
      <TierCell text="Feature" tier="feature" subtitle="Login flow" />
      <TierCell text="Screen" tier="screen" />
      <TierCell text="Layer" tier="layer" />
      <TierCell text="Button" tier="component" />
    </div>
  )
}
