/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { CloseIndicator } from './CloseIndicator'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'close-indicator',
  category: 'indicator' as const,
  label: 'CloseIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'bar', gap: 'md' })}>
      <CloseIndicator />
    </div>
  )
}
