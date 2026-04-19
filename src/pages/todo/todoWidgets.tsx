// Stage 4/5 — Todo FlatLayout widgets. Widgets pull from TodoContext (engine + store).
import { useCallback, useMemo } from 'react'
import { ax } from '@styles/ax'
import { createStore, ROOT_ID } from '@os/schema'
import type { NormalizedData } from '@os/store/types'
import { ListBox } from '@os/ui/ListBox'
import { EmptyState } from '@os/ui/EmptyState'
import { PanelHeader } from '@os/ui/PanelHeader'
import { Composer } from '@os/ui/Composer'
import { TodoItem } from '../../entities/todo/ui/TodoItem'
import { useTodo } from './todoContext'
import { todoCommands, selectTodos, selectTotal, selectDoneCount } from './todoStore'
import type { TodoData } from './todoStore'

// ── TodoHeaderWidget ─────────────────────────────────

export function TodoHeaderWidget() {
  const { store } = useTodo()
  const total = selectTotal(store)
  const done = selectDoneCount(store)

  return (
    <PanelHeader>
      <div className={ax({ layout: 'spread', width: 'full' })}>
        <span className={ax({ textStyle: 'page' })}>Todo</span>
        <span className={ax({ textStyle: 'caption' })}>
          완료 {done} / {total}
        </span>
      </div>
    </PanelHeader>
  )
}

// ── TodoListWidget ───────────────────────────────────

function buildListData(items: Array<{ id: string; data: TodoData }>): NormalizedData {
  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const ids: string[] = []
  for (const { id, data } of items) {
    entities[id] = { id, data: { ...data } }
    ids.push(id)
  }
  return createStore({ entities, relationships: { [ROOT_ID]: ids } })
}

export function TodoListWidget() {
  const { engine, store } = useTodo()
  const items = useMemo(() => selectTodos(store), [store])
  const listData = useMemo(() => buildListData(items), [items])

  const handleActivate = useCallback(
    (id: string) => {
      engine.dispatch(todoCommands.toggle(id))
    },
    [engine],
  )

  if (items.length === 0) {
    return (
      <div className={ax({ layout: 'fill' })}>
        <EmptyState title="할 일이 없어요" description="아래 입력창에서 새 할 일을 추가하세요." />
      </div>
    )
  }

  return (
    <div className={ax({ layout: 'fill' })}>
      <ListBox
        data={listData}
        aria-label="할 일 목록"
        onActivate={handleActivate}
        renderItem={TodoItem}
      />
    </div>
  )
}

// ── TodoComposerWidget ──────────────────────────────

export function TodoComposerWidget() {
  const { engine } = useTodo()

  const handleSubmit = useCallback(
    (text: string) => {
      engine.dispatch(todoCommands.add(text))
    },
    [engine],
  )

  return (
    <div className={ax({ width: 'full' })}>
      <Composer placeholder="새 할 일..." onSubmit={handleSubmit} />
    </div>
  )
}
