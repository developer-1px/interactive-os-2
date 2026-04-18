// ⑦ Pipeline Todo — /todo route entry (Stage 4: layout only)
import { FlatLayout } from '@os/ui/FlatLayout'
import { createWidgetRegistry } from '@os/layout'
import { todoLayout } from './todoDefinePage'
import { TodoHeader, TodoList, TodoComposer } from './todoWidgets'

// ── Widget registry ──

const todoWidgets = createWidgetRegistry({
  TodoHeader,
  TodoList,
  TodoComposer,
})

export default function PageTodo() {
  return (
    <FlatLayout
      data={todoLayout}
      registry={todoWidgets}
      aria-label="Todo"
    />
  )
}
