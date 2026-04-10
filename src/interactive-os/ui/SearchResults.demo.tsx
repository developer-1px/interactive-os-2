/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { SearchResults } from './SearchResults'

export const meta = {
  slug: 'search-results',
  category: 'ui',
  label: 'SearchResults',
}

const output = `src/ui/ListBox.tsx:12:import { listbox } from '../pattern/roles/listbox'
src/ui/ListBox.tsx:45:  const pattern = listbox()
src/ui/Grid.tsx:8:import { grid as gridBehavior } from '../pattern/roles/grid'
src/ui/Grid.tsx:52:  const pattern = gridBehavior({ columns: columns.length })`

export function Demo() {
  return <SearchResults query="pattern" output={output} />
}
