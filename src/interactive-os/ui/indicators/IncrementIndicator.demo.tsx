/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { IncrementIndicator } from './IncrementIndicator'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'increment-indicator',
  category: 'indicator' as const,
  label: 'IncrementIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'bar' })}>
      <IncrementIndicator direction="increment" />
      <IncrementIndicator direction="decrement" />
    </div>
  )
}
