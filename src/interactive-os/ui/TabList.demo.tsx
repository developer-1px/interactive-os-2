/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { TabList } from './TabList'
import type { NormalizedData } from '@os/store/types'
import { makeTabListData } from '../../pages/showcase/showcaseFixtures'

export const meta = {
  slug: 'tab-list',
  category: 'ui',
  label: 'TabList',
}

export function Demo() {
  const [data, setData] = useState<NormalizedData>(makeTabListData)

  return <TabList data={data} onChange={setData} aria-label="Demo tabs" />
}
