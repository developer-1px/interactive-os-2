import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgTabs } from './apg-data'
import { TabList } from '../interactive-os/ui/TabList'
import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NodeState } from '../interactive-os/pattern/types'

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

export default function PageTabs() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Tabs</h2>
        <p className="page-desc">Tab navigation following W3C APG tabs pattern</p>
      </div>
      <div className="page-keys">
        <kbd>←→</kbd> <span className="key-hint">switch</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">activate</span>{' '}
        <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
        <kbd>End</kbd> <span className="key-hint">last</span>
      </div>
      <div className="card">
        <div style={{ borderBottom: '1px solid var(--border-mid)' }}>
          <TabList
            data={tabData}
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
