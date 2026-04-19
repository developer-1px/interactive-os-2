/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useRef } from 'react'
import { SelectionOverlay } from './SelectionOverlay'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'selection-overlay',
  category: 'ui',
  label: 'SelectionOverlay',
}

export function Demo() {
  const containerRef = useRef<HTMLDivElement>(null)
  return (
    <div ref={containerRef} className={ax({ layout: 'stack', placement: 'relative' })}>
      <div data-node-id="a" className={ax({ })}>Item A</div>
      <div data-node-id="b" className={ax({ })}>Item B</div>
      <div data-node-id="c" className={ax({ })}>Item C</div>
      <SelectionOverlay containerRef={containerRef} focusedId="a" selectedIds={['a', 'b']} />
    </div>
  )
}
