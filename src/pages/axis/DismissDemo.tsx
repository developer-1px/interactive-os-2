import { useState } from 'react'
import { Aria } from '../../interactive-os/primitives/aria'
import { composePattern } from '../../interactive-os/pattern/composePattern'
import { dismiss } from '../../interactive-os/axis/dismiss'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
import type { NormalizedData } from '../../interactive-os/store/types'
import type { NodeState } from '../../interactive-os/pattern/types'
import { axisListData } from './axis-demo-data'

const plugins = [core(), focusRecovery()]

export default function DismissDemo() {
  const [escape, setEscape] = useState(true)
  const [data, setData] = useState<NormalizedData>(axisListData)

  const behavior = composePattern(
    {
      role: 'dialog',
      childRole: 'group',
      ariaAttributes: () => ({}),
    },
    dismiss({ escape }),
  )

  return (
    <>
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
        <Aria behavior={behavior} data={data} plugins={plugins} onChange={setData} aria-label="dismiss demo">
          <Aria.Item render={(props, node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = ['list-item', state.focused && 'list-item--focused'].filter(Boolean).join(' ')
            return <div {...props} className={cls}>{d?.label as string}</div>
          }} />
        </Aria>
      </div>
    </>
  )
}
