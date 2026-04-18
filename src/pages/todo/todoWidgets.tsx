// ⑦ Pipeline Todo — Stage 4 widgets (static fixtures, store 배선 전)
import { useMemo } from 'react'
import { ax } from '@styles/ax'
import { getChildren, getEntityData, ROOT_ID } from '@os/schema'
import type { NormalizedData } from '@os/schema'
import type { ItemSlots } from '@os/ui/types'
import { PanelHeader } from '@os/ui/PanelHeader'
import { ListBox } from '@os/ui/ListBox'
import { EmptyState } from '@os/ui/EmptyState'
import { CheckIndicator } from '@os/ui/indicators/CheckIndicator'
import { CloseIndicator } from '@os/ui/indicators/CloseIndicator'
import { TextInput } from '@os/ui/TextInput'
import { Button } from '@os/ui/Button'
import { buildTodoData } from './todoFixtures'
import type { TodoData } from './todoFixtures'

// ── shared derivation (Stage 4: 고정 fixture) ─────────────

function countDone(store: NormalizedData): { done: number; total: number } {
  const ids = getChildren(store, ROOT_ID)
  let done = 0
  for (const id of ids) {
    const d = getEntityData<TodoData>(store, id)
    if (d?.done) done += 1
  }
  return { done, total: ids.length }
}

// Stage 4는 위젯 간 공유를 위해 module-level singleton fixture 사용.
// Stage 5에서 context/store로 교체된다.
const STAGE_4_DATA = buildTodoData()

// ── TodoHeader ────────────────────────────────────────────

export function TodoHeader() {
  const { done, total } = countDone(STAGE_4_DATA)
  return (
    <div
      className={ax({
        layout: 'stack',
        gap: 'xs',
        padding: 'md',
        width: 'full',
      })}
    >
      <span className={ax({ textStyle: 'page' })}>Todo</span>
      <span className={ax({ textStyle: 'caption' })}>
        완료 {done} / 전체 {total}
      </span>
    </div>
  )
}

// ── TodoList ──────────────────────────────────────────────

function makeTodoSlots(): ItemSlots {
  return {
    icon: (node) => {
      const data = (node.data ?? {}) as TodoData
      return (
        <span
          data-done={data.done || undefined}
          className={ax({
            layout: 'center',
            flex: 'none',
          })}
        >
          <CheckIndicator />
        </span>
      )
    },
    rightContent: (node) => {
      const data = (node.data ?? {}) as TodoData
      return (
        <Button
          variant="ghost"
          icon
          aria-label={`${data.label} 삭제`}
        >
          <CloseIndicator />
        </Button>
      )
    },
  }
}

export function TodoList() {
  const slots = useMemo(() => makeTodoSlots(), [])
  const ids = getChildren(STAGE_4_DATA, ROOT_ID)
  const isEmpty = ids.length === 0

  return (
    <div className={ax({ layout: 'stack', width: 'full', flex: '1' })}>
      <PanelHeader>
        <span>목록</span>
      </PanelHeader>
      {isEmpty ? (
        <EmptyState
          title="할 일이 없어요"
          description="하단 입력창에서 새 할 일을 추가하세요."
        />
      ) : (
        <ListBox
          data={STAGE_4_DATA}
          itemSlots={slots}
          aria-label="Todo list"
        />
      )}
    </div>
  )
}

// ── TodoComposer ──────────────────────────────────────────

export function TodoComposer() {
  // Stage 4: 입력 배선은 Stage 5에서 store command로 전환된다.
  // 현재는 정적 placeholder만 렌더한다.
  return (
    <div
      className={ax({
        layout: 'row',
        gap: 'sm',
        padding: 'sm',
        width: 'full',
      })}
    >
      <span className={ax({ flex: '1' })}>
        <TextInput
          placeholder="새 할 일..."
          aria-label="새 할 일 입력"
        />
      </span>
      <Button variant="accent">
        추가
      </Button>
    </div>
  )
}
