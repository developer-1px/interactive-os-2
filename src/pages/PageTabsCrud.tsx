import { useState } from 'react'
import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgTabs } from './apg-data'
import { TabList } from '../interactive-os/ui/TabList'
import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData } from '../interactive-os/store/types'
import type { NodeState } from '../interactive-os/pattern/types'
import { core } from '../interactive-os/plugins/core'
import { history } from '../interactive-os/plugins/history'
import { crud } from '../interactive-os/plugins/crud'
import { clipboard } from '../interactive-os/plugins/clipboard'
import { rename } from '../interactive-os/plugins/rename'
import { dnd } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'

const tabData = createStore({
  entities: {
    overview: { id: 'overview', data: { label: 'Overview' } },
    api: { id: 'api', data: { label: 'API' } },
    examples: { id: 'examples', data: { label: 'Examples' } },
    changelog: { id: 'changelog', data: { label: 'Changelog' } },
  },
  relationships: {
    [ROOT_ID]: ['overview', 'api', 'examples', 'changelog'],
  },
})

const plugins = [core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

export default function PageTabsCrud() {
  const [data, setData] = useState<NormalizedData>(tabData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Tabs</h2>
        <p className="page-desc">Tab list with full CRUD — add, close, rename, copy/paste, reorder, undo</p>
      </div>
      <div className="page-keys">
        <kbd>←→</kbd> <span className="key-hint">switch</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">close tab</span>{' '}
        <kbd>⌘C</kbd> <span className="key-hint">copy</span>{' '}
        <kbd>⌘V</kbd> <span className="key-hint">paste</span>{' '}
        <kbd>F2</kbd> <span className="key-hint">rename</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>Alt←→</kbd> <span className="key-hint">reorder</span>
      </div>
      <div className="card">
        <div style={{ borderBottom: '1px solid var(--border-mid)' }}>
          <TabList
            data={data}
            onChange={setData}
            enableEditing
            plugins={plugins}
            renderItem={(props, tab, state: NodeState) => {
              const d = tab.data as Record<string, unknown>
              return (
                <div {...props} className={`tab${state.focused ? ' tab--focused' : ''}${state.selected ? ' tab--selected' : ''}`}>
                  {d?.label as string}
                </div>
              )
            }}
          />
        </div>
      </div>
      <ApgKeyboardTable {...apgTabs} />
    </div>
  )
}
