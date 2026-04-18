var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import React from 'react'
import type { NodeState } from '../../pattern/types'
import { TreeView } from '../TreeView'
import { WriterItem } from './WriterItem'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'

export const meta = {
  slug: 'writer-item',
  category: 'item' as const,
  label: 'WriterItem',
}

const data = createStore({
  entities: {
    doc: { id: 'doc', data: { type: 'document', path: 'essay.md' } },
    h1: { id: 'h1', data: { type: 'heading', level: 1, content: 'Introduction' } },
    p1: { id: 'p1', data: { type: 'paragraph', content: '' } },
    s1: { id: 's1', data: { type: 'sentence', content: 'This is a claim.', role: 'claim' } },
    s2: { id: 's2', data: { type: 'sentence', content: 'Supported by evidence.', role: 'evidence' } },
  },
  relationships: {
    [ROOT_ID]: ['doc'],
    doc: ['h1', 'p1'],
    p1: ['s1', 's2'],
  },
})

const renderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement =>
  WriterItem(props, node, state)

export function Demo() {
  return <TreeView data={data} renderItem={renderItem} aria-label="Writer outline" />
}
`;export{e as default};