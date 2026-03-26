import { useState } from 'react'
import { Up, Down } from './kbdIcons'
import { ListBox } from '../interactive-os/ui/ListBox'
import { Aria } from '../interactive-os/primitives/aria'
import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData } from '../interactive-os/store/types'
import type { NodeState } from '../interactive-os/pattern/types'
import { history } from '../interactive-os/plugins/history'
import { crud } from '../interactive-os/plugins/crud'
import { clipboard } from '../interactive-os/plugins/clipboard'
import { rename } from '../interactive-os/plugins/rename'
import { dnd } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'

const noteData = createStore({
  entities: {
    note1: { id: 'note1', data: { label: 'Meeting notes' } },
    note2: { id: 'note2', data: { label: 'API design draft' } },
    note3: { id: 'note3', data: { label: 'Bug triage list' } },
    note4: { id: 'note4', data: { label: 'Sprint retrospective' } },
    note5: { id: 'note5', data: { label: 'Release checklist' } },
    note6: { id: 'note6', data: { label: 'Onboarding guide' } },
  },
  relationships: {
    [ROOT_ID]: ['note1', 'note2', 'note3', 'note4', 'note5', 'note6'],
  },
})

const plugins = [crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

export default function HistoryDemo() {
  const [data, setData] = useState<NormalizedData>(noteData)

  return (
    <>
      <div className="page-keys">
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>⌘⇧Z</kbd> <span className="key-hint">redo</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">create</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>F2</kbd> <span className="key-hint">rename</span>{' '}
        <kbd>Alt+<Up /><Down /></kbd> <span className="key-hint">reorder</span>
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
              </div>
            )
          }}
        />
      </div>
    </>
  )
}
