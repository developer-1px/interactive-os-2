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
    intro: { id: 'intro', data: { label: 'Introduction', depth: 0, pageIndex: 0 } },
    setup: { id: 'setup', data: { label: 'Getting Started', depth: 1, pageIndex: 1 } },
    api: { id: 'api', data: { label: 'API Reference', depth: 1, pageIndex: 2 } },
    faq: { id: 'faq', data: { label: 'FAQ', depth: 0, pageIndex: 3 } },
  },
  relationships: { [ROOT_ID]: ['intro', 'setup', 'api', 'faq'] },
})

export function Demo() {
  return <TocNavList data={data} aria-label="Table of contents" />
}
