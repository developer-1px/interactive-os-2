import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/composePattern'
import { trap } from '../../interactive-os/axes/trap'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData } from './axis-demo-data'

const plugins = [core(), focusRecovery()]

export default function PageTrap() {
  const [escape, setEscape] = useState(true)
  const [data, setData] = useState<NormalizedData>(axisListData)

  const behavior = composePattern(
    {
      role: 'dialog',
      childRole: 'group',
      ariaAttributes: () => ({}),
    },
    trap({ escape }),
  )

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">trap()</h2>
        <p className="page-desc">
          Focus containment axis. Controls how users escape from modal/contained contexts.
          Used in dialog and alertdialog patterns.
        </p>
      </div>
      <div className="page-keys">
        <label>
          <input type="checkbox" checked={escape} onChange={(e) => setEscape(e.target.checked)} />
          {' '}escape
        </label>
      </div>
      <div className="page-keys">
        {escape ? (
          <><kbd>Esc</kbd> <span className="key-hint">collapse / close</span></>
        ) : (
          <span className="key-hint" style={{ opacity: 0.5 }}>No keys bound (escape disabled)</span>
        )}
      </div>
      <div className="card">
        <Aria behavior={behavior} data={data} plugins={plugins} onChange={setData} aria-label="trap demo">
          <Aria.Item render={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = ['list-item', state.focused && 'list-item--focused'].filter(Boolean).join(' ')
            return <div className={cls}>{d?.label as string}</div>
          }} />
        </Aria>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">About trap()</h3>
        <p className="page-desc">
          The <code>trap()</code> axis binds <code>Escape</code> to collapse/close.
          The <code>escape</code> option (default true) can be disabled.
          Future options: <code>tabCycle</code> (Tab wraps inside container) and
          <code>lightDismiss</code> (click outside closes).
        </p>
      </div>
    </div>
  )
}
