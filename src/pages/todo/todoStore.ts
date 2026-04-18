// Stage 5 — Todo store: NormalizedData + commands (add/toggle/remove).
import { createStore, addEntity, removeEntity, updateEntityData } from '@os/store/createStore'
import { defineCommands } from '@os/engine/defineCommand'
import { ROOT_ID } from '@os/store/types'
import type { Entity, NormalizedData } from '@os/store/types'

export interface TodoData extends Record<string, unknown> {
  label: string
  done: boolean
}

const SEED: Array<[string, TodoData]> = [
  ['t1', { label: '우유 사기', done: false }],
  ['t2', { label: '세탁물 찾기', done: true }],
  ['t3', { label: '이메일 확인', done: false }],
]

function buildInitial(): NormalizedData {
  const entities: Record<string, Entity> = {}
  const ids: string[] = []
  for (const [id, data] of SEED) {
    entities[id] = { id, data }
    ids.push(id)
  }
  return createStore({ entities, relationships: { [ROOT_ID]: ids } })
}

export const todoStore: NormalizedData = buildInitial()

// ── Selectors ──

export function selectTodos(store: NormalizedData): Array<{ id: string; data: TodoData }> {
  const ids = store.relationships[ROOT_ID] ?? []
  const out: Array<{ id: string; data: TodoData }> = []
  for (const id of ids) {
    const e = store.entities[id]
    if (e) out.push({ id, data: (e.data ?? { label: id, done: false }) as TodoData })
  }
  return out
}

export function selectTotal(store: NormalizedData): number {
  return (store.relationships[ROOT_ID] ?? []).length
}

export function selectDoneCount(store: NormalizedData): number {
  let n = 0
  for (const id of store.relationships[ROOT_ID] ?? []) {
    if ((store.entities[id]?.data as TodoData | undefined)?.done) n++
  }
  return n
}

// ── Commands ──

let _seq = 100

export const todoCommands = defineCommands({
  add: {
    type: 'todo:add' as const,
    create: (label: string) => ({ id: `t${++_seq}`, label }),
    handler: (store, { id, label }) =>
      addEntity(store, { id, data: { label, done: false } }, ROOT_ID),
  },
  toggle: {
    type: 'todo:toggle' as const,
    create: (id: string) => ({ id }),
    handler: (store, { id }) => {
      const data = (store.entities[id]?.data ?? {}) as TodoData
      return updateEntityData(store, id, { done: !data.done })
    },
  },
  remove: {
    type: 'todo:remove' as const,
    create: (id: string) => ({ id }),
    handler: (store, { id }) => removeEntity(store, id),
  },
})
