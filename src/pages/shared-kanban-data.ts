import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'

export const kanbanInitialData = createStore({
  entities: {
    '__expanded__': { id: '__expanded__', expandedIds: ['col-todo', 'col-progress', 'col-review', 'col-done'] },
    'col-todo':     { id: 'col-todo',     data: { title: 'To Do' } },
    'col-progress': { id: 'col-progress', data: { title: 'In Progress' } },
    'col-review':   { id: 'col-review',   data: { title: 'Review' } },
    'col-done':     { id: 'col-done',     data: { title: 'Done' } },
    'card-1':  { id: 'card-1',  data: { title: 'Set up project scaffolding' } },
    'card-2':  { id: 'card-2',  data: { title: 'Design data model' } },
    'card-3':  { id: 'card-3',  data: { title: 'Write API endpoints' } },
    'card-4':  { id: 'card-4',  data: { title: 'Implement auth flow' } },
    'card-5':  { id: 'card-5',  data: { title: 'Build dashboard UI' } },
    'card-6':  { id: 'card-6',  data: { title: 'Add keyboard shortcuts' } },
    'card-7':  { id: 'card-7',  data: { title: 'Write integration tests' } },
    'card-8':  { id: 'card-8',  data: { title: 'Deploy staging environment' } },
    'card-9':  { id: 'card-9',  data: { title: 'Review accessibility audit' } },
    'card-10': { id: 'card-10', data: { title: 'Update documentation' } },
  },
  relationships: {
    [ROOT_ID]: ['col-todo', 'col-progress', 'col-review', 'col-done'],
    'col-todo':     ['card-1', 'card-2', 'card-3'],
    'col-progress': ['card-4', 'card-5'],
    'col-review':   ['card-6', 'card-7'],
    'col-done':     ['card-8', 'card-9', 'card-10'],
  },
})
