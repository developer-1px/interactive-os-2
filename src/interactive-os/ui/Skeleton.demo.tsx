/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { Skeleton } from './Skeleton'

export const meta = {
  slug: 'skeleton',
  category: 'ui' as const,
  label: 'Skeleton',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'stack', gap: 'lg', width: 'full' })}>
      {/* Profile card skeleton */}
      <div className={ax({ layout: 'row', gap: 'md' })}>
        <Skeleton shape="circle" height="lg" />
        <div className={ax({ layout: 'stack', gap: 'xs', width: 'full' })}>
          <Skeleton shape="text" width="md" height="sm" />
          <Skeleton shape="text" width="sm" height="xs" />
        </div>
      </div>

      {/* Content block skeleton */}
      <div className={ax({ layout: 'stack', gap: 'sm' })}>
        <Skeleton shape="text" width="full" height="xs" />
        <Skeleton shape="text" width="full" height="xs" />
        <Skeleton shape="text" width="lg" height="xs" />
      </div>

      {/* Image placeholder skeleton */}
      <Skeleton shape="rect" width="full" height="xl" />
    </div>
  )
}
