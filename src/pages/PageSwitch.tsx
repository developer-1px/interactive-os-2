import { useState } from 'react'
import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgSwitch } from './apg-data'
import { SwitchGroup } from '../interactive-os/ui/SwitchGroup'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'

const initialData: NormalizedData = createStore({
  entities: {
    'dark-mode': { id: 'dark-mode', data: { label: 'Dark Mode' } },
    notifications: { id: 'notifications', data: { label: 'Notifications' } },
    'auto-save': { id: 'auto-save', data: { label: 'Auto-save' } },
    analytics: { id: 'analytics', data: { label: 'Analytics' } },
    'beta-features': { id: 'beta-features', data: { label: 'Beta Features' } },
  },
  relationships: {
    [ROOT_ID]: ['dark-mode', 'notifications', 'auto-save', 'analytics', 'beta-features'],
  },
})

export default function PageSwitch() {
  const [data, setData] = useState<NormalizedData>(initialData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Switch</h2>
        <p className="page-desc">Toggle settings following W3C APG switch pattern</p>
      </div>
      <div className="page-keys">
        <kbd>Space</kbd> <span className="key-hint">toggle</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">toggle</span>{' '}
        <kbd>Tab</kbd> <span className="key-hint">focus next switch</span>
      </div>
      <div className="card">
        <SwitchGroup
          data={data}
          onChange={setData}
          renderItem={(props, item, state: NodeState) => {
            const d = item.data as Record<string, unknown>
            const checked = state.expanded ?? false
            return (
              <div {...props} className={`switch-row${state.focused ? ' switch-row--focused' : ''}`}>
                <span className="switch-label">{d?.label as string}</span>
                <span
                  className={`switch-toggle${checked ? ' switch-toggle--on' : ''}`}
                  aria-hidden="true"
                >
                  <span className="switch-thumb" />
                </span>
              </div>
            )
          }}
        />
      </div>
      <ApgKeyboardTable {...apgSwitch} />
    </div>
  )
}
