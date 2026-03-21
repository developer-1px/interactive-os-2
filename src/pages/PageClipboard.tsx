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
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'

const colorData = createStore({
  entities: {
    red: { id: 'red', data: { label: 'Red', hex: '#ef4444' } },
    orange: { id: 'orange', data: { label: 'Orange', hex: '#f97316' } },
    amber: { id: 'amber', data: { label: 'Amber', hex: '#f59e0b' } },
    green: { id: 'green', data: { label: 'Green', hex: '#22c55e' } },
    blue: { id: 'blue', data: { label: 'Blue', hex: '#3b82f6' } },
    violet: { id: 'violet', data: { label: 'Violet', hex: '#8b5cf6' } },
  },
  relationships: {
    [ROOT_ID]: ['red', 'orange', 'amber', 'green', 'blue', 'violet'],
  },
})

const plugins = [core(), crud(), clipboard(), history(), focusRecovery()]

export default function PageClipboard() {
  const [data, setData] = useState<NormalizedData>(colorData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Clipboard</h2>
        <p className="page-desc">
          Copy, cut, and paste items. Copied items get new IDs; cut items are moved.
          Multi-select then copy/paste to duplicate several items at once.
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>{' '}
        <kbd>⌘C</kbd> <span className="key-hint">copy</span>{' '}
        <kbd>⌘X</kbd> <span className="key-hint">cut</span>{' '}
        <kbd>⌘V</kbd> <span className="key-hint">paste</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>
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
                <span
                  className="list-item__dot"
                  style={{ background: d?.hex as string }}
                />
                <span className="list-item__label">{d?.label as string}</span>
                <span className="list-item__desc">{d?.hex as string}</span>
              </div>
            )
          }}
        />
      </div>
      <div className="page-section">
        <h3 className="page-section-title">Plugin: clipboard()</h3>
        <p className="page-desc">
          The <code>clipboard</code> plugin adds <code>copy</code>, <code>cut</code>, and <code>paste</code> commands.
          Copy clones entities with fresh IDs. Cut moves entities on paste.
        </p>
      </div>
    </div>
  )
}
