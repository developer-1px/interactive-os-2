import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { DatePicker } from './DatePicker'

export const meta = {
  slug: 'date-picker',
  category: 'ui',
  label: 'DatePicker',
}

export function Demo() {
  const [value, setValue] = useState<Date | null>(null)
  return <DatePicker value={value} onChange={setValue} aria-label="Select date" />
}
`;export{t as n,n as t};