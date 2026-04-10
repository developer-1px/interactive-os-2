/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { TreeItem } from './TreeItem'
import { TreeView } from '../TreeView'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'

export const meta = {
  slug: 'tree-item',
  category: 'item' as const,
  label: 'TreeItem',
}

const data = createStore({
  entities: {
    'folder-1': { id: 'folder-1', data: { label: 'src' } },
    'file-1': { id: 'file-1', data: { label: 'index.ts' } },
    'file-2': { id: 'file-2', data: { label: 'App.tsx' } },
    'folder-2': { id: 'folder-2', data: { label: 'utils' } },
    'file-3': { id: 'file-3', data: { label: 'helpers.ts' } },
  },
  relationships: {
    [ROOT_ID]: ['folder-1', 'folder-2'],
    'folder-1': ['file-1', 'file-2'],
    'folder-2': ['file-3'],
  },
})

const renderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState) =>
  TreeItem(props, node, state)

export function Demo() {
  return <TreeView data={data} renderItem={renderItem} aria-label="Tree item demo" />
}
