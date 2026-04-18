var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { StatusIndicator } from './StatusIndicator'

export const meta = {
  slug: 'status-indicator',
  category: 'indicator' as const,
  label: 'StatusIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'row', gap: 'md' })}>
      <StatusIndicator tone="info" />
      <StatusIndicator tone="success" />
      <StatusIndicator tone="warning" />
      <StatusIndicator tone="error" />
      <StatusIndicator tone="info" variant="ring" />
      <StatusIndicator tone="success" variant="ring" />
    </div>
  )
}
`;export{e as default};