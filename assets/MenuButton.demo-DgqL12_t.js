import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { MenuButton } from './MenuButton'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'menu-button',
  category: 'ui',
  label: 'MenuButton',
}

const data: NormalizedData = createStore({
  entities: {
    actions: { id: 'actions', data: { name: 'Actions' } },
    cut: { id: 'cut', data: { name: 'Cut' } },
    copy: { id: 'copy', data: { name: 'Copy' } },
    paste: { id: 'paste', data: { name: 'Paste' } },
    selectAll: { id: 'selectAll', data: { name: 'Select All' } },
  },
  relationships: {
    [ROOT_ID]: ['actions'],
    actions: ['cut', 'copy', 'paste', 'selectAll'],
  },
})

export function Demo() {
  return <MenuButton data={data} onChange={() => {}} aria-label="Actions Menu" />
}
`;export{t as n,n as t};