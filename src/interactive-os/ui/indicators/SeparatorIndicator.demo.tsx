/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { SeparatorIndicator } from './SeparatorIndicator'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'separator-indicator',
  category: 'indicator' as const,
  label: 'SeparatorIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'stack' })}>
      <SeparatorIndicator orientation="horizontal" />
      <div className={ax({ layout: 'bar' })}>
        <span>Left</span>
        <SeparatorIndicator orientation="vertical" />
        <span>Right</span>
      </div>
    </div>
  )
}
