import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { GroupHeader } from './GroupHeader'

export const meta = {
  slug: 'group-header',
  category: 'ui' as const,
  label: 'GroupHeader',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'stack', gap: 'xs' })}>
      <GroupHeader label="Components" count={12} expanded onToggle={() => {}} />
      <GroupHeader label="Indicators" count={5} expanded={false} onToggle={() => {}} />
      <GroupHeader label="No Toggle" />
    </div>
  )
}
`;export{t as n,n as t};