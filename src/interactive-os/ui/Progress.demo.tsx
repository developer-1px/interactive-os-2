/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { Progress } from './Progress'

export const meta = {
  slug: 'progress',
  category: 'ui' as const,
  label: 'Progress',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'column', gap: 'md', width: 'md' })}>
      <Progress value={0} aria-label="Empty" />
      <Progress value={35} aria-label="Partial" />
      <Progress value={75} tone="success" aria-label="Success" />
      <Progress value={100} tone="accent" aria-label="Complete" />
    </div>
  )
}
