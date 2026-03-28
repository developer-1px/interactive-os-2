import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { radiogroupActivedescendant } from '../../pattern/roles/radiogroupActivedescendant'
import styles from './radiogroup.module.css'

// APG #46: Radio Group Using aria-activedescendant
// https://www.w3.org/WAI/ARIA/apg/patterns/radio/examples/radio-activedescendant/

const options = [
  { id: 'regular', label: 'Regular crust' },
  { id: 'deep-dish', label: 'Deep dish' },
  { id: 'thin', label: 'Thin crust' },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    options.map(o => [o.id, { id: o.id, data: { label: o.label } }]),
  ),
  relationships: { [ROOT_ID]: options.map(o => o.id) },
})

const renderRadio = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div
      {...props}
      className={styles.radio}
      data-focused={state.focused || undefined}
    >
      <span
        className={styles.indicator}
        data-checked={state.selected || undefined}
        aria-hidden="true"
      />
      {label}
    </div>
  )
}

export function RadioGroupActivedescendant() {
  const [store, setStore] = useState<NormalizedData>(data)
  const behavior = useMemo(() => radiogroupActivedescendant, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      behavior={behavior}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Pizza Crust"
    >
      <Aria.Item render={renderRadio} />
    </Aria>
  )
}
