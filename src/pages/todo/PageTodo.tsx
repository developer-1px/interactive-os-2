// Stage 5 — page entry: engine + plugin wiring, context provider, FlatLayout.
import { useMemo } from 'react'
import { FlatLayout } from '@os/ui/FlatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { useEngine } from '@os/engine/useEngine'
import { definePlugin } from '@os/plugins/definePlugin'
import { ax } from '@styles/ax'
import { TodoHeader, TodoList, TodoInput } from './todoWidgets'
import { todoLayout } from './todoDefinePage'
import { initialTodoStore, todoCommands } from './todoStore'
import { TodoProvider } from './todoContext'
import styles from './PageTodo.module.css'

const todoPlugin = definePlugin({
  name: 'todo',
  commands: {
    add: todoCommands.add,
    toggle: todoCommands.toggle,
    remove: todoCommands.remove,
  },
})

const todoWidgets = createWidgetRegistry({
  TodoHeader,
  TodoList,
  TodoInput,
})

export default function PageTodo() {
  const { engine, store } = useEngine({
    data: initialTodoStore,
    plugins: [todoPlugin],
  })

  const ctx = useMemo(() => ({ engine, store }), [engine, store])

  return (
    <TodoProvider value={ctx}>
      <div className={ax({ layout: 'center', width: 'full' })}>
        <div className={`${ax({ width: 'md', layout: 'stack' })} ${styles.mobileFrame}`}>
          <FlatLayout
            data={todoLayout}
            registry={todoWidgets}
            aria-label="Todo"
          />
        </div>
      </div>
    </TodoProvider>
  )
}
