import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/compose-pattern'
import { navH } from '../../interactive-os/axes/nav-h'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focus-recovery'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'toolbar',
    childRole: 'button',
    focusStrategy: { type: 'roving-tabindex', orientation: 'horizontal' },
    ariaAttributes: () => ({}),
  },
  navH(),
)

const plugins = [core(), focusRecovery()]

export default function PageNavH() {
  const [data, setData] = useState<NormalizedData>(axisListData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">navH — Horizontal Navigation</h2>
        <p className="page-desc">Single-axis horizontal navigation. Binds only 4 keys: ← → Home End.</p>
      </div>
      <div className="page-keys">
        <kbd>←</kbd> <span className="key-hint">previous</span>{' '}
        <kbd>→</kbd> <span className="key-hint">next</span>{' '}
        <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
        <kbd>End</kbd> <span className="key-hint">last</span>
      </div>
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="navH demo toolbar"
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
          <code>navH</code> is a factory function (call as <code>navH()</code>) that binds:
          ArrowRight → focusNext, ArrowLeft → focusPrev, Home → focusFirst, End → focusLast.
          It accepts an optional <code>{'{ wrap: true }'}</code> option to enable circular navigation.
          Vertical arrows (↑ ↓) are unbound and do nothing — making navH composable with navV in 2D layouts.
        </p>
      </div>
    </div>
  )
}
