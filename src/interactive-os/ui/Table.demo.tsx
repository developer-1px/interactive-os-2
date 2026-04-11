/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { Table } from './Table'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'table',
  category: 'ui' as const,
  label: 'Table',
}

const initial: NormalizedData = createStore({
  entities: {
    head: { id: 'head', data: { label: 'Header' } },
    'h-name': { id: 'h-name', data: { label: 'Name' } },
    'h-role': { id: 'h-role', data: { label: 'Role' } },
    'h-status': { id: 'h-status', data: { label: 'Status' } },
    body: { id: 'body', data: { label: 'Body' } },
    row1: { id: 'row1', data: { label: 'Row 1' } },
    'c1-name': { id: 'c1-name', data: { label: 'Alice' } },
    'c1-role': { id: 'c1-role', data: { label: 'Engineer' } },
    'c1-status': { id: 'c1-status', data: { label: 'Active' } },
    row2: { id: 'row2', data: { label: 'Row 2' } },
    'c2-name': { id: 'c2-name', data: { label: 'Bob' } },
    'c2-role': { id: 'c2-role', data: { label: 'Designer' } },
    'c2-status': { id: 'c2-status', data: { label: 'Away' } },
    row3: { id: 'row3', data: { label: 'Row 3' } },
    'c3-name': { id: 'c3-name', data: { label: 'Carol' } },
    'c3-role': { id: 'c3-role', data: { label: 'Manager' } },
    'c3-status': { id: 'c3-status', data: { label: 'Active' } },
  },
  relationships: {
    [ROOT_ID]: ['head', 'body'],
    head: ['h-name', 'h-role', 'h-status'],
    body: ['row1', 'row2', 'row3'],
    row1: ['c1-name', 'c1-role', 'c1-status'],
    row2: ['c2-name', 'c2-role', 'c2-status'],
    row3: ['c3-name', 'c3-role', 'c3-status'],
  },
})

export function Demo() {
  const [data, setData] = useState(initial)
  return <Table data={data} onChange={setData} aria-label="Team members" />
}
