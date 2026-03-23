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

export function SelectDemo() {
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
    <>
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
    </>
  )
}
