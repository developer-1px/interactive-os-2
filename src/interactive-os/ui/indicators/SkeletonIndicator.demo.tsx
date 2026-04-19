/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { SkeletonIndicator } from './SkeletonIndicator'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'skeleton-indicator',
  category: 'indicator' as const,
  label: 'SkeletonIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'stack' })}>
      <SkeletonIndicator width="200px" height="16px" />
      <SkeletonIndicator width="150px" height="16px" />
      <SkeletonIndicator width="100%" height="32px" />
    </div>
  )
}
