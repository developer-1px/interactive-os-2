/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { GripIndicator } from './GripIndicator'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'grip-indicator',
  category: 'indicator' as const,
  label: 'GripIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'bar', gap: 'md' })}>
      <GripIndicator orientation="vertical" />
      <GripIndicator orientation="horizontal" />
    </div>
  )
}
