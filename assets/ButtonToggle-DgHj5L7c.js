var e=`import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { ButtonToggle as ButtonToggleUI } from '../../ui/ButtonToggle'

// APG #5: Button (Toggle)
// https://www.w3.org/WAI/ARIA/apg/patterns/button/examples/button/

const buttons = [
  { id: 'mute', label: 'Mute' },
  { id: 'pause', label: 'Pause' },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    buttons.map(b => [b.id, { id: b.id, data: { label: b.label } }]),
  ),
  relationships: { [ROOT_ID]: buttons.map(b => b.id) },
})

export function ButtonToggle() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <ButtonToggleUI
      data={store}
      onChange={onChange}
      aria-label="Media Controls"
    />
  )
}
`;export{e as default};