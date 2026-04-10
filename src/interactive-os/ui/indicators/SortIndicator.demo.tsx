/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { SortIndicator } from './SortIndicator'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'sort-indicator',
  category: 'indicator' as const,
  label: 'SortIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'bar', gap: 'md' })}>
      <SortIndicator />
      <SortIndicator direction="ascending" />
      <SortIndicator direction="descending" />
    </div>
  )
}
