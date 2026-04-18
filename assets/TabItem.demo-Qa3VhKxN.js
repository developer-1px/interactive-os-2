var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { TabList } from '../TabList'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'

export const meta = {
  slug: 'tab-item',
  category: 'item' as const,
  label: 'TabItem',
}

const data = createStore({
  entities: {
    tab1: { id: 'tab1', data: { label: 'Overview' } },
    tab2: { id: 'tab2', data: { label: 'Details' } },
    tab3: { id: 'tab3', data: { label: 'Settings' } },
  },
  relationships: { [ROOT_ID]: ['tab1', 'tab2', 'tab3'] },
})

export function Demo() {
  return <TabList data={data} aria-label="Demo tabs" />
}
`;export{e as default};