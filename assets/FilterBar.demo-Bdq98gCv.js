import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { FilterBar } from './FilterBar'

export const meta = {
  slug: 'filter-bar',
  category: 'ui',
  label: 'FilterBar',
}

export function Demo() {
  return (
    <FilterBar
      filters={[
        { id: 'status', label: 'Status', value: 'Open' },
        { id: 'priority', label: 'Priority', value: 'High' },
        { id: 'assignee', label: 'Assignee', value: 'jkim' },
      ]}
      onAddFilter={() => {}}
    />
  )
}
`;export{t as n,n as t};