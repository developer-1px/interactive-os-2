/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { DisclosureGroup } from './DisclosureGroup'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'disclosure-group',
  category: 'ui',
  label: 'DisclosureGroup',
}

const data: NormalizedData = createStore({
  entities: {
    general: { id: 'general', data: { label: 'General Settings' } },
    appearance: { id: 'appearance', data: { label: 'Appearance' } },
    keyboard: { id: 'keyboard', data: { label: 'Keyboard Shortcuts' } },
  },
  relationships: { [ROOT_ID]: ['general', 'appearance', 'keyboard'] },
})

export function Demo() {
  return <DisclosureGroup data={data} onChange={() => {}} aria-label="Settings" />
}
