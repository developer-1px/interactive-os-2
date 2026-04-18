var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { ExpandIndicator } from './ExpandIndicator'

export const meta = {
  slug: 'expand-indicator',
  category: 'indicator' as const,
  label: 'ExpandIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'row', gap: 'md' })}>
      <ExpandIndicator expanded={false} />
      <ExpandIndicator expanded />
      <ExpandIndicator expanded={false} variant="tree" />
      <ExpandIndicator expanded variant="tree" />
      <ExpandIndicator hasChildren={false} />
    </div>
  )
}
`;export{e as default};