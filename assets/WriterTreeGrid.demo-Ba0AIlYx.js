import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { WriterTreeGrid } from './WriterTreeGrid'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'writer-tree-grid',
  category: 'ui',
  label: 'WriterTreeGrid',
}

const data: NormalizedData = createStore({
  entities: {
    h1: { id: 'h1', data: { label: 'Introduction', value: 'Introduction' } },
    p1: { id: 'p1', data: { label: 'Welcome to the editor.', value: 'Welcome to the editor.' } },
    h2: { id: 'h2', data: { label: 'Getting Started', value: 'Getting Started' } },
    p2: { id: 'p2', data: { label: 'Type here to begin writing.', value: 'Type here to begin writing.' } },
  },
  relationships: {
    [ROOT_ID]: ['h1', 'p1', 'h2', 'p2'],
  },
})

export function Demo() {
  return <WriterTreeGrid data={data} onChange={() => {}} aria-label="Document editor" />
}
`;export{t as n,n as t};