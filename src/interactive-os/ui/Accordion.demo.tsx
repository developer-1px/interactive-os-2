/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Accordion } from './Accordion'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'accordion',
  category: 'ui',
  label: 'Accordion',
}

const data: NormalizedData = createStore({
  entities: {
    q1: { id: 'q1', data: { label: 'How does the store work?' } },
    q2: { id: 'q2', data: { label: 'What are behaviors?' } },
    q3: { id: 'q3', data: { label: 'How do plugins extend axes?' } },
  },
  relationships: { [ROOT_ID]: ['q1', 'q2', 'q3'] },
})

export function Demo() {
  return <Accordion data={data} onChange={() => {}} aria-label="FAQ" />
}
