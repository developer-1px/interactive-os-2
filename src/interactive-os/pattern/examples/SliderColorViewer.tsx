import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { Slider } from '../../ui/Slider'

// APG #48: Color Viewer Slider
// https://www.w3.org/WAI/ARIA/apg/patterns/slider/examples/slider-color-viewer/

const channels = [
  { id: 'red', label: 'Red', value: 128 },
  { id: 'green', label: 'Green', value: 128 },
  { id: 'blue', label: 'Blue', value: 128 },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    channels.map(c => [c.id, { id: c.id, data: { label: c.label, value: c.value } }]),
  ),
  relationships: { [ROOT_ID]: channels.map(c => c.id) },
})

export function SliderColorViewer() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Slider
      data={store}
      min={0}
      max={255}
      step={1}
      plugins={[]}
      onChange={onChange}
      aria-label="Color Viewer"
    />
  )
}
