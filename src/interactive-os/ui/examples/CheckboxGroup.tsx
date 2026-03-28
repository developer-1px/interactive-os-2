import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { checkbox } from '../../pattern/roles/checkbox'
import styles from './checkbox.module.css'

// APG #9: Checkbox (Two State)
// https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/examples/checkbox/

const condiments = [
  { id: 'lettuce', label: 'Lettuce' },
  { id: 'tomato', label: 'Tomato' },
  { id: 'mustard', label: 'Mustard' },
  { id: 'sprouts', label: 'Sprouts' },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    condiments.map(c => [c.id, { id: c.id, data: { label: c.label } }]),
  ),
  relationships: { [ROOT_ID]: condiments.map(c => c.id) },
})

const renderCheckbox = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div
      {...props}
      className={styles.checkbox}
      data-focused={state.focused || undefined}
    >
      <span
        className={styles.checkIndicator}
        data-checked={state.checked || undefined}
        aria-hidden="true"
      >
        {state.checked ? '\u2713' : ''}
      </span>
      {label}
    </div>
  )
}

export function CheckboxGroup() {
  const [store, setStore] = useState<NormalizedData>(data)
  const behavior = useMemo(() => checkbox, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      behavior={behavior}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Sandwich Condiments"
    >
      <Aria.Item render={renderCheckbox} />
    </Aria>
  )
}
