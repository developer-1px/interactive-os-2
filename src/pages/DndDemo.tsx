import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { TreeGrid } from '../interactive-os/ui/TreeGrid'
import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData } from '../interactive-os/store/types'
import type { NodeState } from '../interactive-os/pattern/types'
import { Up, Down, Left, Right } from './kbdIcons'
import { history } from '../interactive-os/plugins/history'
import { dnd } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'

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
  const [data, setData] = useState<NormalizedData>(kanbanData)

  return (
    <>
      <div className="page-keys">
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd><Right /><Left /></kbd> <span className="key-hint">expand</span>{' '}
        <kbd>Alt+<Up /></kbd> <span className="key-hint">move up</span>{' '}
        <kbd>Alt+<Down /></kbd> <span className="key-hint">move down</span>{' '}
        <kbd>Alt+<Left /></kbd> <span className="key-hint">move out</span>{' '}
        <kbd>Alt+<Right /></kbd> <span className="key-hint">move in</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>
      </div>
      <div className="card">
        <TreeGrid
          data={data}
          onChange={setData}
          enableEditing
          plugins={plugins}
          renderItem={(props, node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const isGroup = d?.type === 'group'
            const indent = ((state.level ?? 1) - 1) * 18

            const cls = [
              'tree-node',
              state.focused && 'tree-node--focused',
              state.selected && !state.focused && 'tree-node--selected',
            ].filter(Boolean).join(' ')

            return (
              <div {...props} className={cls} style={{ paddingLeft: 14 + indent }}>
                <span className="tree-node__chevron">
                  {isGroup ? (state.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : ''}
                </span>
                <span className="tree-node__name" style={{ fontWeight: isGroup ? 600 : 400 }}>
                  {d?.label as string}
                </span>
              </div>
            )
          }}
        />
      </div>
    </>
  )
}
