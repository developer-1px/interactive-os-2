import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { Grid } from '../../ui/Grid'
import { ax } from '@styles/ax'

// APG #26: Layout Grid
// https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/layout-grids/

const items = [
  'Home', 'About', 'Projects',
  'Contact', 'Blog', 'FAQ',
]

const columns = [
  { key: 'col-0', header: '' },
  { key: 'col-1', header: '' },
  { key: 'col-2', header: '' },
]

// Group items into rows of 3
const rowCount = Math.ceil(items.length / 3)
const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    Array.from({ length: rowCount }, (_, ri) => [
      `row-${ri}`,
      {
        id: `row-${ri}`,
        data: { cells: items.slice(ri * 3, ri * 3 + 3) },
      },
    ]),
  ),
  relationships: {
    [ROOT_ID]: Array.from({ length: rowCount }, (_, ri) => `row-${ri}`),
  },
})

const renderTile = (
  props: React.HTMLAttributes<HTMLElement>,
  value: unknown,
): React.ReactElement => {
  return (
    <div {...props} className={`${ax({ layout: 'row', textStyle: 'body', weight: 'semi', text: 'primary', shape: 'md', padding: 'md', content: 'text', surface: 'sunken', interactive: 'cell' })} justify-center outline-none`}>
      {String(value ?? '')}
    </div>
  )
}

export function GridLayout() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Grid
      data={store}
      columns={columns}
      plugins={[]}
      onChange={onChange}
      renderCell={renderTile}
      aria-label="Navigation"
    />
  )
}
