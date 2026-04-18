import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Tooltip } from './Tooltip'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'tooltip',
  category: 'ui',
  label: 'Tooltip',
}

export function Demo() {
  return (
    <Tooltip content="This is a tooltip" placement="bottom">
      <button className={ax({ role: 'control', surface: 'action', content: 'text', clamp: '1' })}>Hover me</button>
    </Tooltip>
  )
}
`;export{t as n,n as t};