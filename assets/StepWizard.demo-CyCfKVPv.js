var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { StepWizardRenderer } from './StepWizard'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { A2UIRenderContext } from '../a2uiComponentMap'

export const meta = {
  slug: 'step-wizard',
  category: 'composite' as const,
  label: 'StepWizard',
}

const store = createStore({
  entities: {
    'wizard-1': {
      id: 'wizard-1',
      data: {
        title: 'Setup Wizard',
        subtitle: 'Complete the steps below',
        steps: [
          { title: 'Account', content: 'step-content-1' },
          { title: 'Profile', content: 'step-content-2' },
        ],
      },
    },
    'step-content-1': { id: 'step-content-1', data: { label: 'Enter your account info' } },
    'step-content-2': { id: 'step-content-2', data: { label: 'Set up your profile' } },
  },
  relationships: { [ROOT_ID]: ['wizard-1'] },
})

const ctx: A2UIRenderContext = {
  entity: store.entities['wizard-1'],
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
  return <StepWizardRenderer {...ctx} />
}
`;export{e as default};