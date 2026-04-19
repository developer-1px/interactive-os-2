/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { formSectionRenderer } from './FormSection'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { A2UIRenderContext } from '../a2uiComponentMap'

export const meta = {
  slug: 'form-section',
  category: 'composite' as const,
  label: 'FormSection',
}

const store = createStore({
  entities: {
    'form-1': {
      id: 'form-1',
      data: {
        title: 'Account Settings',
        fields: ['field-name', 'field-email'],
        actions: [{ label: 'Save', variant: 'primary' }, { label: 'Cancel' }],
      },
    },
    'field-name': { id: 'field-name', data: { label: 'Name' } },
    'field-email': { id: 'field-email', data: { label: 'Email' } },
  },
  relationships: { [ROOT_ID]: ['form-1'] },
})

const ctx: A2UIRenderContext = {
  entity: store.entities['form-1'],
  store,
  renderNode: (nodeId) => {
    const e = store.entities[nodeId]
    if (!e) return null
    const d = e.data as Record<string, unknown>
    return <div className={ax({
        role: 'control-group',
        surface: 'sunken' })}>{String(d.label ?? nodeId)}</div>
  },
  renderChildren: () => null,
  depth: 0,
}

export function Demo() {
  return <>{formSectionRenderer(ctx)}</>
}
