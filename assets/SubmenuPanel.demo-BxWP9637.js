var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { SubmenuPanel } from './SubmenuPanel'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'submenu-panel',
  category: 'panel' as const,
  label: 'SubmenuPanel',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'stack', gap: 'md', placement: 'relative' })}>
      <SubmenuPanel label="File" expanded placement="root" anchorName="--demo-anchor">
        <div className={ax({ role: 'item', interactive: 'item', content: 'text', layout: 'row', width: 'full' })}>New File</div>
        <div className={ax({ role: 'item', interactive: 'item', content: 'text', layout: 'row', width: 'full' })}>Open</div>
        <div className={ax({ role: 'item', interactive: 'item', content: 'text', layout: 'row', width: 'full' })}>Save</div>
      </SubmenuPanel>
      <SubmenuPanel label="Hidden" expanded={false} placement="root" anchorName="--demo-anchor-2">
        <div>Should not render</div>
      </SubmenuPanel>
    </div>
  )
}
`;export{e as default};