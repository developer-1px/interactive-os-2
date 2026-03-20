import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/compose-pattern'
import { selectToggle } from '../../interactive-os/axes/select-toggle'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focus-recovery'
import type { Entity, NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'listbox',
    childRole: 'option',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    selectionMode: 'multiple',
    ariaAttributes: (_node: Entity, state: NodeState) => ({ 'aria-selected': String(state.selected) }),
  },
  selectToggle,
)

const plugins = [core(), focusRecovery()]

export default function PageSelectToggle() {
  const [data, setData] = useState<NormalizedData>(axisListData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">selectToggle — Toggle Selection</h2>
        <p className="page-desc">Single-axis selection toggle. Binds only 1 key: Space → toggleSelect. Arrow keys are unbound — this axis is navigation-free.</p>
      </div>
      <div className="page-keys">
        <kbd>Space</kbd> <span className="key-hint">toggle select</span>
      </div>
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="selectToggle demo list"
        >
          <Aria.Item render={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
              state.selected && !state.focused && 'list-item--selected',
            ].filter(Boolean).join(' ')
            return (
              <div className={cls}>
                <span className="list-item__label">{d?.label as string}</span>
              </div>
            )
          }} />
        </Aria>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">How it works</h3>
        <p className="page-desc">
          <code>selectToggle</code> is a static axis object that binds exactly 1 key:
          Space → toggleSelect. Arrow keys (↑ ↓) are completely unbound — pressing them does nothing
          because this page intentionally excludes <code>navV</code>. This demonstrates axis isolation:
          selection behavior exists independently of navigation behavior. Compose both axes together
          to get a full listbox.
        </p>
      </div>
    </div>
  )
}
