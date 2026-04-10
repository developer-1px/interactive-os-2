/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ListBox } from '../ListBox'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'

export const meta = {
  slug: 'editable-list-item',
  category: 'item' as const,
  label: 'EditableListItem',
}

const data = createStore({
  entities: {
    a: { id: 'a', data: { label: 'Editable item A' } },
    b: { id: 'b', data: { label: 'Editable item B' } },
    c: { id: 'c', data: { label: 'Editable item C' } },
  },
  relationships: { [ROOT_ID]: ['a', 'b', 'c'] },
})

export function Demo() {
  return <ListBox data={data} enableEditing aria-label="Editable list" />
}
