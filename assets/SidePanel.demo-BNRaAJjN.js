var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { SidePanel } from './SidePanel'

export const meta = {
  slug: 'side-panel',
  category: 'panel' as const,
  label: 'SidePanel',
}

export function Demo() {
  return (
    <div className={ax({ square: 'xl', width: 'md' })}>
      <SidePanel header="Side Panel" surface="display" collapsible defaultCollapsed={false}>
        <div className={ax({ padding: 'md', textStyle: 'body', text: 'secondary' })}>
          Collapsible side panel content.
        </div>
      </SidePanel>
    </div>
  )
}
`;export{e as default};