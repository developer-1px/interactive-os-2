/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Slider } from './Slider'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'slider',
  category: 'ui',
  label: 'Slider',
}

const data: NormalizedData = createStore({
  entities: {
    volume: { id: 'volume', data: { label: 'Volume' } },
  },
  relationships: { [ROOT_ID]: ['volume'] },
})

export function Demo() {
  return <Slider data={data} min={0} max={100} step={1} onChange={() => {}} />
}
