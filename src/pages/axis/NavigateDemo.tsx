import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/composePattern'
import { navigate } from '../../interactive-os/axes/navigate'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData, axisGridData, axisGridColumns } from './axis-demo-data'

type Orientation = 'vertical' | 'horizontal' | 'both'
type Mode = 'list' | 'grid'

const plugins = [core(), focusRecovery()]

export default function NavigateDemo() {
  const [orientation, setOrientation] = useState<Orientation>('vertical')
  const [wrap, setWrap] = useState(false)
  const [mode, setMode] = useState<Mode>('list')
  const [data, setData] = useState<NormalizedData>(axisListData)
  const [gridData, setGridData] = useState<NormalizedData>(axisGridData)

  const behavior = mode === 'grid'
    ? composePattern(
        { role: 'grid', childRole: 'row', ariaAttributes: () => ({}) },
        navigate({ grid: { columns: 3 } }),
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
            <kbd>↑↓</kbd> <span className="key-hint">row</span>{' '}
            <kbd>←→</kbd> <span className="key-hint">col</span>{' '}
            <kbd>Home/End</kbd> <span className="key-hint">col bounds</span>{' '}
            <kbd>⌘Home/End</kbd> <span className="key-hint">row bounds</span>
          </>
        ) : orientation === 'vertical' ? (
          <>
            <kbd>↑</kbd> <span className="key-hint">prev</span>{' '}
            <kbd>↓</kbd> <span className="key-hint">next</span>{' '}
            <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
            <kbd>End</kbd> <span className="key-hint">last</span>
          </>
        ) : orientation === 'horizontal' ? (
          <>
            <kbd>←</kbd> <span className="key-hint">prev</span>{' '}
            <kbd>→</kbd> <span className="key-hint">next</span>{' '}
            <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
            <kbd>End</kbd> <span className="key-hint">last</span>
          </>
        ) : (
          <>
            <kbd>↑←</kbd> <span className="key-hint">prev</span>{' '}
            <kbd>↓→</kbd> <span className="key-hint">next</span>
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
