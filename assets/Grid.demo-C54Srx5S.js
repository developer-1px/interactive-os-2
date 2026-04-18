import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Grid } from './Grid'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'grid',
  category: 'ui',
  label: 'Grid',
}

const data: NormalizedData = createStore({
  entities: {
    r1: { id: 'r1', data: { cells: ['AUTH-142', 'Login timeout on Safari', 'Critical'] } },
    r2: { id: 'r2', data: { cells: ['UI-891', 'Dark mode contrast', 'Medium'] } },
    r3: { id: 'r3', data: { cells: ['API-356', 'Rate limit exceeded', 'High'] } },
    r4: { id: 'r4', data: { cells: ['FE-102', 'Tree keyboard nav', 'Low'] } },
  },
  relationships: { [ROOT_ID]: ['r1', 'r2', 'r3', 'r4'] },
})

const columns = [
  { key: 'id', header: 'ID', width: '120px' },
  { key: 'title', header: 'Title', width: '1fr' },
  { key: 'priority', header: 'Priority', width: '100px' },
]

export function Demo() {
  return <Grid data={data} columns={columns} onChange={() => {}} header aria-label="Issues" />
}
`;export{t as n,n as t};