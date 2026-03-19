import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'

export const gridColumns = [
  { key: 'name', header: 'Name' },
  { key: 'age', header: 'Age' },
  { key: 'email', header: 'Email' },
  { key: 'department', header: 'Department' },
]

export const gridInitialData = createStore({
  entities: {
    'row-1': { id: 'row-1', data: { cells: ['Alice Johnson', '30', 'alice@example.com', 'Engineering'] } },
    'row-2': { id: 'row-2', data: { cells: ['Bob Smith', '25', 'bob@example.com', 'Design'] } },
    'row-3': { id: 'row-3', data: { cells: ['Carol Williams', '35', 'carol@example.com', 'Engineering'] } },
    'row-4': { id: 'row-4', data: { cells: ['Dave Brown', '28', 'dave@example.com', 'Marketing'] } },
    'row-5': { id: 'row-5', data: { cells: ['Eve Davis', '32', 'eve@example.com', 'Engineering'] } },
  },
  relationships: {
    [ROOT_ID]: ['row-1', 'row-2', 'row-3', 'row-4', 'row-5'],
  },
})
