import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { RadioGroup } from './RadioGroup'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'radio-group',
  category: 'ui',
  label: 'RadioGroup',
}

const data: NormalizedData = createStore({
  entities: {
    small: { id: 'small', data: { label: 'Small' } },
    medium: { id: 'medium', data: { label: 'Medium' } },
    large: { id: 'large', data: { label: 'Large' } },
  },
  relationships: { [ROOT_ID]: ['small', 'medium', 'large'] },
})

export function Demo() {
  return <RadioGroup data={data} onChange={() => {}} aria-label="Size" />
}
`;export{t as n,n as t};