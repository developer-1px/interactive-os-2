import { Up, Down, Left, Right } from '../shared/kbdIcons'
import { ax } from '@styles/ax'
import { TreeGrid } from '@os/ui/TreeGrid'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import { useStore } from '@os/store/useStore'
import { history } from '@os/plugins/history'
import { crud } from '@os/plugins/crud'
import { clipboard } from '@os/plugins/clipboard'
import { focusRecovery } from '@os/plugins/focusRecovery'

const colorData = createStore({
  entities: {
    warm: { id: 'warm', data: { label: 'Warm', type: 'group' } },
    red: { id: 'red', data: { label: 'Red', type: 'item' } },
    orange: { id: 'orange', data: { label: 'Orange', type: 'item' } },
    amber: { id: 'amber', data: { label: 'Amber', type: 'item' } },
    cool: { id: 'cool', data: { label: 'Cool', type: 'group' } },
    green: { id: 'green', data: { label: 'Green', type: 'item' } },
    blue: { id: 'blue', data: { label: 'Blue', type: 'item' } },
    violet: { id: 'violet', data: { label: 'Violet', type: 'item' } },
  },
  relationships: {
    [ROOT_ID]: ['warm', 'cool'],
    warm: ['red', 'orange', 'amber'],
    cool: ['green', 'blue', 'violet'],
  },
})

const plugins = [crud(), clipboard(), history(), focusRecovery()]

export default function ClipboardDemo() {
  const [data, setData] = useStore(colorData)

  return (
    <>
      <div className="page-keys inline-flex flex-wrap items-center">
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd><Left /><Right /></kbd> <span className="key-hint">expand</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>{' '}
        <kbd>⌘C</kbd> <span className="key-hint">copy</span>{' '}
        <kbd>⌘X</kbd> <span className="key-hint">cut</span>{' '}
        <kbd>⌘V</kbd> <span className="key-hint">paste</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>
      </div>
      <div className={`card ${ax({ scroll: 'hidden' })}`}>
        <TreeGrid
          data={data}
          onChange={setData}
          enableEditing
          plugins={plugins}
        />
      </div>
    </>
  )
}
