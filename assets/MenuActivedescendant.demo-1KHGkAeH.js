import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { MenuActivedescendant } from './MenuActivedescendant'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'menu-activedescendant',
  category: 'ui',
  label: 'MenuActivedescendant',
}

const data: NormalizedData = createStore({
  entities: {
    cut: { id: 'cut', data: { label: 'Cut' } },
    copy: { id: 'copy', data: { label: 'Copy' } },
    paste: { id: 'paste', data: { label: 'Paste' } },
    delete: { id: 'delete', data: { label: 'Delete' } },
  },
  relationships: {
    [ROOT_ID]: ['cut', 'copy', 'paste', 'delete'],
  },
})

export function Demo() {
  return <MenuActivedescendant data={data} onChange={() => {}} aria-label="Edit actions" />
}
`;export{t as n,n as t};