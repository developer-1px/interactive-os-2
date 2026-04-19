/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import React from 'react'
import { Workspace } from './Workspace'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData, Entity } from '@os/store/types'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'workspace',
  category: 'ui',
  label: 'Workspace',
}

const initialData: NormalizedData = createStore({
  entities: {
    tg1: { id: 'tg1', data: { type: 'tabgroup', activeTabId: 'tab1' } },
    tab1: { id: 'tab1', data: { label: 'File A' } },
    tab2: { id: 'tab2', data: { label: 'File B' } },
    tab3: { id: 'tab3', data: { label: 'File C' } },
  },
  relationships: {
    [ROOT_ID]: ['tg1'],
    tg1: ['tab1', 'tab2', 'tab3'],
  },
})

function renderPanel(tab: Entity) {
  const label = (tab.data as Record<string, unknown>)?.label as string ?? tab.id
  return <div className={ax({ })}>Content of {label}</div>
}

export function Demo() {
  const [data, setData] = React.useState(initialData)
  return <Workspace data={data} onChange={setData} renderPanel={renderPanel} aria-label="Editor workspace" />
}
