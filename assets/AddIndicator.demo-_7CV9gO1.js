var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { AddIndicator } from './AddIndicator'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'add-indicator',
  category: 'indicator' as const,
  label: 'AddIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'bar', gap: 'md' })}>
      <AddIndicator />
    </div>
  )
}
`;export{e as default};