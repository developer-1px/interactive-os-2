/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { CheckboxMixed } from './CheckboxMixed'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'checkbox-mixed',
  category: 'ui',
  label: 'CheckboxMixed',
}

const data: NormalizedData = createStore({
  entities: {
    all: { id: 'all', data: { label: 'Select All' } },
    opt1: { id: 'opt1', data: { label: 'Option A' } },
    opt2: { id: 'opt2', data: { label: 'Option B' } },
    opt3: { id: 'opt3', data: { label: 'Option C' } },
  },
  relationships: {
    [ROOT_ID]: ['all'],
    all: ['opt1', 'opt2', 'opt3'],
  },
})

export function Demo() {
  return <CheckboxMixed data={data} onChange={() => {}} aria-label="Permissions" />
}
