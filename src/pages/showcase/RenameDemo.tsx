import { useState } from 'react'
import { ax } from '@styles/ax'
import { ListBox } from '@os/ui/ListBox'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import type { ItemSlots } from '@os/ui/types'
import { Up, Down } from '../shared/kbdIcons'
import { history } from '@os/plugins/history'
import { rename } from '@os/plugins/rename'
import { focusRecovery } from '@os/plugins/focusRecovery'

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

const itemSlots: ItemSlots = {
  rightContent: (node) => {
    const d = node.data as Record<string, unknown>
    return <span className={ax({ text: 'muted', textStyle: 'caption' })}>{d?.url as string}</span>
  },
}

export default function RenameDemo() {
  const [data, setData] = useState<NormalizedData>(bookmarkData)

  return (
    <>
      <div className="page-keys inline-flex flex-wrap items-center">
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>F2</kbd> <span className="key-hint">rename</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">confirm</span>{' '}
        <kbd>Esc</kbd> <span className="key-hint">cancel</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>
      </div>
      <div className="card overflow-hidden">
        <ListBox
          data={data}
          onChange={setData}
          enableEditing
          plugins={plugins}
          itemSlots={itemSlots}
        />
      </div>
    </>
  )
}
