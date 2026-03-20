import { useState, useCallback } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/composePattern'
import { navigate } from '../../interactive-os/axes/navigate'
import { activate } from '../../interactive-os/axes/activate'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData } from './axis-demo-data'

const plugins = [core(), focusRecovery()]

export default function PageActivate() {
  const [onClick, setOnClick] = useState(false)
  const [followFocus, setFollowFocus] = useState(false)
  const [toggleExpand, setToggleExpand] = useState(false)
  const [data, setData] = useState<NormalizedData>(axisListData)
  const [lastActivated, setLastActivated] = useState<string | null>(null)

  const behavior = composePattern(
    {
      role: 'listbox',
      childRole: 'option',
      ariaAttributes: (_node, state: NodeState) => {
        const attrs: Record<string, string> = {}
        if (state.expanded !== undefined) attrs['aria-expanded'] = String(state.expanded)
        return attrs
      },
    },
    activate({ onClick, followFocus, toggleExpand }),
    navigate({ orientation: 'vertical' }),
  )

  const handleActivate = useCallback((nodeId: string) => {
    setLastActivated(nodeId)
  }, [])

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">activate()</h2>
        <p className="page-desc">
          Activation axis. Enter/Space triggers activation. Toggle options to see how onClick, followFocus, and toggleExpand change behavior.
        </p>
      </div>
      <div className="page-keys">
        <label style={{ marginRight: 12 }}>
          <input type="checkbox" checked={onClick} onChange={(e) => setOnClick(e.target.checked)} />
          {' '}onClick
        </label>
        <label style={{ marginRight: 12 }}>
          <input type="checkbox" checked={followFocus} onChange={(e) => setFollowFocus(e.target.checked)} />
          {' '}followFocus
        </label>
        <label>
          <input type="checkbox" checked={toggleExpand} onChange={(e) => setToggleExpand(e.target.checked)} />
          {' '}toggleExpand
        </label>
      </div>
      <div className="page-keys">
        <kbd>Enter</kbd> <span className="key-hint">activate</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">activate</span>{' '}
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>
        {followFocus && <span className="key-hint" style={{ opacity: 0.7 }}> + auto-activate on focus</span>}
        {onClick && <span className="key-hint" style={{ opacity: 0.7 }}> + click activates</span>}
      </div>
      {lastActivated && (
        <div className="page-keys" style={{ opacity: 0.7 }}>
          Last activated: <strong>{lastActivated}</strong>
        </div>
      )}
      <div className="card">
        <Aria behavior={behavior} data={data} plugins={plugins} onChange={setData} onActivate={handleActivate} aria-label="activate demo">
          <Aria.Item render={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = ['list-item', state.focused && 'list-item--focused'].filter(Boolean).join(' ')
            return <div className={cls}>{d?.label as string}</div>
          }} />
        </Aria>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">About activate()</h3>
        <p className="page-desc">
          The <code>activate()</code> axis binds Enter/Space. Options: <code>onClick</code> (click triggers activation),
          <code>followFocus</code> (focus movement auto-activates — used in tabs),
          <code>toggleExpand</code> (activation toggles expand/collapse — used in accordion, disclosure, switch).
        </p>
      </div>
    </div>
  )
}
