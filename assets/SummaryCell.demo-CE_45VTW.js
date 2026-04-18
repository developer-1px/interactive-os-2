var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { SummaryCell } from './SummaryCell'

export const meta = {
  slug: 'summary-cell',
  category: 'cell' as const,
  label: 'SummaryCell',
}

export function Demo() {
  return <SummaryCell summary="A brief description of the item that may be truncated if too long" />
}
`;export{e as default};