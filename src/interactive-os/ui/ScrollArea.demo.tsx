/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ScrollArea } from './ScrollArea'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'scroll-area',
  category: 'ui',
  label: 'ScrollArea',
}

export function Demo() {
  return (
    <ScrollArea>
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} className={ax({ padding: 'sm', text: 'secondary', textStyle: 'body' })}>
          Row {i + 1}
        </div>
      ))}
    </ScrollArea>
  )
}
