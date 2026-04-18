var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { SwitchGroup } from '../SwitchGroup'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'switch-indicator',
  category: 'indicator' as const,
  label: 'SwitchIndicator',
}

const data: NormalizedData = createStore({
  entities: {
    a: { id: 'a', data: { label: 'Off' } },
    b: { id: 'b', data: { label: 'On' }, checked: true },
  },
  relationships: { [ROOT_ID]: ['a', 'b'] },
})

export function Demo() {
  return <SwitchGroup data={data} onChange={() => {}} aria-label="Switch indicator demo" />
}
`;export{e as default};