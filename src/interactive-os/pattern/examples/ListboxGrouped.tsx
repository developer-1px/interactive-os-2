import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { listboxGrouped } from '../../pattern/roles/listboxGrouped'
import styles from './listbox.module.css'

// APG #38: Listbox with Grouped Options — "Choose your animal sidekick"
// https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-grouped/

const groups = [
  { id: 'land', label: 'Land', children: ['Cat', 'Dog', 'Tiger', 'Reindeer', 'Raccoon'] },
  { id: 'water', label: 'Water', children: ['Dolphin', 'Flounder', 'Eel'] },
  { id: 'air', label: 'Air', children: ['Falcon', 'Winged Horse', 'Owl'] },
]

const data: NormalizedData = createStore({
  entities: {
    ...Object.fromEntries(
      groups.map(g => [g.id, { id: g.id, data: { label: g.label } }]),
    ),
    ...Object.fromEntries(
      groups.flatMap(g =>
        g.children.map(c => {
          const id = c.toLowerCase().replace(/\s+/g, '-')
          return [id, { id, data: { label: c } }]
        }),
      ),
    ),
  },
  relationships: {
    [ROOT_ID]: groups.map(g => g.id),
    ...Object.fromEntries(
      groups.map(g => [
        g.id,
        g.children.map(c => c.toLowerCase().replace(/\s+/g, '-')),
      ]),
    ),
  },
})

const renderItem = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  const isGroup = (state.level ?? 1) === 1

  if (isGroup) {
    return (
      <div {...props} className={styles.groupLabel}>
        {label}
      </div>
    )
  }

  return (
    <div
      {...props}
      className={styles.option}
      data-focused={state.focused || undefined}
    >
      {label}
    </div>
  )
}

export function ListboxGrouped() {
  const [store, setStore] = useState<NormalizedData>(data)
  const pattern = useMemo(() => listboxGrouped, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      pattern={pattern}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Choose your animal sidekick"
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
