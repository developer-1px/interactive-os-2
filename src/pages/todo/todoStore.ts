/**
 * Todo store — NormalizedData + 3 commands (add/toggle/remove).
 * Stage 5 assembly. 2-data.json 스펙 구현.
 */
import { createStore, addEntity, removeEntity, updateEntityData } from '@os/store/createStore'
import { defineCommands } from '@os/engine/defineCommand'
import { ROOT_ID } from '@os/store/types'
import type { Entity, NormalizedData } from '@os/store/types'

export interface TodoData {
  text: string
  done: boolean
}

export const initialTodoStore: NormalizedData = createStore({
  entities: {
    'todo-1': { id: 'todo-1', data: { text: '우유 사기', done: false } satisfies TodoData },
    'todo-2': { id: 'todo-2', data: { text: '세탁물 찾기', done: true } satisfies TodoData },
    'todo-3': { id: 'todo-3', data: { text: '이메일 확인', done: false } satisfies TodoData },
  },
  relationships: {
    [ROOT_ID]: ['todo-1', 'todo-2', 'todo-3'],
  },
})

let nextId = 4

export const todoCommands = defineCommands({
  add: {
    type: 'todo:add' as const,
    create: (text: string) => ({ text, id: `todo-${nextId++}` }),
    handler: (store, { id, text }) => {
      const entity: Entity = { id, data: { text, done: false } satisfies TodoData }
      return addEntity(store, entity, ROOT_ID)
    },
  },

  toggle: {
    type: 'todo:toggle' as const,
    create: (id: string) => ({ id }),
    handler: (store, { id }) => {
      const current = store.entities[id]?.data as TodoData | undefined
      if (!current) return store
      return updateEntityData(store, id, { done: !current.done })
    },
  },

  remove: {
    type: 'todo:remove' as const,
    create: (id: string) => ({ id }),
    handler: (store, { id }) => removeEntity(store, id),
  },
})
