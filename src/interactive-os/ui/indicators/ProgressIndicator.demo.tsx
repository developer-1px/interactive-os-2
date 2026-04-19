/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ProgressIndicator } from './ProgressIndicator'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'progress-indicator',
  category: 'indicator' as const,
  label: 'ProgressIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'stack' })}>
      <ProgressIndicator value={0} />
      <ProgressIndicator value={33} />
      <ProgressIndicator value={75} />
      <ProgressIndicator value={100} />
    </div>
  )
}
