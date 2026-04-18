var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { DocLinkCell } from './DocLinkCell'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'doc-link-cell',
  category: 'cell' as const,
  label: 'DocLinkCell',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'stack', gap: 'sm' })}>
      <DocLinkCell docs={[
        { label: 'PRD', path: '/docs/prd.md' },
        { label: 'Design', path: '/docs/design.md' },
      ]} />
      <DocLinkCell docs={[]} />
    </div>
  )
}
`;export{e as default};