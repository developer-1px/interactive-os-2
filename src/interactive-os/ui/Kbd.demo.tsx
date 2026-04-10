/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { Kbd } from './Kbd'

export const meta = {
  slug: 'kbd',
  category: 'ui' as const,
  label: 'Kbd',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'row', gap: 'sm' })}>
      <Kbd>Ctrl</Kbd>
      <Kbd>Shift</Kbd>
      <Kbd>Enter</Kbd>
      <Kbd>Cmd+K</Kbd>
    </div>
  )
}
