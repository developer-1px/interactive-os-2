import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/composePattern'
import { navGrid } from '../../interactive-os/axes/navGrid'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisGridData, axisGridColumns } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'grid',
    childRole: 'row',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    colCount: 3,
    ariaAttributes: () => ({}),
  },
  navGrid(),
)

const plugins = [core(), focusRecovery()]

export default function PageNavGrid() {
  const [data, setData] = useState<NormalizedData>(axisGridData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">navGrid — 2D Grid Navigation</h2>
        <p className="page-desc">2D navigation with row and column movement. ↑↓ moves between rows, ←→ moves between columns.</p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">row nav</span>{' '}
        <kbd>←→</kbd> <span className="key-hint">col nav</span>{' '}
        <kbd>Home</kbd> <span className="key-hint">first col</span>{' '}
        <kbd>End</kbd> <span className="key-hint">last col</span>{' '}
        <kbd>⌘Home</kbd> <span className="key-hint">first row</span>{' '}
        <kbd>⌘End</kbd> <span className="key-hint">last row</span>
      </div>
      <div className="card">
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border, #e0e0e0)', background: 'var(--header-bg, #fafafa)' }}>
          {axisGridColumns.map((col) => (
            <div
              key={col.key}
              style={{ padding: '8px 12px', minWidth: 120, fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #666)' }}
            >
              {col.header}
            </div>
          ))}
        </div>
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="navGrid demo"
        >
          <Aria.Item render={(node, state: NodeState) => {
            const cells = (node.data as Record<string, unknown>)?.cells as string[]
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
            ].filter(Boolean).join(' ')
            return (
              <div className={cls} style={{ display: 'flex' }}>
                {cells?.map((cell, i) => (
                  <Aria.Cell key={i} index={i}><span>{cell}</span></Aria.Cell>
                ))}
              </div>
            )
          }} />
        </Aria>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">How it works</h3>
        <p className="page-desc">
          <code>navGrid</code> is a factory that binds 8 keys for 2D navigation:
          ArrowDown/Up → row movement, ArrowRight/Left → column movement via <code>grid.focusNextCol</code> /
          <code>grid.focusPrevCol</code>, Home/End → first/last column, ⌘Home/⌘End → first/last row.
          The <code>colCount</code> metadata tells the engine how many columns exist so it can track
          the active column index independently of the focused row.
        </p>
      </div>
    </div>
  )
}
