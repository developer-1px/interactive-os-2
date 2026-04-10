/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { masterDetailRenderer } from './MasterDetail'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { A2UIRenderContext } from '../a2uiComponentMap'

export const meta = {
  slug: 'master-detail',
  category: 'composite' as const,
  label: 'MasterDetail',
}

const store = createStore({
  entities: {
    'md-1': { id: 'md-1', data: { master: 'list', detail: 'detail' } },
    'list': { id: 'list', data: { label: 'Item List' } },
    'detail': { id: 'detail', data: { label: 'Detail View' } },
  },
  relationships: { [ROOT_ID]: ['md-1'] },
})

const ctx: A2UIRenderContext = {
  entity: store.entities['md-1'],
  store,
  renderNode: (nodeId) => {
    const e = store.entities[nodeId]
    if (!e) return null
    const d = e.data as Record<string, unknown>
    return <div className={ax({ padding: 'md', surface: 'sunken', shape: 'sm' })}>{String(d.label ?? nodeId)}</div>
  },
  renderChildren: () => null,
  depth: 0,
}

export function Demo() {
  return <>{masterDetailRenderer(ctx)}</>
}
