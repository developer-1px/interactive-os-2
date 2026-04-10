/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { ToggleGroup } from './ToggleGroup'
import type { NormalizedData } from '@os/store/types'
import { makeToggleGroupData } from '../../pages/showcase/showcaseFixtures'

export const meta = {
  slug: 'toggle-group',
  category: 'ui',
  label: 'ToggleGroup',
}

export function Demo() {
  const [data, setData] = useState<NormalizedData>(makeToggleGroupData)

  return <ToggleGroup data={data} onChange={setData} />
}
