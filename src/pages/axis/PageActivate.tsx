import { useState, useCallback } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/composePattern'
import { activate } from '../../interactive-os/axes/activate'
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
    activateOnClick: true,
    ariaAttributes: () => ({}),
  },
  activate,
)

const plugins = [core(), focusRecovery()]

export default function PageActivate() {
  const [data, setData] = useState<NormalizedData>(axisListData)
  const [lastActivated, setLastActivated] = useState<string | null>(null)

  const handleActivate = useCallback((nodeId: string) => {
    setLastActivated(nodeId)
  }, [])

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">activate — Activation Axis</h2>
        <p className="page-desc">Single-axis activation. Binds Enter and Space to ctx.activate().</p>
      </div>
      <div className="page-keys">
        <kbd>Enter</kbd> <span className="key-hint">activate</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">activate</span>
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
          aria-label="activate demo list"
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
          <code>activate</code> is a static axis object that binds exactly 2 keys:
          Enter → ctx.activate(), Space → ctx.activate().
          Navigation keys are not included — this axis is designed to compose with
          <code>navV</code> or <code>navH</code> for a complete pattern.
          The <code>onActivate</code> callback fires with the focused node id whenever
          activation is triggered by keyboard or click (<code>activateOnClick: true</code>).
        </p>
      </div>
    </div>
  )
}
