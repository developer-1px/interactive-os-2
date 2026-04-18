import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useRef } from 'react'
import { StreamFeed } from './StreamFeed'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'stream-feed',
  category: 'ui',
  label: 'StreamFeed',
}

const items = [
  { id: '1', text: 'First message received' },
  { id: '2', text: 'Processing data...' },
  { id: '3', text: 'Analysis complete' },
]

export function Demo() {
  const feedRef = useRef<HTMLDivElement>(null)

  return (
    <div className={ax({ layout: 'stack', gap: 'md' })}>
      <StreamFeed
        items={items}
        feedRef={feedRef}
        renderItem={(item, _index, { isLatest }) => (
          <div key={item.id} className={ax({ padding: 'sm', text: isLatest ? 'primary' : 'secondary' })}>
            {item.text}
          </div>
        )}
      />
    </div>
  )
}
`;export{t as n,n as t};