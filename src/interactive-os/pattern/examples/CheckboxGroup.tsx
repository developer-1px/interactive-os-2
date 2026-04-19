import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { Checkbox } from '../../ui/Checkbox'
import { ax } from '@styles/ax'

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
      className={`${ax({ role: 'item', layout: 'bar', textStyle: 'body', interactive: 'check' })} cursor-default`}
      data-focused={state.focused || undefined}
    >
      <span
        className={`${ax({ layout: 'center', textStyle: 'caption' })} inline-flex`}
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
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Checkbox
      data={store}
      onChange={onChange}
      renderItem={renderCheckbox}
      aria-label="Sandwich Condiments"
    />
  )
}
