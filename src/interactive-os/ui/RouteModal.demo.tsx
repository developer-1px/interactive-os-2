/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { RouteModal } from './RouteModal'
import { ax } from '@styles/ax'
import { Button } from './Button'

export const meta = {
  slug: 'route-modal',
  category: 'ui',
  label: 'RouteModal',
}

export function Demo() {
  const [open, setOpen] = useState(false)

  if (!open) {
    return <Button variant="ghost" onClick={() => setOpen(true)}>Open RouteModal</Button>
  }

  return (
    <RouteModal active label="Demo Modal">
      <div className={ax({ layout: 'center', padding: 'lg', text: 'primary', textStyle: 'body' })}>
        Modal content area
        <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
      </div>
    </RouteModal>
  )
}
