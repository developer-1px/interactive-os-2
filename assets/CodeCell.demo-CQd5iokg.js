var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { CodeCell } from './CodeCell'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'code-cell',
  category: 'cell' as const,
  label: 'CodeCell',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'stack', gap: 'sm' })}>
      <CodeCell>const x = 42</CodeCell>
      <CodeCell>export function Demo() {'{}'}</CodeCell>
    </div>
  )
}
`;export{e as default};