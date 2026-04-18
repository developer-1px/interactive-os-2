var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { statGridRenderer } from './StatGrid'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { A2UIRenderContext } from '../a2uiComponentMap'

export const meta = {
  slug: 'stat-grid',
  category: 'composite' as const,
  label: 'StatGrid',
}

const store = createStore({
  entities: {
    'sg-1': {
      id: 'sg-1',
      data: {
        items: [
          { id: 's1', value: '1,234', label: 'Total Users' },
          { id: 's2', value: '567', label: 'Active Today' },
          { id: 's3', value: '89%', label: 'Uptime' },
        ],
      },
    },
  },
  relationships: { [ROOT_ID]: ['sg-1'] },
})

const ctx: A2UIRenderContext = {
  entity: store.entities['sg-1'],
  store,
  renderNode: () => null,
  renderChildren: () => null,
  depth: 0,
}

export function Demo() {
  return <>{statGridRenderer(ctx)}</>
}
`;export{e as default};