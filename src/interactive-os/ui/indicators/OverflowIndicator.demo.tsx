/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { OverflowIndicator } from './OverflowIndicator'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'overflow-indicator',
  category: 'indicator' as const,
  label: 'OverflowIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'bar', gap: 'md' })}>
      <OverflowIndicator count={0} />
      <OverflowIndicator count={3} />
      <OverflowIndicator count={12} />
    </div>
  )
}
