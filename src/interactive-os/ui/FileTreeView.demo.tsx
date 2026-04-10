/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { FileTreeView } from './FileTreeView'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'file-tree-view',
  category: 'ui',
  label: 'FileTreeView',
}

const data: NormalizedData = createStore({
  entities: {
    src: { id: 'src', data: { label: 'src', type: 'directory' } },
    index: { id: 'index', data: { label: 'index.ts', type: 'file' } },
    app: { id: 'app', data: { label: 'App.tsx', type: 'file' } },
    docs: { id: 'docs', data: { label: 'docs', type: 'directory' } },
    readme: { id: 'readme', data: { label: 'README.md', type: 'file' } },
  },
  relationships: {
    [ROOT_ID]: ['src', 'docs'],
    src: ['index', 'app'],
    docs: ['readme'],
  },
})

export function Demo() {
  return <FileTreeView data={data} onChange={() => {}} aria-label="File explorer" />
}
