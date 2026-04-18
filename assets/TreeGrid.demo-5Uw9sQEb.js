import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { TreeGrid } from './TreeGrid'
import type { NormalizedData } from '@os/store/types'
import { makeTreeGridData } from '../../pages/showcase/showcaseFixtures'

export const meta = {
  slug: 'tree-grid',
  category: 'ui',
  label: 'TreeGrid',
}

export function Demo() {
  const [data, setData] = useState<NormalizedData>(makeTreeGridData)

  return <TreeGrid data={data} onChange={setData} aria-label="File tree" />
}
`;export{t as n,n as t};