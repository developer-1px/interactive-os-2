import { useState } from 'react'
import { Up, Down, Left, Right } from '../kbdIcons'
import { Aria } from '../../interactive-os/primitives/aria'
import { composePattern } from '../../interactive-os/pattern/composePattern'
import { navigate } from '../../interactive-os/axis/navigate'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
import type { NormalizedData } from '../../interactive-os/store/types'
import type { NodeState } from '../../interactive-os/pattern/types'
import { axisListData, axisGridData, axisGridColumns } from './axis-demo-data'

type Orientation = 'vertical' | 'horizontal' | 'both'
type Mode = 'list' | 'grid'

const plugins = [focusRecovery()]

export default function NavigateDemo() {
  const [orientation, setOrientation] = useState<Orientation>('vertical')
  const [wrap, setWrap] = useState(false)
  const [mode, setMode] = useState<Mode>('list')
  const [tabCycle, setTabCycle] = useState(false)
  const [data, setData] = useState<NormalizedData>(axisListData)
  const [gridData, setGridData] = useState<NormalizedData>(axisGridData)

  const behavior = mode === 'grid'
    ? composePattern(
        { role: 'grid', childRole: 'row', ariaAttributes: () => ({}) },
        navigate({ grid: { columns: 3, tabCycle } }),
      )
    : composePattern(
        { role: 'listbox', childRole: 'option', ariaAttributes: () => ({}) },
        navigate({ orientation, wrap }),
      )

  return (
    <>
      <div className="page-keys">
        <label style={{ marginRight: 12 }}>
          <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} style={{ marginRight: 4 }}>
            <option value="list">List</option>
            <option value="grid">Grid</option>
          </select>
        </label>
        {mode === 'grid' && (
          <label style={{ marginRight: 12 }}>
            <input type="checkbox" checked={tabCycle} onChange={(e) => setTabCycle(e.target.checked)} />
            {' '}tabCycle
          </label>
        )}
        {mode === 'list' && (
          <>
            <label style={{ marginRight: 12 }}>
              <select value={orientation} onChange={(e) => setOrientation(e.target.value as Orientation)} style={{ marginRight: 4 }}>
                <option value="vertical">vertical</option>
                <option value="horizontal">horizontal</option>
                <option value="both">both</option>
              </select>
              orientation
            </label>
            <label>
              <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} />
              {' '}wrap
            </label>
          </>
        )}
      </div>
      <div className="page-keys">
        {mode === 'grid' ? (
          <>
            <kbd><Up /><Down /></kbd> <span className="key-hint">row</span>{' '}
            <kbd><Left /><Right /></kbd> <span className="key-hint">col</span>{' '}
            <kbd>Home/End</kbd> <span className="key-hint">col bounds</span>{' '}
            <kbd>⌘Home/End</kbd> <span className="key-hint">row bounds</span>
            {tabCycle && (
              <>
                {' '}<kbd>Tab</kbd> <span className="key-hint">next cell</span>{' '}
                <kbd>Shift+Tab</kbd> <span className="key-hint">prev cell</span>
              </>
            )}
          </>
        ) : orientation === 'vertical' ? (
          <>
            <kbd><Up /></kbd> <span className="key-hint">prev</span>{' '}
            <kbd><Down /></kbd> <span className="key-hint">next</span>{' '}
            <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
            <kbd>End</kbd> <span className="key-hint">last</span>
          </>
        ) : orientation === 'horizontal' ? (
          <>
            <kbd><Left /></kbd> <span className="key-hint">prev</span>{' '}
            <kbd><Right /></kbd> <span className="key-hint">next</span>{' '}
            <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
            <kbd>End</kbd> <span className="key-hint">last</span>
          </>
        ) : (
          <>
            <kbd><Up /><Left /></kbd> <span className="key-hint">prev</span>{' '}
            <kbd><Down /><Right /></kbd> <span className="key-hint">next</span>
          </>
        )}
      </div>
      <div className="card">
        {mode === 'grid' ? (
          <>
            <table className="grid-table" role="presentation">
              <thead>
                <tr>
                  {axisGridColumns.map((col) => (
                    <th key={col.key}>{col.header}</th>
                  ))}
                </tr>
              </thead>
            </table>
            <Aria behavior={behavior} data={gridData} plugins={plugins} onChange={setGridData} aria-label="navigate grid demo">
              <Aria.Item render={(props, node, state: NodeState) => {
                const cells = (node.data as Record<string, unknown>)?.cells as string[]
                const cls = ['grid-row', state.focused && 'grid-row--focused'].filter(Boolean).join(' ')
                return (
                  <div {...props} className={cls}>
                    {cells?.map((cell, i) => (
                      <Aria.Cell key={i} index={i}><span>{cell}</span></Aria.Cell>
                    ))}
                  </div>
                )
              }} />
            </Aria>
          </>
        ) : (
          <Aria behavior={behavior} data={data} plugins={plugins} onChange={setData} aria-label="navigate demo">
            <Aria.Item render={(props, node, state: NodeState) => {
              const d = node.data as Record<string, unknown>
              const cls = ['list-item', state.focused && 'list-item--focused'].filter(Boolean).join(' ')
              return <div {...props} className={cls}>{d?.label as string}</div>
            }} />
          </Aria>
        )}
      </div>
    </>
  )
}
