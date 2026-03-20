import { useState, useCallback } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/composePattern'
import { activateFollowFocus } from '../../interactive-os/axes/activateFollowFocus'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'tablist',
    childRole: 'tab',
    focusStrategy: { type: 'roving-tabindex', orientation: 'horizontal' },
    activateOnClick: true,
    followFocus: true,
    selectionMode: 'single',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-selected': String(state.selected),
    }),
  },
  activateFollowFocus,
)

const plugins = [core(), focusRecovery()]

export default function PageActivateFollowFocus() {
  const [data, setData] = useState<NormalizedData>(axisListData)
  const [lastActivated, setLastActivated] = useState<string | null>(null)

  const handleActivate = useCallback((nodeId: string) => {
    setLastActivated(nodeId)
  }, [])

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">activateFollowFocus — Follow-Focus Activation</h2>
        <p className="page-desc">Same keyMap as activate (Enter/Space), but metadata <code>followFocus: true</code> triggers onActivate on every focus move.</p>
      </div>
      <div className="page-keys">
        <kbd>Enter</kbd> <span className="key-hint">activate</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">activate</span>{' '}
        <span className="key-hint">+ focus move auto-activates</span>
      </div>
      {lastActivated && (
        <div className="page-status">Last activated: {lastActivated}</div>
      )}
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          onActivate={handleActivate}
          aria-label="activateFollowFocus demo tablist"
        >
          <Aria.Item render={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
              state.selected && 'list-item--selected',
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
          <code>activateFollowFocus</code> has the same keyMap as <code>activate</code>:
          Enter → ctx.activate(), Space → ctx.activate().
          The difference is the behavior metadata: <code>followFocus: true</code> tells
          the engine to call <code>onActivate</code> automatically whenever focus moves
          to a new node — no explicit key press needed.
          This pattern is used for tablists where switching tabs should not require an
          extra Enter press. Click different items to see auto-activation in action.
        </p>
      </div>
    </div>
  )
}
