/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { IndeterminateIndicator } from './IndeterminateIndicator'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'indeterminate-indicator',
  category: 'indicator' as const,
  label: 'IndeterminateIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'bar', gap: 'md' })}>
      <IndeterminateIndicator />
    </div>
  )
}
