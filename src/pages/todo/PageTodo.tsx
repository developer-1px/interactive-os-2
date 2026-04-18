// Stage 4 — page entry (FlatLayout + widgets, no store yet)
// docs/research/pipeline/todo/ baseline
import { FlatLayout } from '@os/ui/FlatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { ax } from '@styles/ax'
import { TodoHeader, TodoList, TodoInput } from './todoWidgets'
import { todoLayout } from './todoDefinePage'
import styles from './PageTodo.module.css'

const todoWidgets = createWidgetRegistry({
  TodoHeader,
  TodoList,
  TodoInput,
})

export default function PageTodo() {
  return (
    <div className={ax({ layout: 'center', width: 'full' })}>
      <div className={`${ax({ width: 'md', layout: 'stack' })} ${styles.mobileFrame}`}>
        <FlatLayout
          data={todoLayout}
          registry={todoWidgets}
          aria-label="Todo"
        />
      </div>
    </div>
  )
}
