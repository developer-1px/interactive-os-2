/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { FlatLayout } from './FlatLayout'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'flat-layout',
  category: 'ui',
  label: 'FlatLayout',
}

function PanelA() {
  return <div className={ax({ surface: 'display' })}>Panel A</div>
}

function PanelB() {
  return <div className={ax({ surface: 'display' })}>Panel B</div>
}

const registry = createWidgetRegistry({ PanelA, PanelB })

const data: NormalizedData = createStore({
  entities: {
    root: { id: 'root', data: { type: 'split', direction: 'horizontal', sizes: [0.4, 'flex'] } },
    left: { id: 'left', data: { type: 'widget', widget: 'PanelA' } },
    right: { id: 'right', data: { type: 'widget', widget: 'PanelB' } },
  },
  relationships: {
    [ROOT_ID]: ['root'],
    root: ['left', 'right'],
  },
})

export function Demo() {
  return <FlatLayout data={data} registry={registry} onChange={() => {}} aria-label="Layout demo" />
}
