// /todo route entry — FlatLayout + Todo store.
import { useMemo } from 'react'
import { FlatLayout } from '@os/ui/FlatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { useEngine } from '@os/engine/useEngine'
import { definePlugin } from '@os/plugins/definePlugin'
import { todoStore, todoCommands } from './todoStore'
import { todoLayout } from './todoLayout'
import { TodoProvider } from './todoContext'
import { TodoHeaderWidget, TodoListWidget, TodoComposerWidget } from './todoWidgets'

const todoPlugin = definePlugin({
  name: 'todo',
  commands: {
    add: todoCommands.add,
    toggle: todoCommands.toggle,
    remove: todoCommands.remove,
  },
})

const todoWidgets = createWidgetRegistry({
  TodoHeaderWidget,
  TodoListWidget,
  TodoComposerWidget,
})

export default function PageTodo() {
  const { engine, store } = useEngine({
    data: todoStore,
    plugins: [todoPlugin],
  })

  const ctx = useMemo(() => ({ engine, store }), [engine, store])

  return (
    <TodoProvider value={ctx}>
      <FlatLayout data={todoLayout} registry={todoWidgets} aria-label="Todo" />
    </TodoProvider>
  )
}
