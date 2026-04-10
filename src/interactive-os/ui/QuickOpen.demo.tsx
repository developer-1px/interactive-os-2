/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { QuickOpen } from './QuickOpen'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { ax } from '@styles/ax'
import { Button } from './Button'

export const meta = {
  slug: 'quick-open',
  category: 'ui',
  label: 'QuickOpen',
}

const items: NormalizedData = createStore({
  entities: {
    cmd1: { id: 'cmd1', data: { label: 'Open File' } },
    cmd2: { id: 'cmd2', data: { label: 'Go to Symbol' } },
    cmd3: { id: 'cmd3', data: { label: 'Run Task' } },
    cmd4: { id: 'cmd4', data: { label: 'Toggle Terminal' } },
  },
  relationships: { [ROOT_ID]: ['cmd1', 'cmd2', 'cmd3', 'cmd4'] },
})

export function Demo() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Open QuickOpen
      </Button>
    )
  }

  return (
    <div className={ax({ width: 'full' })}>
      <QuickOpen
        data={items}
        query={query}
        onQueryChange={setQuery}
        onActivate={() => {}}
        onClose={() => setOpen(false)}
        placeholder="Type a command..."
        aria-label="Command Palette"
      />
    </div>
  )
}
