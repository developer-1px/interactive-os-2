/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Alert } from './Alert'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'alert',
  category: 'ui',
  label: 'Alert',
}

const data: NormalizedData = createStore({
  entities: {
    info: { id: 'info', data: { label: 'Deployment complete', description: 'v2.4.1 deployed to staging', tone: 'success' } },
    warn: { id: 'warn', data: { label: 'High memory usage', description: 'Worker exceeds 80% threshold', tone: 'warning' } },
    err: { id: 'err', data: { label: 'CI pipeline failed', description: 'Build failed on main branch', tone: 'error' } },
  },
  relationships: { [ROOT_ID]: ['info', 'warn', 'err'] },
})

export function Demo() {
  return <Alert data={data} onChange={() => {}} aria-label="Alerts" />
}
