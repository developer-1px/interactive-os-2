import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { RadioGroup as RadioGroupUI } from '../../ui/RadioGroup'
import { ax } from '@styles/ax'

// APG #45: Radio Group Using Roving tabindex
// https://www.w3.org/WAI/ARIA/apg/patterns/radio/examples/radio/

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
      className={`${ax({ layout: 'row', gap: 'sm', textStyle: 'body', text: 'primary', padding: 'xs', content: 'text', interactive: 'item' })} items-center cursor-default`}
      data-focused={state.focused || undefined}
    >
      <span
        className={`${ax({ shape: 'pill', size: 'md', interactive: 'check' })} inline-flex items-center justify-center`}
        data-checked={state.selected || undefined}
        aria-hidden="true"
      />
      {label}
    </div>
  )
}

export function RadioGroup() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <RadioGroupUI
      data={store}
      onChange={onChange}
      renderItem={renderRadio}
      aria-label="Pizza Crust"
    />
  )
}
