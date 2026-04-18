import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Combobox } from './Combobox'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'combobox',
  category: 'ui',
  label: 'Combobox',
}

const data: NormalizedData = createStore({
  entities: {
    bug: { id: 'bug', data: { label: 'Bug' } },
    feature: { id: 'feature', data: { label: 'Feature' } },
    docs: { id: 'docs', data: { label: 'Documentation' } },
    refactor: { id: 'refactor', data: { label: 'Refactor' } },
  },
  relationships: { [ROOT_ID]: ['bug', 'feature', 'docs', 'refactor'] },
})

export function Demo() {
  return <Combobox data={data} onChange={() => {}} placeholder="Select label..." />
}
`;export{t as n,n as t};