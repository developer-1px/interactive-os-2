import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/composePattern'
import { navigate } from '../../interactive-os/axes/navigate'
import { select } from '../../interactive-os/axes/select'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
import type { Entity, NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData } from './axis-demo-data'

type SelectionMode = 'single' | 'multiple'

const plugins = [core(), focusRecovery()]

export default function PageSelect() {
  const [mode, setMode] = useState<SelectionMode>('multiple')
  const [extended, setExtended] = useState(false)
  const [data, setData] = useState<NormalizedData>(axisListData)

  const behavior = composePattern(
    {
      role: 'listbox',
      childRole: 'option',
      ariaAttributes: (_node: Entity, state: NodeState) => ({
        'aria-selected': String(state.selected),
      }),
    },
    select({ mode, extended: extended && mode === 'multiple' }),
    navigate({ orientation: 'vertical' }),
  )

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">select()</h2>
        <p className="page-desc">
          Selection axis. Space toggles selection. Toggle options to switch between single/multiple and enable range selection.
        </p>
      </div>
      <div className="page-keys">
        <label style={{ marginRight: 12 }}>
          <select value={mode} onChange={(e) => setMode(e.target.value as SelectionMode)} style={{ marginRight: 4 }}>
            <option value="multiple">multiple</option>
            <option value="single">single</option>
          </select>
          mode
        </label>
        <label>
          <input type="checkbox" checked={extended} onChange={(e) => setExtended(e.target.checked)} disabled={mode === 'single'} />
          {' '}extended
        </label>
      </div>
      <div className="page-keys">
        <kbd>Space</kbd> <span className="key-hint">toggle select</span>{' '}
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>
        {extended && mode === 'multiple' && (
          <>
            {' '}<kbd>Shift+↑↓</kbd> <span className="key-hint">extend range</span>{' '}
            <kbd>Shift+Home/End</kbd> <span className="key-hint">extend to boundary</span>
          </>
        )}
      </div>
      <div className="card">
        <Aria behavior={behavior} data={data} plugins={plugins} onChange={setData} aria-label="select demo">
          <Aria.Item render={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
              state.selected && !state.focused && 'list-item--selected',
            ].filter(Boolean).join(' ')
            return <div className={cls}>{d?.label as string}</div>
          }} />
        </Aria>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">About select()</h3>
        <p className="page-desc">
          The <code>select()</code> axis binds <code>Space</code> and optionally <code>Shift+Arrow</code> combos.
          <code>mode: 'single'</code> replaces selection, <code>'multiple'</code> toggles independently.
          <code>extended: true</code> adds Shift range selection (only with multiple mode).
          Navigate axis is added here for movement — select alone only handles selection.
        </p>
      </div>
    </div>
  )
}
