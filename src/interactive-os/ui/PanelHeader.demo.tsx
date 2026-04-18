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
    <div className={ax({ surface: 'raised', layout: 'stack', width: 'md', shape: 'md', scroll: 'hidden' })}>
      <PanelHeader>
        <span>Explorer</span>
        <span className={ax({})}>3 files</span>
      </PanelHeader>
      <div className={ax({ padding: 'md', textStyle: 'body' })}>
        Panel content area
      </div>
    </div>
  )
}
