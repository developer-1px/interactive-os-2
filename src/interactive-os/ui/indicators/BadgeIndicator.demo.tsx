/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { BadgeIndicator } from './BadgeIndicator'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'badge-indicator',
  category: 'indicator' as const,
  label: 'BadgeIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'bar' })}>
      <BadgeIndicator count={3} />
      <BadgeIndicator count={42} />
      <BadgeIndicator count={100} />
      <BadgeIndicator count={0} />
    </div>
  )
}
