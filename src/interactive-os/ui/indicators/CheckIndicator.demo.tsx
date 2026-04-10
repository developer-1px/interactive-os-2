/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { CheckIndicator } from './CheckIndicator'

export const meta = {
  slug: 'check-indicator',
  category: 'indicator' as const,
  label: 'CheckIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'row', gap: 'md' })}>
      <CheckIndicator checked={false} />
      <CheckIndicator checked />
    </div>
  )
}
