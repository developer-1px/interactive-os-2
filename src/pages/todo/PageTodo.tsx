// ⑦ Pipeline Todo — /todo route entry (Stage 5: engine + store + provider)
import { useMemo } from 'react'
import { FlatLayout } from '@os/ui/FlatLayout'
import { createWidgetRegistry } from '@os/layout'
import { useEngine } from '@os/engine/useEngine'
import { definePlugin } from '@os/plugins/definePlugin'
import { todoLayout } from './todoDefinePage'
import { TodoProvider } from './todoContext'
import { todoStore, todoCommands } from './todoStore'
import { TodoHeader, TodoList, TodoComposer } from './todoWidgets'

// ── Plugin: register todo commands ──

const todoPlugin = definePlugin({
  name: 'todo',
  commands: {
    add: todoCommands.add,
    toggle: todoCommands.toggle,
    remove: todoCommands.remove,
  },
})

// ── Widget registry ──

const todoWidgets = createWidgetRegistry({
  TodoHeader,
  TodoList,
  TodoComposer,
})

export default function PageTodo() {
  const { engine, store } = useEngine({
    data: todoStore,
    plugins: [todoPlugin],
  })

  const ctx = useMemo(() => ({ engine, store }), [engine, store])

  return (
    <TodoProvider value={ctx}>
      <FlatLayout
        data={todoLayout}
        registry={todoWidgets}
        aria-label="Todo"
      />
    </TodoProvider>
  )
}
