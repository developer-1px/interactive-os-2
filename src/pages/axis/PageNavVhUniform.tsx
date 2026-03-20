import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/compose-pattern'
import { navVhUniform } from '../../interactive-os/axes/nav-vh-uniform'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focus-recovery'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'radiogroup',
    childRole: 'radio',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    ariaAttributes: () => ({}),
  },
  navVhUniform({ wrap: true }),
)

const plugins = [core(), focusRecovery()]

export default function PageNavVhUniform() {
  const [data, setData] = useState<NormalizedData>(axisListData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">navVhUniform — Uniform 4-Arrow Navigation</h2>
        <p className="page-desc">All 4 arrow keys map to the same prev/next commands. Useful for radio groups and carousels.</p>
      </div>
      <div className="page-keys">
        <kbd>↑</kbd> <span className="key-hint">previous</span>{' '}
        <kbd>↓</kbd> <span className="key-hint">next</span>{' '}
        <kbd>←</kbd> <span className="key-hint">previous</span>{' '}
        <kbd>→</kbd> <span className="key-hint">next</span>
      </div>
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="navVhUniform demo radio group"
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
          <code>navVhUniform</code> is a factory that maps all 4 arrows identically:
          ↑ and ← → focusPrev, ↓ and → → focusNext.
          The <code>{'{ wrap: true }'}</code> option enables circular navigation — pressing next on the last
          item wraps back to the first, and pressing prev on the first item wraps to the last.
          This matches the ARIA spec for radio groups where all 4 arrows cycle through options.
        </p>
      </div>
    </div>
  )
}
