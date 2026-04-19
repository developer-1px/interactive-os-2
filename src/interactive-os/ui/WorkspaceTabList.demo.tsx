/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { WorkspaceTabList } from './WorkspaceTabList'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'viewer-tab-list',
  category: 'ui',
  label: 'WorkspaceTabList',
}

const initialData: NormalizedData = createStore({
  entities: {
    code: { id: 'code', data: { label: 'Code', icon: 'file' } },
    preview: { id: 'preview', data: { label: 'Preview', icon: 'eye' } },
    terminal: { id: 'terminal', data: { label: 'Terminal', icon: 'terminal' } },
  },
  relationships: { [ROOT_ID]: ['code', 'preview', 'terminal'] },
})

export function Demo() {
  const [data, setData] = useState<NormalizedData>(initialData)

  return <WorkspaceTabList data={data} onChange={setData} aria-label="Viewer tabs" />
}
