var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { FileTreeView } from '../FileTreeView'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'

export const meta = {
  slug: 'file-tree-item',
  category: 'item' as const,
  label: 'FileTreeItem',
}

const data = createStore({
  entities: {
    src: { id: 'src', data: { name: 'src', type: 'directory', path: '/src' } },
    index: { id: 'index', data: { name: 'index.tsx', type: 'file', path: '/src/index.tsx' } },
    readme: { id: 'readme', data: { name: 'README.md', type: 'file', path: '/README.md' } },
  },
  relationships: {
    [ROOT_ID]: ['src', 'readme'],
    src: ['index'],
  },
})

export function Demo() {
  return <FileTreeView data={data} aria-label="File tree" />
}
`;export{e as default};