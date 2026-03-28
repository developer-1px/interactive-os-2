import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { menu } from '../../pattern/roles/menu'
import styles from './menu.module.css'

// APG #43: Navigation Menu Button
// https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-links/

const items = [
  { id: 'w3c-home', label: 'W3C Home Page' },
  { id: 'w3c-spec', label: 'W3C Specification' },
  { id: 'aria-practices', label: 'ARIA Practices' },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    items.map(item => [item.id, { id: item.id, data: { label: item.label } }]),
  ),
  relationships: { [ROOT_ID]: items.map(item => item.id) },
})

const renderItem = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div
      {...props}
      className={styles.menuitem}
      data-focused={state.focused || undefined}
    >
      {label}
    </div>
  )
}

export function MenuNavigation() {
  const [store, setStore] = useState<NormalizedData>(data)
  const pattern = useMemo(() => menu, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      pattern={pattern}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Navigation"
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
