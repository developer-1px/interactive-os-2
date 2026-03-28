import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { buttonToggle } from '../../pattern/roles/buttonToggle'
import styles from './button.module.css'

// APG #5: Button (Toggle)
// https://www.w3.org/WAI/ARIA/apg/patterns/button/examples/button/

const buttons = [
  { id: 'mute', label: 'Mute' },
  { id: 'pause', label: 'Pause' },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    buttons.map(b => [b.id, { id: b.id, data: { label: b.label } }]),
  ),
  relationships: { [ROOT_ID]: buttons.map(b => b.id) },
})

const renderButton = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div
      {...props}
      className={styles.toggleButton}
      data-focused={state.focused || undefined}
      data-pressed={state.checked || undefined}
    >
      {label}
    </div>
  )
}

export function ButtonToggle() {
  const [store, setStore] = useState<NormalizedData>(data)
  const behavior = useMemo(() => buttonToggle, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      behavior={behavior}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Media Controls"
    >
      <Aria.Item render={renderButton} />
    </Aria>
  )
}
