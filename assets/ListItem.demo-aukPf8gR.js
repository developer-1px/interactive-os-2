var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { ListItem } from './ListItem'
import { ListBox } from '../ListBox'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'

export const meta = {
  slug: 'list-item',
  category: 'item' as const,
  label: 'ListItem',
}

const data = createStore({
  entities: {
    'i-1': { id: 'i-1', data: { label: 'First item' } },
    'i-2': { id: 'i-2', data: { label: 'Second item' } },
    'i-3': { id: 'i-3', data: { label: 'Third item' } },
  },
  relationships: { [ROOT_ID]: ['i-1', 'i-2', 'i-3'] },
})

const renderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState) =>
  ListItem(props, node, state)

export function Demo() {
  return <ListBox data={data} renderItem={renderItem} aria-label="List item demo" />
}
`;export{e as default};