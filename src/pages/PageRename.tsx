import { useState } from 'react'
import { ListBox } from '../interactive-os/ui/ListBox'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { core } from '../interactive-os/plugins/core'
import { history } from '../interactive-os/plugins/history'
import { rename } from '../interactive-os/plugins/rename'
import { focusRecovery } from '../interactive-os/plugins/focus-recovery'

const bookmarkData = createStore({
  entities: {
    gh: { id: 'gh', data: { label: 'GitHub', url: 'github.com' } },
    mdn: { id: 'mdn', data: { label: 'MDN Web Docs', url: 'developer.mozilla.org' } },
    apg: { id: 'apg', data: { label: 'ARIA APG', url: 'w3.org/WAI/ARIA/apg' } },
    ts: { id: 'ts', data: { label: 'TypeScript', url: 'typescriptlang.org' } },
    react: { id: 'react', data: { label: 'React Docs', url: 'react.dev' } },
  },
  relationships: {
    [ROOT_ID]: ['gh', 'mdn', 'apg', 'ts', 'react'],
  },
})

const plugins = [core(), rename(), history(), focusRecovery()]

export default function PageRename() {
  const [data, setData] = useState<NormalizedData>(bookmarkData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Rename</h2>
        <p className="page-desc">
          Inline rename with F2. Press Enter to confirm or Escape to cancel.
          The previous value is fully restored on undo.
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>F2</kbd> <span className="key-hint">rename</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">confirm</span>{' '}
        <kbd>Esc</kbd> <span className="key-hint">cancel</span>{' '}
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
                <span className="list-item__label">{d?.label as string}</span>
                <span className="list-item__desc">{d?.url as string}</span>
              </div>
            )
          }}
        />
      </div>
      <div className="page-section">
        <h3 className="page-section-title">Plugin: rename()</h3>
        <p className="page-desc">
          The <code>rename</code> plugin adds <code>startRename</code>, <code>confirmRename</code>,
          and <code>cancelRename</code> commands. The UI component enters an inline editing mode
          where the node label becomes an input field. The previous value is captured for undo.
        </p>
      </div>
    </div>
  )
}
