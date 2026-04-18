var e=`import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { EXPANDED_ID } from '../../axis/expand'
import { CheckboxMixed as CheckboxMixedUI } from '../../ui/CheckboxMixed'

// APG #10: Checkbox (Mixed-State)
// https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/examples/checkbox-mixed/

const data: NormalizedData = createStore({
  entities: {
    condiments: { id: 'condiments', data: { label: 'Sandwich Condiments' } },
    lettuce: { id: 'lettuce', data: { label: 'Lettuce' } },
    tomato: { id: 'tomato', data: { label: 'Tomato' } },
    mustard: { id: 'mustard', data: { label: 'Mustard' } },
    sprouts: { id: 'sprouts', data: { label: 'Sprouts' } },
    [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: ['condiments'] },
  },
  relationships: {
    [ROOT_ID]: ['condiments'],
    condiments: ['lettuce', 'tomato', 'mustard', 'sprouts'],
  },
})

export function CheckboxMixed() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <CheckboxMixedUI
      data={store}
      onChange={onChange}
      aria-label="Sandwich Condiments"
    />
  )
}
`;export{e as default};