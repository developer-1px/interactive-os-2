/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { PanelHeader } from './PanelHeader'

export const meta = {
  slug: 'panel-header',
  category: 'ui',
  label: 'PanelHeader',
}

export function Demo() {
  return (
    <div className={ax({
        role: 'control-group',
        surface: 'raised', layout: 'stack', width: 'md' })}>
      <PanelHeader>
        <span>Explorer</span>
        <span className={ax({})}>3 files</span>
      </PanelHeader>
      <div className={ax({ textStyle: 'body' })}>
        Panel content area
      </div>
    </div>
  )
}
