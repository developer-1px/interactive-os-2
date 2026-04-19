/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import React from 'react'
import { TabGroup } from './TabGroup'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData, Entity } from '@os/store/types'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'tab-group',
  category: 'ui',
  label: 'TabGroup',
}

const data: NormalizedData = createStore({
  entities: {
    tg1: { id: 'tg1', data: { type: 'tabgroup', activeTabId: 'tab1' } },
    tab1: { id: 'tab1', data: { label: 'Overview' } },
    tab2: { id: 'tab2', data: { label: 'Details' } },
    tab3: { id: 'tab3', data: { label: 'Settings' } },
  },
  relationships: {
    [ROOT_ID]: ['tg1'],
    tg1: ['tab1', 'tab2', 'tab3'],
  },
})

function renderPanel(tab: Entity) {
  const label = (tab.data as Record<string, unknown>)?.label as string ?? tab.id
  return <div className={ax({ })}>{label} panel content</div>
}

export function Demo() {
  const [store, setStore] = React.useState(data)
  return (
    <TabGroup
      data={store}
      tabgroupId="tg1"
      onChange={setStore}
      renderPanel={renderPanel}
      aria-label="Demo tabs"
    />
  )
}
