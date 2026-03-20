import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/composePattern'
import { focusTrap } from '../../interactive-os/axes/focusTrap'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'dialog',
    childRole: 'group',
    focusStrategy: { type: 'natural-tab-order', orientation: 'vertical' },
    ariaAttributes: () => ({}),
  },
  focusTrap,
)

const plugins = [core(), focusRecovery()]

export default function PageFocusTrap() {
  const [data, setData] = useState<NormalizedData>(axisListData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">focusTrap — Focus Trap Axis</h2>
        <p className="page-desc">Simplest possible axis: one key, one action. Escape → ctx.collapse().</p>
      </div>
      <div className="page-keys">
        <kbd>Esc</kbd> <span className="key-hint">escape / collapse</span>
      </div>
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="focusTrap demo dialog"
        >
          <Aria.Item render={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
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
          <code>focusTrap</code> is the simplest axis in the system: it binds only one key.
          Escape → ctx.collapse(). When composing a modal dialog or dropdown pattern,
          this axis provides the escape hatch — pressing Escape signals the container to
          collapse/close. It contains no navigation, no selection, no activation.
          Pure single-purpose: one key, one action.
        </p>
      </div>
    </div>
  )
}
