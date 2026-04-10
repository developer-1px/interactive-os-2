/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { SearchableListRenderer } from './SearchableList'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { A2UIRenderContext } from '../a2uiComponentMap'

export const meta = {
  slug: 'searchable-list',
  category: 'composite' as const,
  label: 'SearchableList',
}

const store = createStore({
  entities: {
    'sl-1': {
      id: 'sl-1',
      data: {
        searchLabel: 'Filter items',
        'aria-label': 'Searchable list',
        items: [
          { id: 'a', label: 'Apple', sublabel: 'Fruit' },
          { id: 'b', label: 'Banana', sublabel: 'Fruit' },
          { id: 'c', label: 'Carrot', sublabel: 'Vegetable' },
        ],
      },
    },
  },
  relationships: { [ROOT_ID]: ['sl-1'] },
})

const ctx: A2UIRenderContext = {
  entity: store.entities['sl-1'],
  store,
  renderNode: () => null,
  renderChildren: () => null,
  depth: 0,
}

export function Demo() {
  return <SearchableListRenderer {...ctx} />
}
