import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { ListBoxGrouped } from '../../ui/ListBoxGrouped'
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
  children?: React.ReactNode,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string

  if (children) {
    const labelId = `group-label-${node.id}`
    return (
      <ul {...props} aria-labelledby={labelId} className={styles.groupOptions}>
        <li role="presentation" id={labelId} className={styles.groupLabel}>
          {label}
        </li>
        {children}
      </ul>
    )
  }

  return (
    <li
      {...props}
      className={styles.option}
      data-focused={state.focused || undefined}
    >
      {label}
    </li>
  )
}

export function ListboxGrouped() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <ListBoxGrouped
      data={store}
      plugins={[]}
      onChange={onChange}
      renderItem={renderItem}
      aria-label="Choose your animal sidekick"
    />
  )
}
