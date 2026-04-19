/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { SearchableCell } from './SearchableCell'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'searchable-cell',
  category: 'cell' as const,
  label: 'SearchableCell',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'stack' })}>
      <SearchableCell>Normal text</SearchableCell>
      <SearchableCell muted>Muted text</SearchableCell>
      <SearchableCell empty>empty</SearchableCell>
    </div>
  )
}
