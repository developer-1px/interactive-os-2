import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { spinbutton } from '../../pattern/roles/spinbutton'
import styles from './spinbutton.module.css'

// APG #53: Spin Button
// https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/examples/datepicker-spinbuttons/

const data: NormalizedData = createStore({
  entities: {
    quantity: { id: 'quantity', data: { label: 'Quantity', value: 1 } },
  },
  relationships: { [ROOT_ID]: ['quantity'] },
})

const renderSpinbutton = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const nodeData = node.data as Record<string, unknown>
  const label = nodeData?.label as string
  const current = (state.valueCurrent as number) ?? 1

  return (
    <div
      {...props}
      className={styles.spinbutton}
      data-focused={state.focused || undefined}
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{current}</span>
    </div>
  )
}

export function Spinbutton() {
  const [store, setStore] = useState<NormalizedData>(data)
  const pattern = useMemo(() => spinbutton({ min: 0, max: 50, step: 1 }), [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      pattern={pattern}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Quantity"
    >
      <Aria.Item render={renderSpinbutton} />
    </Aria>
  )
}
