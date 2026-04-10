/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Checkbox } from './Checkbox'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'checkbox',
  category: 'ui',
  label: 'Checkbox',
}

const data: NormalizedData = createStore({
  entities: {
    terms: { id: 'terms', data: { label: 'Accept terms' } },
    newsletter: { id: 'newsletter', data: { label: 'Subscribe to newsletter' } },
    updates: { id: 'updates', data: { label: 'Receive product updates' } },
  },
  relationships: { [ROOT_ID]: ['terms', 'newsletter', 'updates'] },
})

export function Demo() {
  return <Checkbox data={data} onChange={() => {}} aria-label="Preferences" />
}
