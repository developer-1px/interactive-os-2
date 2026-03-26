import { useState } from 'react'
import { Up, Down } from '../kbdIcons'
import { Aria } from '../../interactive-os/primitives/aria'
import { composePattern } from '../../interactive-os/pattern/composePattern'
import { tab } from '../../interactive-os/axis/tab'
import type { TabStrategy } from '../../interactive-os/axis/tab'
import { navigate } from '../../interactive-os/axis/navigate'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
import type { NormalizedData } from '../../interactive-os/store/types'
import type { NodeState } from '../../interactive-os/pattern/types'
import { axisListData } from './axis-demo-data'

const plugins = [focusRecovery()]

export default function TabDemo() {
  const [strategy, setStrategy] = useState<TabStrategy>('escape')
  const [data, setData] = useState<NormalizedData>(axisListData)

  const behavior = composePattern(
    { role: 'listbox', childRole: 'option', ariaAttributes: () => ({}) },
    tab(strategy),
    navigate({ orientation: 'vertical' }),
  )

  return (
    <>
      <div className="page-keys">
        <label>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value as TabStrategy)} style={{ marginRight: 4 }}>
            <option value="native">native</option>
            <option value="flow">flow</option>
            <option value="loop">loop</option>
            <option value="escape">escape</option>
          </select>
          strategy
        </label>
      </div>
      <div className="page-keys">
        {strategy === 'native' ? (
          <span className="key-hint" style={{ opacity: 0.5 }}>No intervention — browser default Tab</span>
        ) : strategy === 'flow' ? (
          <>
            <kbd>Tab</kbd> <span className="key-hint">DOM order (all tabbable)</span>
          </>
        ) : strategy === 'loop' ? (
          <>
            <kbd>Tab</kbd> <span className="key-hint">next (wrap)</span>{' '}
            <kbd>Shift+Tab</kbd> <span className="key-hint">prev (wrap)</span>
          </>
        ) : (
          <>
            <kbd>Tab</kbd> <span className="key-hint">exit zone</span>{' '}
            <kbd><Up /><Down /></kbd> <span className="key-hint">navigate (roving)</span>
          </>
        )}
      </div>
      <div className="card">
        <Aria behavior={behavior} data={data} plugins={plugins} onChange={setData} aria-label="tab demo">
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
