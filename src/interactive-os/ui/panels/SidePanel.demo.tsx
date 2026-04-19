/* eslint-disable react-refresh/only-export-components */
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
    <div className={ax({ width: 'md' })}>
      <SidePanel header="Side Panel" surface="base" collapsible defaultCollapsed={false}>
        <div className={ax({ textStyle: 'body' })}>
          Collapsible side panel content.
        </div>
      </SidePanel>
    </div>
  )
}
