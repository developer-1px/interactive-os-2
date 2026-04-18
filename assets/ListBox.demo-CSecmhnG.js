import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ListBox } from './ListBox'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'list-box',
  category: 'ui',
  label: 'ListBox',
}

const data: NormalizedData = createStore({
  entities: {
    recent: { id: 'recent', data: { label: 'Deploy v2.4.1 to staging' } },
    review: { id: 'review', data: { label: 'PR #287 approved by jkim' } },
    merge: { id: 'merge', data: { label: 'Merged feature/auth-flow' } },
    alert: { id: 'alert', data: { label: 'CI pipeline failed on main' } },
  },
  relationships: { [ROOT_ID]: ['recent', 'review', 'merge', 'alert'] },
})

export function Demo() {
  return <ListBox data={data} onChange={() => {}} aria-label="Recent Activity" />
}
`;export{t as n,n as t};