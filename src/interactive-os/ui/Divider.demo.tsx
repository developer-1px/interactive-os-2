/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { Divider } from './Divider'

export const meta = {
  slug: 'divider',
  category: 'ui' as const,
  label: 'Divider',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'stack', width: 'md' })}>
      <span>Above</span>
      <Divider />
      <span>Below</span>
      <div className={ax({ layout: 'row' })}>
        <span>Left</span>
        <Divider direction="vertical" />
        <span>Right</span>
      </div>
    </div>
  )
}
