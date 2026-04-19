/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { Panel } from './Panel'

export const meta = {
  slug: 'panel',
  category: 'panel' as const,
  label: 'Panel',
}

export function Demo() {
  return (
    <div className={ax({ width: 'md' })}>
      <Panel header="Panel Title" surface="base">
        <div className={ax({ textStyle: 'body' })}>
          Panel content goes here.
        </div>
      </Panel>
    </div>
  )
}
