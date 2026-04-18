var e=`// ② 2026-04-06-menubar-refactor-prd.md
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
      className={ax({ role: 'item', interactive: 'item', content: 'text', layout: 'row', width: 'full' })}
    >
      <span>{label}</span>
      {state.expanded !== undefined && (
        <DirectionIndicator direction={state.expanded ? 'prev' : 'next'} orientation="vertical" />
      )}
    </div>
  )
}
`;export{e as default};