/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ButtonToggle } from './ButtonToggle'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'button-toggle',
  category: 'ui',
  label: 'ButtonToggle',
}

const data: NormalizedData = createStore({
  entities: {
    mute: { id: 'mute', data: { label: 'Mute' } },
  },
  relationships: {
    [ROOT_ID]: ['mute'],
  },
})

export function Demo() {
  return <ButtonToggle data={data} onChange={() => {}} aria-label="Toggle mute" />
}
