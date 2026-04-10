/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { PipelineGrid } from './PipelineGrid'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'pipeline-grid',
  category: 'ui',
  label: 'PipelineGrid',
}

const columns = [
  { key: 'feature', header: 'Feature', width: '200px' },
  { key: 'story', header: 'Story', width: '80px' },
  { key: 'prd', header: 'PRD', width: '80px' },
  { key: 'impl', header: 'Impl', width: '80px' },
]

const data: NormalizedData = createStore({
  entities: {
    r1: { id: 'r1', data: { cells: [{ text: 'Auth Flow', tier: 'feature' }, { status: 'done' }, { status: 'done' }, { status: 'partial' }] } },
    r2: { id: 'r2', data: { cells: [{ text: 'Dashboard', tier: 'screen' }, { status: 'done' }, { status: 'missing' }, { status: null }] } },
    r3: { id: 'r3', data: { cells: [{ text: 'API Layer', tier: 'layer' }, { status: 'done' }, { status: 'done' }, { status: 'done' }] } },
  },
  relationships: { [ROOT_ID]: ['r1', 'r2', 'r3'] },
})

export function Demo() {
  return <PipelineGrid data={data} columns={columns} onChange={() => {}} header aria-label="Pipeline" />
}
