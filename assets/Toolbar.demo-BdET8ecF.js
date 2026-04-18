import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { Toolbar } from './Toolbar'
import type { NormalizedData } from '@os/store/types'
import { makeToolbarData } from '../../pages/showcase/showcaseFixtures'

export const meta = {
  slug: 'toolbar',
  category: 'ui',
  label: 'Toolbar',
}

export function Demo() {
  const [data, setData] = useState<NormalizedData>(makeToolbarData)

  return <Toolbar data={data} onChange={setData} aria-label="Formatting" />
}
`;export{t as n,n as t};