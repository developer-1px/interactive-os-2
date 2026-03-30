import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { Slider } from '../../ui/Slider'

// APG #49: Rating Slider
// https://www.w3.org/WAI/ARIA/apg/patterns/slider/examples/slider-rating/

const data: NormalizedData = createStore({
  entities: {
    rating: { id: 'rating', data: { label: 'Rating', value: 5 } },
  },
  relationships: { [ROOT_ID]: ['rating'] },
})

export function SliderRating() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Slider
      data={store}
      min={0}
      max={10}
      step={1}
      plugins={[]}
      onChange={onChange}
      aria-label="Rating"
    />
  )
}
