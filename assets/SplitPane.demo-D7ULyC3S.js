import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import React from 'react'
import { SplitPane } from './SplitPane'
import type { PaneSize } from './SplitPane'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'split-pane',
  category: 'ui',
  label: 'SplitPane',
}

export function Demo() {
  const [sizes, setSizes] = React.useState<PaneSize[]>([0.3, 'flex'])
  return (
    <div className={ax({ layout: 'fill' })} data-full-height>
      <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes}>
        <div className={ax({ padding: 'md' })}>Left pane</div>
        <div className={ax({ padding: 'md' })}>Right pane</div>
      </SplitPane>
    </div>
  )
}
`;export{t as n,n as t};