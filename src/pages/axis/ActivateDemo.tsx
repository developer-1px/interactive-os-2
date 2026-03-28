import { useState, useCallback } from 'react'
import { Up, Down } from '../kbdIcons'
import { Aria } from '../../interactive-os/primitives/aria'
import { composePattern } from '../../interactive-os/pattern/composePattern'
import { navigate } from '../../interactive-os/axis/navigate'
import { activate } from '../../interactive-os/axis/activate'
import { select } from '../../interactive-os/axis/select'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
import type { NormalizedData } from '../../interactive-os/store/types'
import type { NodeState } from '../../interactive-os/pattern/types'
import { axisListData } from './axis-demo-data'

const plugins = [focusRecovery()]

export default function ActivateDemo() {
  const [onClick, setOnClick] = useState(false)
  const [selectionFollowsFocus, setSelectionFollowsFocus] = useState(false)
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
    ...(selectionFollowsFocus ? [select({ mode: 'single', selectionFollowsFocus: true })] : []),
    activate({ onClick, activationFollowsSelection: selectionFollowsFocus, toggleExpand }),
    navigate({ orientation: 'vertical' }),
  )

  const handleActivate = useCallback((nodeId: string) => {
    setLastActivated(nodeId)
  }, [])

  return (
    <>
      <div className="page-keys">
        <label style={{ marginRight: 12 }}>
          <input type="checkbox" checked={onClick} onChange={(e) => setOnClick(e.target.checked)} />
          {' '}onClick
        </label>
        <label style={{ marginRight: 12 }}>
          <input type="checkbox" checked={selectionFollowsFocus} onChange={(e) => setSelectionFollowsFocus(e.target.checked)} />
          {' '}selectionFollowsFocus
        </label>
        <label>
          <input type="checkbox" checked={toggleExpand} onChange={(e) => setToggleExpand(e.target.checked)} />
          {' '}toggleExpand
        </label>
      </div>
      <div className="page-keys">
        <kbd>Enter</kbd> <span className="key-hint">activate</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">activate</span>{' '}
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>
        {selectionFollowsFocus && <span className="key-hint" style={{ opacity: 0.7 }}> + auto-activate on focus</span>}
        {onClick && <span className="key-hint" style={{ opacity: 0.7 }}> + click activates</span>}
      </div>
      {lastActivated && (
        <div className="page-keys" style={{ opacity: 0.7 }}>
          Last activated: <strong>{lastActivated}</strong>
        </div>
      )}
      <div className="card">
        <Aria behavior={behavior} data={data} plugins={plugins} onChange={setData} onActivate={handleActivate} aria-label="activate demo">
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
