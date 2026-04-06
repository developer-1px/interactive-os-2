import { useState } from 'react'
import { Up, Down, Left, Right } from '../shared/kbdIcons'
import { Grid } from '@os/ui/Grid'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

const gridData = createStore({
  entities: {
    r1: { id: 'r1', data: { name: 'Button', role: 'button', focusable: 'Yes' } },
    r2: { id: 'r2', data: { name: 'Link', role: 'link', focusable: 'Yes' } },
    r3: { id: 'r3', data: { name: 'Heading', role: 'heading', focusable: 'No' } },
    r4: { id: 'r4', data: { name: 'List', role: 'list', focusable: 'No' } },
    r5: { id: 'r5', data: { name: 'Dialog', role: 'dialog', focusable: 'Yes' } },
  },
  relationships: {
    [ROOT_ID]: ['r1', 'r2', 'r3', 'r4', 'r5'],
  },
})

const columns = [
  { key: 'name', header: 'Element' },
  { key: 'role', header: 'Role' },
  { key: 'focusable', header: 'Focusable' },
]

export default function CellGridDemo() {
  const [data, setData] = useState<NormalizedData>(gridData)

  return (
    <>
      <div className="page-keys inline-flex flex-wrap items-center">
        <kbd><Up /><Down /></kbd> <span className="key-hint">row</span>{' '}
        <kbd><Left /><Right /></kbd> <span className="key-hint">cell</span>{' '}
        <kbd>Home</kbd> <span className="key-hint">first cell</span>{' '}
        <kbd>End</kbd> <span className="key-hint">last cell</span>
      </div>
      <div className="card overflow-hidden">
        <Grid
          data={data}
          columns={columns}
          plugins={[]}
          onChange={setData}
          header
          aria-label="ARIA elements"
        />
      </div>
    </>
  )
}
