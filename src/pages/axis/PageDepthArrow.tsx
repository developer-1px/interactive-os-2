import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/compose-pattern'
import { depthArrow } from '../../interactive-os/axes/depth-arrow'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focus-recovery'
import type { Entity, NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisTreeData } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'tree',
    childRole: 'treeitem',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    expandable: true,
    ariaAttributes: (_node: Entity, state: NodeState) => {
      const attrs: Record<string, string> = {}
      if (state.expanded !== undefined) attrs['aria-expanded'] = String(state.expanded)
      if (state.level !== undefined) attrs['aria-level'] = String(state.level)
      return attrs
    },
  },
  depthArrow,
)

const plugins = [core(), focusRecovery()]

export default function PageDepthArrow() {
  const [data, setData] = useState<NormalizedData>(axisTreeData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Depth — Arrow axis</h2>
        <p className="page-desc">
          depthArrow binds ← → to expand/collapse and parent/child traversal. ↑ ↓ are intentionally
          unbound — that is navV's responsibility.
        </p>
      </div>
      <div className="page-keys">
        <kbd>→</kbd> <span className="key-hint">expand or enter child</span>{' '}
        <kbd>←</kbd> <span className="key-hint">collapse or exit to parent</span>{' '}
        <span className="key-hint muted">↑ ↓ unbound (navV's job)</span>
      </div>
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="Depth arrow tree"
        >
          <Aria.Item
            render={(node, state) => {
              const indent = ((state.level ?? 1) - 1) * 20
              const hasChildren = (state as NodeState & { hasChildren?: boolean }).hasChildren
              const isExpanded = state.expanded
              const label = (node.data as Record<string, unknown>).label as string
              return (
                <div
                  style={{
                    paddingLeft: indent,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: `2px 4px 2px ${indent + 4}px`,
                    borderRadius: 4,
                    background: state.focused ? 'var(--color-focus-bg, #e8f0fe)' : undefined,
                    outline: state.focused ? '2px solid var(--color-focus, #4285f4)' : undefined,
                    cursor: 'default',
                  }}
                >
                  <span style={{ width: 12, display: 'inline-block', textAlign: 'center', opacity: 0.7 }}>
                    {hasChildren !== false && isExpanded !== undefined
                      ? isExpanded
                        ? '▾'
                        : '▸'
                      : null}
                  </span>
                  <span>{label}</span>
                </div>
              )
            }}
          />
        </Aria>
      </div>
    </div>
  )
}
