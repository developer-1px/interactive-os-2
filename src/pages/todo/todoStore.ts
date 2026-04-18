// ⑦ Pipeline Todo — Stage 5 store (NormalizedData + Commands)
//
// Commands:
//   - todo:add(label)      — 새 todo 생성 후 ROOT_ID 끝에 append
//   - todo:toggle(id)      — entities[id].data.done 플립
//   - todo:remove(id)      — entities + ROOT_ID 관계에서 제거
import { createStore, ROOT_ID } from '@os/schema'
import {
  addEntity,
  removeEntity,
  updateEntityData,
  getEntityData,
} from '@os/store/createStore'
import { defineCommands } from '@os/engine/defineCommand'
import type { NormalizedData } from '@os/schema'
import type { TodoData } from './todoFixtures'

// ── Initial fixture ──

export const todoStore: NormalizedData = createStore({
  entities: {
    't-1': { id: 't-1', data: { label: '우유 사기', done: false } },
    't-2': { id: 't-2', data: { label: '세탁물 찾기', done: true } },
    't-3': { id: 't-3', data: { label: '이메일 확인', done: false } },
  },
  relationships: {
    [ROOT_ID]: ['t-1', 't-2', 't-3'],
  },
})

// ── id generator (monotonic, session-local) ──

let _counter = 100
const nextId = () => `t-${++_counter}`

// ── Commands ──

export const todoCommands = defineCommands({
  add: {
    type: 'todo:add' as const,
    create: (label: string) => ({ label }),
    handler: (store, { label }) => {
      const trimmed = label.trim()
      if (!trimmed) return store
      const id = nextId()
      return addEntity(store, { id, data: { label: trimmed, done: false } }, ROOT_ID)
    },
  },

  toggle: {
    type: 'todo:toggle' as const,
    create: (id: string) => ({ id }),
    handler: (store, { id }) => {
      const current = getEntityData<TodoData>(store, id)
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
