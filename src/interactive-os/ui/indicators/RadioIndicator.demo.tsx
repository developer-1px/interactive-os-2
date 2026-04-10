/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { RadioIndicator } from './RadioIndicator'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'radio-indicator',
  category: 'indicator' as const,
  label: 'RadioIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'bar', gap: 'md' })}>
      <RadioIndicator checked={false} />
      <RadioIndicator checked />
    </div>
  )
}
