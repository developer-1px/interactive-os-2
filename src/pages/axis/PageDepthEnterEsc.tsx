import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/composePattern'
import { depthEnterEsc } from '../../interactive-os/axes/depthEnterEsc'
import { core } from '../../interactive-os/plugins/core'
import { spatial } from '../../interactive-os/plugins/spatial'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
import type { Entity, NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisTreeData } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'group',
    childRole: 'group',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    expandable: true,
    ariaAttributes: (_node: Entity, state: NodeState) => {
      const attrs: Record<string, string> = {}
      if (state.expanded !== undefined) attrs['aria-expanded'] = String(state.expanded)
      return attrs
    },
  },
  depthEnterEsc,
)

const plugins = [core(), spatial(), focusRecovery()]

export default function PageDepthEnterEsc() {
  const [data, setData] = useState<NormalizedData>(axisTreeData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Depth — Enter/Esc axis</h2>
        <p className="page-desc">
          depthEnterEsc binds Enter to enter a child scope and Escape to exit back to the parent
          scope (Figma-style depth traversal). Arrow keys are intentionally unbound.
        </p>
      </div>
      <div className="page-keys">
        <kbd>Enter</kbd> <span className="key-hint">enter child scope</span>{' '}
        <kbd>Esc</kbd> <span className="key-hint">exit to parent scope</span>{' '}
        <span className="key-hint muted">↑ ↓ ← → unbound</span>
      </div>
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="Depth enter/esc group"
        >
          <Aria.Item
            render={(node, state) => {
              const label = (node.data as Record<string, unknown>).label as string
              return (
                <div
                  className={state.focused ? 'list-item focused' : 'list-item'}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: state.focused ? 'var(--color-focus-bg, #e8f0fe)' : undefined,
                    outline: state.focused ? '2px solid var(--color-focus, #4285f4)' : undefined,
                    cursor: 'default',
                  }}
                >
                  {label}
                </div>
              )
            }}
          />
        </Aria>
      </div>
    </div>
  )
}
