/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { TreeView } from '../TreeView'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'

export const meta = {
  slug: 'editable-tree-item',
  category: 'item' as const,
  label: 'EditableTreeItem',
}

const data = createStore({
  entities: {
    folder: { id: 'folder', data: { label: 'Folder' } },
    child1: { id: 'child1', data: { label: 'Child 1' } },
    child2: { id: 'child2', data: { label: 'Child 2' } },
  },
  relationships: {
    [ROOT_ID]: ['folder'],
    folder: ['child1', 'child2'],
  },
})

export function Demo() {
  return <TreeView data={data} aria-label="Editable tree" />
}
