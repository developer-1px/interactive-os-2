var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import React from 'react'
import type { NodeState } from '../../pattern/types'
import { ListBox } from '../ListBox'
import { IssueRow } from './IssueRow'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'

export const meta = {
  slug: 'issue-row',
  category: 'item' as const,
  label: 'IssueRow',
}

const data = createStore({
  entities: {
    i1: { id: 'i1', data: { label: 'Fix login bug' } },
    i2: { id: 'i2', data: { label: 'Add dark mode support' } },
  },
  relationships: { [ROOT_ID]: ['i1', 'i2'] },
})

const renderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement =>
  IssueRow(props, node, state, {
    identifier: 'ISS-1',
    labels: [{ text: 'bug', tone: 'danger' }],
  })

export function Demo() {
  return <ListBox data={data} renderItem={renderItem} aria-label="Issues" />
}
`;export{e as default};