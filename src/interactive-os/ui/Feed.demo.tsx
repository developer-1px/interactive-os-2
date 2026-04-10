/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Feed } from './Feed'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'feed',
  category: 'ui',
  label: 'Feed',
}

const data: NormalizedData = createStore({
  entities: {
    post1: { id: 'post1', data: { label: 'First post in the feed' } },
    post2: { id: 'post2', data: { label: 'Second post with more content' } },
    post3: { id: 'post3', data: { label: 'Third post at the bottom' } },
    post4: { id: 'post4', data: { label: 'Fourth post, keep scrolling' } },
  },
  relationships: {
    [ROOT_ID]: ['post1', 'post2', 'post3', 'post4'],
  },
})

export function Demo() {
  return <Feed data={data} onChange={() => {}} aria-label="News feed" />
}
