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
      className={ax({ interactive: 'item', controlSize: 'md', padding: 'sm', content: 'text', gap: 'xs', clamp: '1' })}
    >
      <span>{label}</span>
      {state.expanded !== undefined && (
        <span className={ax({ layout: 'row', text: 'muted' })} aria-hidden="true">
          <ExpandIndicator expanded={state.expanded} />
        </span>
      )}
    </div>
  )
}
