/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import React from 'react'
import type { NodeState } from '../../pattern/types'
import { TabList } from '../TabList'
import { ViewerTabItem } from './ViewerTabItem'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'

export const meta = {
  slug: 'viewer-tab-item',
  category: 'item' as const,
  label: 'ViewerTabItem',
}

const data = createStore({
  entities: {
    f1: { id: 'f1', data: { label: 'index.tsx', type: 'file' } },
    s1: { id: 's1', data: { label: 'Search', type: 'search' } },
    t1: { id: 't1', data: { label: 'Terminal', type: 'terminal' } },
  },
  relationships: { [ROOT_ID]: ['f1', 's1', 't1'] },
})

const renderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement =>
  ViewerTabItem(props, node, state)

export function Demo() {
  return <TabList data={data} renderItem={renderItem} aria-label="Viewer tabs" />
}
