import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/composePattern'
import { navV } from '../../interactive-os/axes/navV'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'listbox',
    childRole: 'option',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    ariaAttributes: () => ({}),
  },
  navV,
)

const plugins = [core(), focusRecovery()]

export default function PageNavV() {
  const [data, setData] = useState<NormalizedData>(axisListData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">navV — Vertical Navigation</h2>
        <p className="page-desc">Single-axis vertical navigation. Binds only 4 keys: ↑ ↓ Home End.</p>
      </div>
      <div className="page-keys">
        <kbd>↑</kbd> <span className="key-hint">previous</span>{' '}
        <kbd>↓</kbd> <span className="key-hint">next</span>{' '}
        <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
        <kbd>End</kbd> <span className="key-hint">last</span>
      </div>
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="navV demo list"
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
          <code>navV</code> is a static axis object that binds exactly 4 keys:
          ArrowDown → focusNext, ArrowUp → focusPrev, Home → focusFirst, End → focusLast.
          Horizontal arrows (← →) and all other keys are unbound — pressing them does nothing.
          This makes navV composable with other axes without conflict.
        </p>
      </div>
    </div>
  )
}
