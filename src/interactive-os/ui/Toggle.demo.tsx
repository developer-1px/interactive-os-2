/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { Toggle } from './Toggle'
import type { NormalizedData } from '@os/store/types'
import { makeToggleData } from '../../pages/showcase/showcaseFixtures'

export const meta = {
  slug: 'toggle',
  category: 'ui',
  label: 'Toggle',
}

export function Demo() {
  const [data, setData] = useState<NormalizedData>(makeToggleData)

  return <Toggle data={data} onChange={setData} />
}
