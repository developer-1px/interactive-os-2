import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { table } from '../../pattern/roles/table'
import { EXPANDED_ID } from '../../axis/expand'
import styles from './table.module.css'

// APG #57: Table
// https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/table/

const students = [
  { name: 'Lily Peng', email: 'lily.peng@example.com', major: 'Computer Science', minor: 'Mathematics' },
  { name: 'Stacy Thompson', email: 'stacy.thompson@example.com', major: 'Music', minor: 'Physics' },
  { name: 'James Romsey', email: 'james.romsey@example.com', major: 'Chemistry', minor: 'Biology' },
]

const headerCells = ['Name', 'Email', 'Major', 'Minor']

const data: NormalizedData = createStore({
  entities: {
    // rowgroups
    'header-group': { id: 'header-group', data: { label: 'Header' } },
    'body-group': { id: 'body-group', data: { label: 'Body' } },
    // header row
    'header-row': { id: 'header-row', data: { label: 'Header Row' } },
    // header cells
    ...Object.fromEntries(
      headerCells.map((h, i) => [`header-cell-${i}`, { id: `header-cell-${i}`, data: { label: h, isHeader: true } }]),
    ),
    // body rows and cells
    ...Object.fromEntries(
      students.flatMap((s, ri) => [
        [`row-${ri}`, { id: `row-${ri}`, data: { label: s.name } }],
        [`cell-${ri}-0`, { id: `cell-${ri}-0`, data: { label: s.name } }],
        [`cell-${ri}-1`, { id: `cell-${ri}-1`, data: { label: s.email } }],
        [`cell-${ri}-2`, { id: `cell-${ri}-2`, data: { label: s.major } }],
        [`cell-${ri}-3`, { id: `cell-${ri}-3`, data: { label: s.minor } }],
      ]),
    ),
    [EXPANDED_ID]: {
      id: EXPANDED_ID,
      expandedIds: [
        'header-group', 'body-group',
        'header-row',
        ...students.map((_, ri) => `row-${ri}`),
      ],
    },
  },
  relationships: {
    [ROOT_ID]: ['header-group', 'body-group'],
    'header-group': ['header-row'],
    'header-row': headerCells.map((_, i) => `header-cell-${i}`),
    'body-group': students.map((_, ri) => `row-${ri}`),
    ...Object.fromEntries(
      students.map((_, ri) => [`row-${ri}`, [0, 1, 2, 3].map(ci => `cell-${ri}-${ci}`)]),
    ),
  },
})

const renderItem = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const nodeData = node.data as Record<string, unknown>
  const label = nodeData?.label as string
  const level = state.level ?? 1
  const isHeader = nodeData?.isHeader as boolean | undefined

  // level 1 = rowgroup, level 2 = row, level 3 = cell
  if (level === 1) {
    // rowgroup: invisible wrapper
    return <div {...props} className={styles.rowgroup} />
  }

  if (level === 2) {
    // row: grid row container
    return <div {...props} className={styles.row} />
  }

  // cell
  return (
    <div
      {...props}
      className={isHeader ? styles.headerCell : styles.cell}
    >
      {label}
    </div>
  )
}

export function Table() {
  const [store, setStore] = useState<NormalizedData>(data)
  const pattern = useMemo(() => table, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      pattern={pattern}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Students"
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
