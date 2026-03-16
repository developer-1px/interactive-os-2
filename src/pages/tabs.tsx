import { TabList } from '../interactive-os/ui/tab-list'
import { createStore } from '../interactive-os/core/normalized-store'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'

const tabData = createStore({
  entities: {
    overview: { id: 'overview', data: { label: 'overview' } },
    api: { id: 'api', data: { label: 'api' } },
    examples: { id: 'examples', data: { label: 'examples' } },
    changelog: { id: 'changelog', data: { label: 'changelog' } },
  },
  relationships: {
    [ROOT_ID]: ['overview', 'api', 'examples', 'changelog'],
  },
})

const tabContent: Record<string, string> = {
  overview: 'interactive-os is a keyboard-first ARIA framework with a plugin architecture for composable navigation, focus, and CRUD operations.',
  api: 'Core APIs: useAria(behavior, data, plugins) — Aria component — createStore(data) — Plugin interface.',
  examples: 'See the other pages in this demo for live examples of each APG pattern.',
  changelog: 'v0.1.0 — Initial release. TreeGrid, Listbox, Tabs, Menu, Accordion, Disclosure.',
}

export default function TabsPage() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Tabs</h2>
        <p className="page-desc">Tab list following W3C APG tablist pattern</p>
      </div>
      <div className="page-keys">
        <kbd>←→</kbd> <span className="key-hint">switch</span>{' '}
        <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
        <kbd>End</kbd> <span className="key-hint">last</span>
      </div>
      <div className="card">
        <div style={{ borderBottom: '1px solid var(--border-mid)' }}>
          <TabList
            data={tabData}
            renderItem={(tab, state: NodeState) => (
              <div className={`tab${state.focused ? ' tab--focused' : ''}`}>
                {(tab.data as Record<string, unknown>)?.label as string}
              </div>
            )}
          />
        </div>
        <div className="tab-content" id="tab-panel">
          {Object.entries(tabContent).map(([key, value]) => (
            <span key={key}>{'>'} {value}<br /></span>
          )).slice(0, 1)}
          {'>'} Navigation follows W3C APG tablist pattern.
        </div>
      </div>
    </div>
  )
}
