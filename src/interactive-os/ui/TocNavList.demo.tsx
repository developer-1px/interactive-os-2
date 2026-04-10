/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { TocNavList } from './TocNavList'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'toc-nav-list',
  category: 'ui',
  label: 'TocNavList',
}

const data: NormalizedData = createStore({
  entities: {
    intro: { id: 'intro', data: { label: 'Introduction', level: 1 } },
    setup: { id: 'setup', data: { label: 'Getting Started', level: 2 } },
    api: { id: 'api', data: { label: 'API Reference', level: 2 } },
    faq: { id: 'faq', data: { label: 'FAQ', level: 1 } },
  },
  relationships: { [ROOT_ID]: ['intro', 'setup', 'api', 'faq'] },
})

export function Demo() {
  return <TocNavList data={data} aria-label="Table of contents" />
}
