var e=`import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { Spinbutton as SpinbuttonUI } from '../../ui/Spinbutton'

// APG #53: Spin Button
// https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/examples/datepicker-spinbuttons/

const data: NormalizedData = createStore({
  entities: {
    quantity: { id: 'quantity', data: { label: 'Quantity', value: 1 } },
  },
  relationships: { [ROOT_ID]: ['quantity'] },
})

export function Spinbutton() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <SpinbuttonUI
      data={store}
      min={0}
      max={50}
      step={1}
      onChange={onChange}
      label="Quantity"
      aria-label="Quantity"
    />
  )
}
`;export{e as default};