/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { SwitchGroup } from './SwitchGroup'
import type { NormalizedData } from '@os/store/types'
import { makeSwitchGroupData } from '../../pages/showcase/showcaseFixtures'

export const meta = {
  slug: 'switch-group',
  category: 'ui',
  label: 'SwitchGroup',
}

export function Demo() {
  const [data, setData] = useState<NormalizedData>(makeSwitchGroupData)

  return <SwitchGroup data={data} onChange={setData} aria-label="Settings" />
}
