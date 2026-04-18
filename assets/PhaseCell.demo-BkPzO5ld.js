var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { PhaseCell } from './PhaseCell'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'phase-cell',
  category: 'cell' as const,
  label: 'PhaseCell',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'bar', gap: 'md' })}>
      <PhaseCell status="done" />
      <PhaseCell status="wip" />
      <PhaseCell status="empty" />
      <PhaseCell status={null} />
    </div>
  )
}
`;export{e as default};