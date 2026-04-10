/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Table } from './Table'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'table',
  category: 'ui',
  label: 'Table',
}

const data: NormalizedData = createStore({
  entities: {
    body: { id: 'body', data: { label: 'Body' } },
    row1: { id: 'row1', data: { label: 'Row 1' } },
    cell1a: { id: 'cell1a', data: { label: 'Alice' } },
    cell1b: { id: 'cell1b', data: { label: 'Engineer' } },
    row2: { id: 'row2', data: { label: 'Row 2' } },
    cell2a: { id: 'cell2a', data: { label: 'Bob' } },
    cell2b: { id: 'cell2b', data: { label: 'Designer' } },
    row3: { id: 'row3', data: { label: 'Row 3' } },
    cell3a: { id: 'cell3a', data: { label: 'Carol' } },
    cell3b: { id: 'cell3b', data: { label: 'Manager' } },
  },
  relationships: {
    [ROOT_ID]: ['body'],
    body: ['row1', 'row2', 'row3'],
    row1: ['cell1a', 'cell1b'],
    row2: ['cell2a', 'cell2b'],
    row3: ['cell3a', 'cell3b'],
  },
})

export function Demo() {
  return <Table data={data} onChange={() => {}} aria-label="Team members" />
}
