import { Up, Down } from '../shared/kbdIcons'
import { ax } from '@styles/ax'
import { ListBox } from '@os/ui/ListBox'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import { useStore } from '@os/store/useStore'
import { history } from '@os/plugins/history'
import { crud } from '@os/plugins/crud'
import { clipboard } from '@os/plugins/clipboard'
import { rename } from '@os/plugins/rename'
import { dnd } from '@os/plugins/dnd'
import { focusRecovery } from '@os/plugins/focusRecovery'

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
  const [data, setData] = useStore(noteData)

  return (
    <>
      <div className={`page-keys ${ax({ layout: 'wrap' })}`}>
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>⌘⇧Z</kbd> <span className="key-hint">redo</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">create</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>F2</kbd> <span className="key-hint">rename</span>{' '}
        <kbd>Alt+<Up /><Down /></kbd> <span className="key-hint">reorder</span>
      </div>
      <div className={`card ${ax({ scroll: 'hidden' })}`}>
        <ListBox
          data={data}
          onChange={setData}
          enableEditing
          plugins={plugins}
        />
      </div>
    </>
  )
}
