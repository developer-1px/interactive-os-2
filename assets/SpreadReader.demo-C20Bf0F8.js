import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { SpreadReader } from './SpreadReader'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'spread-reader',
  category: 'ui',
  label: 'SpreadReader',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'stack', gap: 'md' })}>
      <SpreadReader>
        <p>Spread readers display long-form content across horizontal pages. Swipe or use arrow keys to navigate between pages.</p>
        <p>Each page is sized to fit the container, making it comfortable to read without vertical scrolling.</p>
      </SpreadReader>
    </div>
  )
}
`;export{t as n,n as t};