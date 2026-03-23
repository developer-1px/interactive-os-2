import { useState, useMemo } from 'react'
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

const initialData = createStore({
  entities: {
    a: { id: 'a', data: { label: 'Alpha' } },
    b: { id: 'b', data: { label: 'Beta' } },
    c: { id: 'c', data: { label: 'Gamma' } },
    d: { id: 'd', data: { label: 'Delta' } },
  },
  relationships: {
    [ROOT_ID]: ['a', 'b', 'c', 'd'],
  },
})

const plugins = [core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

export default function PageEngineHistory() {
  const [data, setData] = useState<NormalizedData>(initialData)
  const [changeLog, setChangeLog] = useState<string[]>([])

  const handleChange = (newData: NormalizedData) => {
    setData(newData)
    const items = (newData.relationships[ROOT_ID] ?? [])
      .map((id) => {
        const e = newData.entities[id]
        return e ? (e.data as Record<string, unknown>)?.label as string : id
      })
      .join(', ')
    setChangeLog((prev) => [...prev.slice(-19), `[${prev.length + 1}] ${items}`])
  }

  const entityCount = useMemo(() => {
    return Object.keys(data.entities).filter((k) => !k.startsWith('__')).length
  }, [data])

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">History</h2>
        <p className="page-desc">
          Snapshot-based undo/redo. Every command captures a before-state.
          Try adding, deleting, renaming, or reordering — then undo each step.
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
          onChange={handleChange}
          enableEditing
          plugins={plugins}
          renderItem={(item, state: NodeState, props) => {
            const d = item.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
              state.selected && !state.focused && 'list-item--selected',
            ].filter(Boolean).join(' ')
            return (
              <div {...props} className={cls}>
                <span className="list-item__label">{d?.label as string}</span>
              </div>
            )
          }}
        />
      </div>
      <div className="page-section">
        <h3 className="page-section-title">State ({entityCount} entities, {changeLog.length} changes)</h3>
        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', lineHeight: 1.6, opacity: 0.7, maxHeight: '200px', overflow: 'auto' }}>
          {changeLog.length === 0 ? (
            <span style={{ opacity: 0.5 }}>Make changes to see the log...</span>
          ) : (
            changeLog.map((line, i) => <div key={i}>{line}</div>)
          )}
        </div>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">How history() works</h3>
        <pre className="code-block"><code>{`// history() plugin registers middleware that:
// 1. Before execute → push current store to undo stack
// 2. On undo command → pop from undo stack, push to redo
// 3. On redo command → pop from redo stack, push to undo
// 4. On any new command → clear the redo stack

// The stack stores full NormalizedData snapshots.
// This is simple and correct — for large stores,
// structural sharing keeps memory manageable.`}</code></pre>
      </div>
    </div>
  )
}
