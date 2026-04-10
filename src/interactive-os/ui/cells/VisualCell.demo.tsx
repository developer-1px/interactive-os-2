/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { VisualCell } from './VisualCell'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'visual-cell',
  category: 'cell' as const,
  label: 'VisualCell',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'bar', gap: 'md' })}>
      <VisualCell thumbnail={null} status="done" />
      <VisualCell thumbnail={null} status="wip" />
      <VisualCell thumbnail={null} status="empty" />
    </div>
  )
}
