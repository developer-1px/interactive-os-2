import { useState } from 'react'
import { ListBox } from '../interactive-os/ui/ListBox'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { core } from '../interactive-os/plugins/core'
import { history } from '../interactive-os/plugins/history'
import { crud } from '../interactive-os/plugins/crud'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'

const taskData = createStore({
  entities: {
    task1: { id: 'task1', data: { label: 'Set up project structure', done: true } },
    task2: { id: 'task2', data: { label: 'Write core types', done: true } },
    task3: { id: 'task3', data: { label: 'Implement store', done: false } },
    task4: { id: 'task4', data: { label: 'Add command engine', done: false } },
    task5: { id: 'task5', data: { label: 'Create plugin system', done: false } },
  },
  relationships: {
    [ROOT_ID]: ['task1', 'task2', 'task3', 'task4', 'task5'],
  },
})

const plugins = [core(), crud(), history(), focusRecovery()]

export default function PageCrud() {
  const [data, setData] = useState<NormalizedData>(taskData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">CRUD</h2>
        <p className="page-desc">
          Create and delete items with automatic focus recovery.
          New items are inserted after the focused node; deleted subtrees restore on undo.
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">create</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>⌘⇧Z</kbd> <span className="key-hint">redo</span>
      </div>
      <div className="card">
        <ListBox
          data={data}
          onChange={setData}
          enableEditing
          plugins={plugins}
          renderItem={(item, state: NodeState) => {
            const d = item.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
              state.selected && !state.focused && 'list-item--selected',
            ].filter(Boolean).join(' ')

            return (
              <div className={cls}>
                <span style={{ opacity: d?.done ? 0.5 : 1, textDecoration: d?.done ? 'line-through' : 'none' }}>
                  {d?.label as string}
                </span>
              </div>
            )
          }}
        />
      </div>
      <div className="page-section">
        <h3 className="page-section-title">Plugin: crud()</h3>
        <p className="page-desc">
          The <code>crud</code> plugin adds <code>create</code>, <code>delete</code>, and <code>deleteMultiple</code> commands.
          New entities are inserted at a specific index in the parent's children list.
          Delete recursively removes the entire subtree and restores it on undo.
        </p>
      </div>
    </div>
  )
}
