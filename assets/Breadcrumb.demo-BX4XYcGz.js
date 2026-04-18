import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { Breadcrumb } from './Breadcrumb'

export const meta = {
  slug: 'breadcrumb',
  category: 'ui' as const,
  label: 'Breadcrumb',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'stack', gap: 'md' })}>
      <Breadcrumb path="src/interactive-os/ui/Breadcrumb.tsx" root="src" />
      <Breadcrumb path="docs/guides/getting-started.md" root="docs" />
    </div>
  )
}
`;export{t as n,n as t};