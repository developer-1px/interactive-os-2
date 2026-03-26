import { useState } from 'react'
import { ListBox } from '../interactive-os/ui/ListBox'
import { Aria } from '../interactive-os/primitives/aria'
import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData } from '../interactive-os/store/types'
import type { NodeState } from '../interactive-os/pattern/types'
import { Up, Down } from './kbdIcons'
import { history } from '../interactive-os/plugins/history'
import { rename } from '../interactive-os/plugins/rename'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'

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

const plugins = [rename(), history(), focusRecovery()]

export default function RenameDemo() {
  const [data, setData] = useState<NormalizedData>(bookmarkData)

  return (
    <>
      <div className="page-keys">
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
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
          renderItem={(props, item, state: NodeState) => {
            const d = item.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
              state.selected && !state.focused && 'list-item--selected',
            ].filter(Boolean).join(' ')

            return (
              <div {...props} className={cls}>
                <Aria.Editable field="label">
                  <span className="list-item__label">{d?.label as string}</span>
                </Aria.Editable>
                <span className="list-item__desc">{d?.url as string}</span>
              </div>
            )
          }}
        />
      </div>
    </>
  )
}
