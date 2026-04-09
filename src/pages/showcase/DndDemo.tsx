import { ax } from '@styles/ax'
import { TreeGrid } from '@os/ui/TreeGrid'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import { useStore } from '@os/store/useStore'
import { Up, Down, Left, Right } from '../shared/kbdIcons'
import { history } from '@os/plugins/history'
import { dnd } from '@os/plugins/dnd'
import { focusRecovery } from '@os/plugins/focusRecovery'

const kanbanData = createStore({
  entities: {
    todo: { id: 'todo', data: { label: 'To Do', type: 'group' } },
    doing: { id: 'doing', data: { label: 'In Progress', type: 'group' } },
    done: { id: 'done', data: { label: 'Done', type: 'group' } },
    t1: { id: 't1', data: { label: 'Design API', type: 'item' } },
    t2: { id: 't2', data: { label: 'Write tests', type: 'item' } },
    t3: { id: 't3', data: { label: 'Implement store', type: 'item' } },
    t4: { id: 't4', data: { label: 'Review PR', type: 'item' } },
    t5: { id: 't5', data: { label: 'Ship v1', type: 'item' } },
  },
  relationships: {
    [ROOT_ID]: ['todo', 'doing', 'done'],
    todo: ['t1', 't2'],
    doing: ['t3', 't4'],
    done: ['t5'],
  },
})

const plugins = [dnd(), history(), focusRecovery()]

export default function DndDemo() {
  const [data, setData] = useStore(kanbanData)

  return (
    <>
      <div className={`page-keys ${ax({ layout: 'wrap' })}`}>
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd><Right /><Left /></kbd> <span className="key-hint">expand</span>{' '}
        <kbd>Alt+<Up /></kbd> <span className="key-hint">move up</span>{' '}
        <kbd>Alt+<Down /></kbd> <span className="key-hint">move down</span>{' '}
        <kbd>Alt+<Left /></kbd> <span className="key-hint">move out</span>{' '}
        <kbd>Alt+<Right /></kbd> <span className="key-hint">move in</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>
      </div>
      <div className={`card ${ax({ scroll: 'hidden' })}`}>
        <TreeGrid
          data={data}
          onChange={setData}
          enableEditing
          plugins={plugins}
        />
      </div>
    </>
  )
}
