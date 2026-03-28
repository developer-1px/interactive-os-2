import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { combobox } from '../../pattern/roles/combobox'
import styles from './combobox.module.css'

// APG #11: Select-Only Combobox
// https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/

const fruits = [
  { id: 'apple', label: 'Apple' },
  { id: 'banana', label: 'Banana' },
  { id: 'cherry', label: 'Cherry' },
  { id: 'date', label: 'Date' },
  { id: 'elderberry', label: 'Elderberry' },
  { id: 'fig', label: 'Fig' },
  { id: 'grape', label: 'Grape' },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    fruits.map(f => [f.id, { id: f.id, data: { label: f.label } }]),
  ),
  relationships: { [ROOT_ID]: fruits.map(f => f.id) },
})

const renderOption = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const nodeData = node.data as Record<string, unknown>
  const label = nodeData?.label as string

  return (
    <div
      {...props}
      className={styles.option}
      data-focused={state.focused || undefined}
      data-selected={state.selected || undefined}
    >
      {label}
    </div>
  )
}

export function ComboboxSelectOnly() {
  const [store, setStore] = useState<NormalizedData>(data)
  const pattern = useMemo(() => combobox(), [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      pattern={pattern}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Choose a Fruit"
    >
      <Aria.Item render={renderOption} />
    </Aria>
  )
}
