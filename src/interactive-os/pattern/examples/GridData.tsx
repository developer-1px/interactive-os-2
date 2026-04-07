import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { Grid } from '../../ui/Grid'
import { ax } from '@styles/ax'

// APG #25: Data Grid
// https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/data-grids/

const rows = [
  { day: 'Monday', time: '10:00 AM', event: 'Staff Meeting' },
  { day: 'Tuesday', time: '2:00 PM', event: 'Design Review' },
  { day: 'Wednesday', time: '1:00 PM', event: 'Code Review' },
  { day: 'Thursday', time: '9:00 AM', event: 'All Hands' },
  { day: 'Friday', time: '3:00 PM', event: 'Sprint Retro' },
]

const columns = [
  { key: 'day', header: 'Day' },
  { key: 'time', header: 'Time' },
  { key: 'event', header: 'Event' },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    rows.map((row, ri) => [
      `row-${ri}`,
      { id: `row-${ri}`, data: { cells: [row.day, row.time, row.event] } },
    ]),
  ),
  relationships: { [ROOT_ID]: rows.map((_, ri) => `row-${ri}`) },
})

const renderCell = (
  props: React.HTMLAttributes<HTMLElement>,
  value: unknown,
): React.ReactElement => {
  return (
    <div {...props} className={`${ax({ layout: 'row', textStyle: 'body', text: 'primary', padding: 'xs', content: 'text', interactive: 'cell' })} outline-none cursor-default`}>
      {String(value ?? '')}
    </div>
  )
}

export function GridData() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Grid
      data={store}
      columns={columns}
      plugins={[]}
      onChange={onChange}
      renderCell={renderCell}
      header
      aria-label="Schedule"
    />
  )
}
