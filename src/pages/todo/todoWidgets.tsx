// Stage 4 — widgets (static fixture render, no store, no interaction)
// docs/research/pipeline/todo/ baseline
import { ax } from '@styles/ax'
import { Button } from '@os/ui/Button'
import { TextInput } from '@os/ui/TextInput'
import { EmptyState } from '@os/ui/EmptyState'
import { CheckIndicator } from '@os/ui/indicators/CheckIndicator'
import { CloseIndicator } from '@os/ui/indicators/CloseIndicator'
import styles from './PageTodo.module.css'

const fixture = [
  { id: 'todo-1', text: '우유 사기', done: false },
  { id: 'todo-2', text: '세탁물 찾기', done: true },
  { id: 'todo-3', text: '이메일 확인', done: false },
]

const doneCount = fixture.filter(t => t.done).length

export function TodoHeader() {
  return (
    <div className={ax({ role: 'control-group', surface: 'raised', layout: 'row', width: 'full', flex: 'none' })}>
      <div className={ax({ textStyle: 'section', flex: '1' })}>Todo</div>
      <div className={ax({ textStyle: 'body' })}>완료 {doneCount} / {fixture.length}</div>
    </div>
  )
}

export function TodoList() {
  if (fixture.length === 0) {
    return <EmptyState title="할 일이 없어요" description="하단 입력창에 새 할 일을 추가하세요." />
  }
  return (
    <div role="list" className={ax({ layout: 'stack', width: 'full', flex: '1' })}>
      {fixture.map(todo => (
        <div
          key={todo.id}
          role="listitem"
          className={ax({ role: 'item', interactive: 'item', surface: 'ghost', layout: 'row', width: 'full' })}
          data-done={todo.done || undefined}
        >
          <CheckIndicator className={todo.done ? 'is-checked' : undefined} />
          <span className={`${ax({ clamp: '1', flex: '1' })}${todo.done ? ` ${styles.doneText}` : ''}`}>
            {todo.text}
          </span>
          <Button variant="ghost" icon aria-label={`${todo.text} 삭제`}>
            <CloseIndicator />
          </Button>
        </div>
      ))}
    </div>
  )
}

export function TodoInput() {
  return (
    <div className={ax({ role: 'control-group', surface: 'sunken', layout: 'row', width: 'full', flex: 'none' })}>
      <TextInput placeholder="새 할 일을 입력하세요..." />
      <Button variant="accent">추가</Button>
    </div>
  )
}
