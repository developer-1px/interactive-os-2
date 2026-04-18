// Pipeline Todo — Stage 5 widgets (store + commands via TodoContext)
import { useMemo, useCallback } from 'react'
import type React from 'react'
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
import { useTodo } from './todoContext'
import { todoCommands } from './todoStore'
import type { TodoData } from './todoFixtures'

// ── derivations ───────────────────────────────────────────

function countDone(store: NormalizedData): { done: number; total: number } {
  const ids = getChildren(store, ROOT_ID)
  let done = 0
  for (const id of ids) {
    const d = getEntityData<TodoData>(store, id)
    if (d?.done) done += 1
  }
  return { done, total: ids.length }
}

// ── TodoHeader ────────────────────────────────────────────

export function TodoHeader() {
  const { store } = useTodo()
  const { done, total } = countDone(store)
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

export function TodoList() {
  const { engine, store } = useTodo()

  const handleRemove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
      e.preventDefault()
      engine.dispatch(todoCommands.remove(id))
    },
    [engine],
  )

  const handleActivate = useCallback(
    (id: string) => {
      engine.dispatch(todoCommands.toggle(id))
    },
    [engine],
  )

  const slots: ItemSlots = useMemo(
    () => ({
      icon: (node) => {
        const data = (node.data ?? {}) as TodoData
        return (
          <span
            data-done={data.done || undefined}
            className={ax({ layout: 'center', flex: 'none' })}
          >
            <CheckIndicator />
          </span>
        )
      },
      rightContent: (node) => {
        const data = (node.data ?? {}) as TodoData
        const id = node.id as string
        return (
          <Button
            variant="ghost"
            icon
            aria-label={`${data.label} 삭제`}
            onClick={(e) => handleRemove(e, id)}
          >
            <CloseIndicator />
          </Button>
        )
      },
    }),
    [handleRemove],
  )

  const ids = getChildren(store, ROOT_ID)
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
          data={store}
          itemSlots={slots}
          onActivate={handleActivate}
          aria-label="Todo list"
        />
      )}
    </div>
  )
}

// ── TodoComposer ──────────────────────────────────────────

export function TodoComposer() {
  const { engine } = useTodo()

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const form = e.currentTarget
      const formData = new FormData(form)
      const label = String(formData.get('label') ?? '').trim()
      if (!label) return
      engine.dispatch(todoCommands.add(label))
      form.reset()
    },
    [engine],
  )

  return (
    <form
      onSubmit={handleSubmit}
      className={ax({
        layout: 'row',
        gap: 'sm',
        padding: 'sm',
        width: 'full',
      })}
    >
      <span className={ax({ flex: '1' })}>
        <TextInput
          name="label"
          placeholder="새 할 일..."
          aria-label="새 할 일 입력"
        />
      </span>
      <Button type="submit" variant="accent">
        추가
      </Button>
    </form>
  )
}
