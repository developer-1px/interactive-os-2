/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { MillerColumns } from './MillerColumns'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'miller-columns',
  category: 'ui',
  label: 'MillerColumns',
}

const data: NormalizedData = createStore({
  entities: {
    docs: { id: 'docs', data: { name: 'docs', type: 'folder' } },
    src: { id: 'src', data: { name: 'src', type: 'folder' } },
    readme: { id: 'readme', data: { name: 'README.md', type: 'file' } },
    guide: { id: 'guide', data: { name: 'guide.md', type: 'file' } },
    app: { id: 'app', data: { name: 'App.tsx', type: 'file' } },
  },
  relationships: {
    [ROOT_ID]: ['docs', 'src'],
    docs: ['readme', 'guide'],
    src: ['app'],
  },
})

export function Demo() {
  return <MillerColumns data={data} onChange={() => {}} aria-label="File Browser" />
}
