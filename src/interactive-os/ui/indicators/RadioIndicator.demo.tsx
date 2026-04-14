/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { RadioGroup } from '../RadioGroup'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'radio-indicator',
  category: 'indicator' as const,
  label: 'RadioIndicator',
}

const data: NormalizedData = createStore({
  entities: {
    a: { id: 'a', data: { label: 'Option A' } },
    b: { id: 'b', data: { label: 'Option B' } },
  },
  relationships: { [ROOT_ID]: ['a', 'b'] },
})

export function Demo() {
  return <RadioGroup data={data} onChange={() => {}} aria-label="Radio indicator demo" />
}
