/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { PatternDemo } from './PatternDemo'

export const meta = {
  slug: 'pattern-demo',
  category: 'ui',
  label: 'PatternDemo',
}

export function Demo() {
  return <PatternDemo example="alert" />
}
