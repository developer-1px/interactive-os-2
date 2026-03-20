import { useState } from 'react'
import { ListBox } from '../interactive-os/ui/ListBox'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { core } from '../interactive-os/plugins/core'
import { history } from '../interactive-os/plugins/history'
import { crud } from '../interactive-os/plugins/crud'
import { clipboard } from '../interactive-os/plugins/clipboard'
import { rename } from '../interactive-os/plugins/rename'
import { dnd } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'

const noteData = createStore({
  entities: {
    note1: { id: 'note1', data: { label: 'First note' } },
    note2: { id: 'note2', data: { label: 'Second note' } },
    note3: { id: 'note3', data: { label: 'Third note' } },
  },
  relationships: {
    [ROOT_ID]: ['note1', 'note2', 'note3'],
  },
})

const plugins = [core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

export default function PageHistoryDemo() {
  const [data, setData] = useState<NormalizedData>(noteData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">History</h2>
        <p className="page-desc">
          Undo and redo any command. The history stack is snapshot-based —
          every dispatched command captures a before-state for rollback.
          Try creating, deleting, renaming, or reordering items, then undo each step.
        </p>
      </div>
      <div className="page-keys">
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>⌘⇧Z</kbd> <span className="key-hint">redo</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">create</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>F2</kbd> <span className="key-hint">rename</span>{' '}
        <kbd>Alt↑↓</kbd> <span className="key-hint">reorder</span>
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
                <span className="list-item__label">{d?.label as string}</span>
              </div>
            )
          }}
        />
      </div>
      <div className="page-section">
        <h3 className="page-section-title">Plugin: history()</h3>
        <p className="page-desc">
          The <code>history</code> plugin adds <code>undo</code> and <code>redo</code> commands
          using a snapshot-based stack. Each command's <code>execute()</code> captures the store state before modification.
          The redo stack is cleared whenever a new command is dispatched.
        </p>
      </div>
    </div>
  )
}
