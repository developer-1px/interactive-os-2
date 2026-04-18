var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { PageIndicator } from './PageIndicator'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'page-indicator',
  category: 'indicator' as const,
  label: 'PageIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'stack', gap: 'md' })}>
      <PageIndicator total={5} current={0} />
      <PageIndicator total={5} current={2} />
      <PageIndicator total={5} current={4} />
    </div>
  )
}
`;export{e as default};