import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { grid } from '../../pattern/roles/grid'
import styles from './grid.module.css'

// APG #25: Data Grid
// https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/data-grids/

const rows = [
  { day: 'Monday', time: '10:00 AM', event: 'Staff Meeting' },
  { day: 'Tuesday', time: '2:00 PM', event: 'Design Review' },
  { day: 'Wednesday', time: '1:00 PM', event: 'Code Review' },
  { day: 'Thursday', time: '9:00 AM', event: 'All Hands' },
  { day: 'Friday', time: '3:00 PM', event: 'Sprint Retro' },
]

const columns = 3

const cells = rows.flatMap((row, ri) => [
  { id: `cell-${ri}-0`, label: row.day },
  { id: `cell-${ri}-1`, label: row.time },
  { id: `cell-${ri}-2`, label: row.event },
])

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    cells.map(c => [c.id, { id: c.id, data: { label: c.label } }]),
  ),
  relationships: { [ROOT_ID]: cells.map(c => c.id) },
})

const renderCell = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div
      {...props}
      className={styles.cell}
      data-focused={state.focused || undefined}
    >
      {label}
    </div>
  )
}

export function GridData() {
  const [store, setStore] = useState<NormalizedData>(data)
  const behavior = useMemo(() => grid({ columns }), [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      behavior={behavior}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Schedule"
    >
      <Aria.Item render={renderCell} />
    </Aria>
  )
}
