/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Composer } from './Composer'

export const meta = {
  slug: 'composer',
  category: 'ui',
  label: 'Composer',
}

export function Demo() {
  return <Composer placeholder="Type a message..." onSubmit={() => {}} />
}
