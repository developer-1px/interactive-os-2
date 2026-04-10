/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { NavList } from './NavList'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'nav-list',
  category: 'ui',
  label: 'NavList',
}

const data: NormalizedData = createStore({
  entities: {
    home: { id: 'home', data: { label: 'Home' } },
    projects: { id: 'projects', data: { label: 'Projects' } },
    members: { id: 'members', data: { label: 'Members' } },
    settings: { id: 'settings', data: { label: 'Settings' } },
  },
  relationships: {
    [ROOT_ID]: ['home', 'projects', 'members', 'settings'],
  },
})

export function Demo() {
  return <NavList data={data} onChange={() => {}} aria-label="Navigation" />
}
