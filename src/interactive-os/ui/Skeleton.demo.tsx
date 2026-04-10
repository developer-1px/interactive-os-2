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
    <div className={ax({ layout: 'column', gap: 'md', width: 'md' })}>
      <Skeleton shape="circle" height="md" />
      <Skeleton shape="text" width="full" height="xs" />
      <Skeleton shape="text" width="lg" height="xs" />
      <Skeleton shape="rect" width="full" height="lg" />
    </div>
  )
}
