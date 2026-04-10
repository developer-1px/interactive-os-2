/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Kanban } from './Kanban'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'kanban',
  category: 'ui',
  label: 'Kanban',
}

const data: NormalizedData = createStore({
  entities: {
    todo: { id: 'todo', data: { title: 'To Do' } },
    doing: { id: 'doing', data: { title: 'In Progress' } },
    done: { id: 'done', data: { title: 'Done' } },
    t1: { id: 't1', data: { title: 'Migrate auth to OAuth 2.1' } },
    t2: { id: 't2', data: { title: 'Add rate limiting middleware' } },
    t3: { id: 't3', data: { title: 'Implement SSE for notifications' } },
    t4: { id: 't4', data: { title: 'Deploy v2.4.1' } },
  },
  relationships: {
    [ROOT_ID]: ['todo', 'doing', 'done'],
    todo: ['t1', 't2'],
    doing: ['t3'],
    done: ['t4'],
  },
})

export function Demo() {
  return <Kanban data={data} onChange={() => {}} aria-label="Project Board" />
}
