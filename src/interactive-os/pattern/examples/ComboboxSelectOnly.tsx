import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { Combobox } from '../../ui/Combobox'
import { ax } from '../../../../styles/ax'
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
      className={`${styles.option} ${ax({ textStyle: 'body', text: 'primary' })} flex-row items-center cursor-default`}
      data-focused={state.focused || undefined}
      data-selected={state.selected || undefined}
    >
      {label}
    </div>
  )
}

export function ComboboxSelectOnly() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Combobox
      data={store}
      onChange={onChange}
      renderItem={renderOption}
      plugins={[]}
      aria-label="Choose a Fruit"
    />
  )
}
