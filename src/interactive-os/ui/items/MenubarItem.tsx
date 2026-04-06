// ② 2026-04-06-menubar-refactor-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { ExpandIndicator } from '../indicators'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'

export function MenubarItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement {
  const label = getNodeLabel(node)
  return (
    <div
      {...props}
      className={ax({ interactive: 'item', layout: 'bar', controlSize: 'md', padding: 'md', content: 'text', gap: 'xs' })}
    >
      <span>{label}</span>
      {state.expanded !== undefined && (
        <span className={ax({ text: 'muted' })} aria-hidden="true">
          <ExpandIndicator expanded={state.expanded} />
        </span>
      )}
    </div>
  )
}
