/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Checkbox } from '../Checkbox'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'check-indicator',
  category: 'indicator' as const,
  label: 'CheckIndicator',
}

const data: NormalizedData = createStore({
  entities: {
    a: { id: 'a', data: { label: 'Unchecked' } },
    b: { id: 'b', data: { label: 'Checked' }, checked: true },
  },
  relationships: { [ROOT_ID]: ['a', 'b'] },
})

export function Demo() {
  return <Checkbox data={data} onChange={() => {}} aria-label="Check indicator demo" />
}
