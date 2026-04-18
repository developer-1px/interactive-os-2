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
    <div className={ax({ layout: 'stack', gap: 'md', width: 'full' })}>
      <div className={ax({ layout: 'stack', gap: 'xs' })}>
        <span className={ax({ textStyle: 'caption' })}>0%</span>
        <Progress value={0} aria-label="Empty" />
      </div>
      <div className={ax({ layout: 'stack', gap: 'xs' })}>
        <span className={ax({ textStyle: 'caption' })}>35%</span>
        <Progress value={35} aria-label="Partial" />
      </div>
      <div className={ax({ layout: 'stack', gap: 'xs' })}>
        <span className={ax({ textStyle: 'caption' })}>75% — success</span>
        <Progress value={75} tone="success" aria-label="Success" />
      </div>
      <div className={ax({ layout: 'stack', gap: 'xs' })}>
        <span className={ax({ textStyle: 'caption' })}>100% — complete</span>
        <Progress value={100} tone="accent" aria-label="Complete" />
      </div>
    </div>
  )
}
