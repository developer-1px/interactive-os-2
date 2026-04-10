/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Meter } from './Meter'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'

export const meta = {
  slug: 'meter',
  category: 'ui' as const,
  label: 'Meter',
}

const data = createStore({
  entities: {
    'm-1': { id: 'm-1', data: { label: 'CPU Usage', value: 65, max: 100 } },
    'm-2': { id: 'm-2', data: { label: 'Memory', value: 8, max: 16 } },
    'm-3': { id: 'm-3', data: { label: 'Disk', value: 120, max: 500 } },
  },
  relationships: { [ROOT_ID]: ['m-1', 'm-2', 'm-3'] },
})

export function Demo() {
  return <Meter data={data} aria-label="System meters" />
}
