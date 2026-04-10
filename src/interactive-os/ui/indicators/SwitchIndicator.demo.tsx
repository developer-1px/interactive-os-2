/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { SwitchIndicator } from './SwitchIndicator'

export const meta = {
  slug: 'switch-indicator',
  category: 'indicator' as const,
  label: 'SwitchIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'row', gap: 'md' })}>
      <SwitchIndicator checked={false} />
      <SwitchIndicator checked />
    </div>
  )
}
