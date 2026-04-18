var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import React from 'react'
import type { NodeState } from '../../pattern/types'
import { ListBox } from '../ListBox'
import { TocItem } from './TocItem'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'

export const meta = {
  slug: 'toc-item',
  category: 'item' as const,
  label: 'TocItem',
}

const data = createStore({
  entities: {
    ch1: { id: 'ch1', data: { label: 'Introduction', depth: 0, pageIndex: 0 } },
    ch2: { id: 'ch2', data: { label: 'Getting Started', depth: 0, pageIndex: 1 } },
    ch3: { id: 'ch3', data: { label: 'Installation', depth: 1, pageIndex: 2 } },
  },
  relationships: { [ROOT_ID]: ['ch1', 'ch2', 'ch3'] },
})

const renderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement =>
  TocItem(props, node, state)

export function Demo() {
  return <ListBox data={data} renderItem={renderItem} aria-label="Table of contents" />
}
`;export{e as default};