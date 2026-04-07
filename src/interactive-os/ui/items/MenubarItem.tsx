// ② 2026-04-06-menubar-refactor-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { DirectionIndicator } from '../indicators'
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
      className={ax({ interactive: 'item', shape: 'md', layout: 'bar', padding: 'sm', gap: 'xs' })}
    >
      {label}
      {state.expanded !== undefined && (
        <DirectionIndicator direction={state.expanded ? 'prev' : 'next'} orientation="vertical" />
      )}
    </div>
  )
}
