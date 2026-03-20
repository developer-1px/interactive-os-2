import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/composePattern'
import { selectExtended } from '../../interactive-os/axes/selectExtended'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
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
  selectExtended,
)

const plugins = [core(), focusRecovery()]

export default function PageSelectExtended() {
  const [data, setData] = useState<NormalizedData>(axisListData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">selectExtended — Range Selection</h2>
        <p className="page-desc">Single-axis range selection. Binds only Shift+Arrow combos: extend selection up/down/to first/last. Plain arrows are unbound.</p>
      </div>
      <div className="page-keys">
        <kbd>Shift+↑</kbd> <span className="key-hint">extend up</span>{' '}
        <kbd>Shift+↓</kbd> <span className="key-hint">extend down</span>{' '}
        <kbd>Shift+Home</kbd> <span className="key-hint">extend to first</span>{' '}
        <kbd>Shift+End</kbd> <span className="key-hint">extend to last</span>
      </div>
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="selectExtended demo list"
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
          <code>selectExtended</code> is a static axis object that binds 4 Shift+key combos:
          Shift+ArrowDown → extendSelection('next'), Shift+ArrowUp → extendSelection('prev'),
          Shift+Home → extendSelection('first'), Shift+End → extendSelection('last').
          Plain arrow keys are completely unbound — click an item first to establish an anchor,
          then use Shift+↓ to extend the selection downward. This demonstrates that range
          selection is a separate axis from both navigation and toggle selection.
        </p>
      </div>
    </div>
  )
}
