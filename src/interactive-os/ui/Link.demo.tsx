/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Link } from './Link'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'

export const meta = {
  slug: 'link',
  category: 'ui' as const,
  label: 'Link',
}

const data = createStore({
  entities: {
    'link-1': { id: 'link-1', data: { label: 'Home' } },
    'link-2': { id: 'link-2', data: { label: 'About' } },
    'link-3': { id: 'link-3', data: { label: 'Contact' } },
  },
  relationships: { [ROOT_ID]: ['link-1', 'link-2', 'link-3'] },
})

export function Demo() {
  return <Link data={data} aria-label="Navigation links" />
}
