/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { Spinbutton } from './Spinbutton'
import type { NormalizedData } from '@os/store/types'
import { makeSpinbuttonData } from '../../pages/showcase/showcaseFixtures'

export const meta = {
  slug: 'spinbutton',
  category: 'ui',
  label: 'Spinbutton',
}

export function Demo() {
  const [data, setData] = useState<NormalizedData>(makeSpinbuttonData)

  return <Spinbutton data={data} onChange={setData} min={0} max={99} step={1} label="Quantity" />
}
