/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { MenuList } from './MenuList'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'menu-list',
  category: 'ui',
  label: 'MenuList',
}

const data: NormalizedData = createStore({
  entities: {
    cut: { id: 'cut', data: { label: 'Cut' } },
    copy: { id: 'copy', data: { label: 'Copy' } },
    paste: { id: 'paste', data: { label: 'Paste' } },
    selectAll: { id: 'selectAll', data: { label: 'Select All' } },
  },
  relationships: { [ROOT_ID]: ['cut', 'copy', 'paste', 'selectAll'] },
})

export function Demo() {
  return <MenuList data={data} onChange={() => {}} aria-label="Edit Menu" />
}
