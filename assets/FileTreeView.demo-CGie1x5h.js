import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
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
    src: { id: 'src', data: { name: 'src', type: 'directory' } },
    index: { id: 'index', data: { name: 'index.ts', type: 'file' } },
    app: { id: 'app', data: { name: 'App.tsx', type: 'file' } },
    docs: { id: 'docs', data: { name: 'docs', type: 'directory' } },
    readme: { id: 'readme', data: { name: 'README.md', type: 'file' } },
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
`;export{t as n,n as t};