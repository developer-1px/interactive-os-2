// ⑦ Pipeline Todo — Stage 4 fixture data (store 배선 전, layout 검증용)
import { createStore, ROOT_ID } from '@os/schema'
import type { NormalizedData } from '@os/schema'

export interface TodoData {
  label: string
  done: boolean
}

export function buildTodoData(): NormalizedData {
  return createStore({
    entities: {
      't-1': { id: 't-1', data: { label: '우유 사기', done: false } },
      't-2': { id: 't-2', data: { label: '세탁물 찾기', done: true } },
      't-3': { id: 't-3', data: { label: '이메일 확인', done: false } },
    },
    relationships: {
      [ROOT_ID]: ['t-1', 't-2', 't-3'],
    },
  })
}
