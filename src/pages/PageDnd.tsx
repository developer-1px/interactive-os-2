import { useState } from 'react'
import { TreeGrid } from '../interactive-os/ui/TreeGrid'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { core } from '../interactive-os/plugins/core'
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

const plugins = [core(), dnd(), history(), focusRecovery()]

export default function PageDnd() {
  const [data, setData] = useState<NormalizedData>(kanbanData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">DnD</h2>
        <p className="page-desc">
          Keyboard-driven reordering and reparenting.
          Move items up/down within siblings, or move in/out to change parent.
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>→←</kbd> <span className="key-hint">expand</span>{' '}
        <kbd>Alt↑</kbd> <span className="key-hint">move up</span>{' '}
        <kbd>Alt↓</kbd> <span className="key-hint">move down</span>{' '}
        <kbd>Alt←</kbd> <span className="key-hint">move out</span>{' '}
        <kbd>Alt→</kbd> <span className="key-hint">move in</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>
      </div>
      <div className="card">
        <TreeGrid
          data={data}
          onChange={setData}
          enableEditing
          plugins={plugins}
          renderItem={(node, state: NodeState, props) => {
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
                  {isGroup ? (state.expanded ? '▾' : '▸') : ''}
                </span>
                <span className="tree-node__name" style={{ fontWeight: isGroup ? 600 : 400 }}>
                  {d?.label as string}
                </span>
              </div>
            )
          }}
        />
      </div>
      <div className="page-section">
        <h3 className="page-section-title">Plugin: dnd()</h3>
        <p className="page-desc">
          The <code>dnd</code> plugin adds <code>moveUp</code>, <code>moveDown</code>, <code>moveOut</code>,
          <code>moveIn</code>, and <code>moveTo</code> commands.
          Reordering changes the item's index in the parent's children array.
          Reparenting (moveIn/moveOut) changes the parent relationship entirely.
        </p>
      </div>
    </div>
  )
}
