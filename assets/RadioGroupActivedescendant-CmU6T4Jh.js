var e=`import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { RadioGroupActivedescendant as RadioGroupActivedescendantUI } from '../../ui/RadioGroupActivedescendant'

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

export function RadioGroupActivedescendant() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <RadioGroupActivedescendantUI
      data={store}
      onChange={onChange}
      aria-label="Pizza Crust"
    />
  )
}
`;export{e as default};