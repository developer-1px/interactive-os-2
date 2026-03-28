import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { grid } from '../../pattern/roles/grid'
import styles from './grid.module.css'

// APG #26: Layout Grid
// https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/layout-grids/

const items = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
  { id: 'blog', label: 'Blog' },
  { id: 'faq', label: 'FAQ' },
]

const columns = 3

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    items.map(it => [it.id, { id: it.id, data: { label: it.label } }]),
  ),
  relationships: { [ROOT_ID]: items.map(it => it.id) },
})

const renderTile = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div
      {...props}
      className={styles.tile}
      data-focused={state.focused || undefined}
    >
      {label}
    </div>
  )
}

export function GridLayout() {
  const [store, setStore] = useState<NormalizedData>(data)
  const behavior = useMemo(() => grid({ columns }), [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      behavior={behavior}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Navigation"
    >
      <Aria.Item render={renderTile} />
    </Aria>
  )
}
