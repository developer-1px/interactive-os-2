import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { TreeView } from './TreeView'
import type { NormalizedData } from '@os/store/types'
import { makeTreeViewData } from '../../pages/showcase/showcaseFixtures'

export const meta = {
  slug: 'tree-view',
  category: 'ui',
  label: 'TreeView',
}

export function Demo() {
  const [data, setData] = useState<NormalizedData>(makeTreeViewData)

  return <TreeView data={data} onChange={setData} aria-label="Project files" />
}
`;export{t as n,n as t};