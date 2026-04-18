// Stage 5 — widgets wired to store + engine + commands.
import { useState, useCallback, type KeyboardEvent } from 'react'
import { ax } from '@styles/ax'
import { Button } from '@os/ui/Button'
import { TextInput } from '@os/ui/TextInput'
import { EmptyState } from '@os/ui/EmptyState'
import { CheckIndicator } from '@os/ui/indicators/CheckIndicator'
import { CloseIndicator } from '@os/ui/indicators/CloseIndicator'
import { ROOT_ID } from '@os/store/types'
import { useTodo } from './todoContext'
import { todoCommands, type TodoData } from './todoStore'
import styles from './PageTodo.module.css'

function selectTodos(store: ReturnType<typeof useTodo>['store']) {
  const ids = store.relationships[ROOT_ID] ?? []
  return ids
    .map(id => {
      const entity = store.entities[id]
      if (!entity) return null
      const data = entity.data as TodoData | undefined
      if (!data || typeof data.text !== 'string') return null
      return { id, ...data }
    })
    .filter((t): t is { id: string; text: string; done: boolean } => t !== null)
}

export function TodoHeader() {
  const { store } = useTodo()
  const todos = selectTodos(store)
  const doneCount = todos.filter(t => t.done).length

  return (
    <div className={ax({ role: 'control-group', surface: 'raised', layout: 'row', width: 'full', flex: 'none' })}>
      <div className={ax({ textStyle: 'section', flex: '1' })}>Todo</div>
      <div className={ax({ textStyle: 'body' })}>완료 {doneCount} / {todos.length}</div>
    </div>
  )
}

export function TodoList() {
  const { engine, store } = useTodo()
  const todos = selectTodos(store)

  const onToggle = useCallback((id: string) => {
    engine.dispatch(todoCommands.toggle(id))
  }, [engine])

  const onRemove = useCallback((id: string) => {
    engine.dispatch(todoCommands.remove(id))
  }, [engine])

  if (todos.length === 0) {
    return <EmptyState title="할 일이 없어요" description="하단 입력창에 새 할 일을 추가하세요." />
  }

  return (
    <div role="list" className={ax({ layout: 'stack', width: 'full', flex: '1' })}>
      {todos.map(todo => (
        <div
          key={todo.id}
          role="listitem"
          className={ax({ role: 'item', interactive: 'item', surface: 'ghost', layout: 'row', width: 'full' })}
          data-done={todo.done || undefined}
        >
          <button
            type="button"
            aria-label={`${todo.text} ${todo.done ? '완료 취소' : '완료'}`}
            onClick={() => onToggle(todo.id)}
            className={ax({ role: 'control', surface: 'ghost', interactive: 'button', content: 'icon' })}
          >
            <CheckIndicator className={todo.done ? 'is-checked' : undefined} />
          </button>
          <span className={`${ax({ clamp: '1', flex: '1' })}${todo.done ? ` ${styles.doneText}` : ''}`}>
            {todo.text}
          </span>
          <Button variant="ghost" icon aria-label={`${todo.text} 삭제`} onClick={() => onRemove(todo.id)}>
            <CloseIndicator />
          </Button>
        </div>
      ))}
    </div>
  )
}

export function TodoInput() {
  const { engine } = useTodo()
  const [draft, setDraft] = useState('')

  const submit = useCallback(() => {
    const text = draft.trim()
    if (!text) return
    engine.dispatch(todoCommands.add(text))
    setDraft('')
  }, [draft, engine])

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }, [submit])

  return (
    <div className={ax({ role: 'control-group', surface: 'sunken', layout: 'row', width: 'full', flex: 'none' })}>
      <div className={ax({ flex: '1' })}>
        <TextInput
          placeholder="새 할 일을 입력하세요..."
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
      <Button variant="accent" onClick={submit}>추가</Button>
    </div>
  )
}
