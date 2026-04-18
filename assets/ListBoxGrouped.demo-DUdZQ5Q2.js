import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ListBoxGrouped } from './ListBoxGrouped'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'listbox-grouped',
  category: 'ui',
  label: 'ListBoxGrouped',
}

const data: NormalizedData = createStore({
  entities: {
    fruits: { id: 'fruits', data: { label: 'Fruits' } },
    apple: { id: 'apple', data: { label: 'Apple' } },
    banana: { id: 'banana', data: { label: 'Banana' } },
    vegs: { id: 'vegs', data: { label: 'Vegetables' } },
    carrot: { id: 'carrot', data: { label: 'Carrot' } },
    pea: { id: 'pea', data: { label: 'Pea' } },
  },
  relationships: {
    [ROOT_ID]: ['fruits', 'vegs'],
    fruits: ['apple', 'banana'],
    vegs: ['carrot', 'pea'],
  },
})

export function Demo() {
  return <ListBoxGrouped data={data} onChange={() => {}} />
}
`;export{t as n,n as t};