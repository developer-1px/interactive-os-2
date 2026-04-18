var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { SpinnerIndicator } from './SpinnerIndicator'

export const meta = {
  slug: 'spinner-indicator',
  category: 'indicator' as const,
  label: 'SpinnerIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'row', gap: 'md' })}>
      <SpinnerIndicator size="sm" />
      <SpinnerIndicator size="md" />
      <SpinnerIndicator size="lg" />
    </div>
  )
}
`;export{e as default};