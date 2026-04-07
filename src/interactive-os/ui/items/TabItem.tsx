// ② 2026-04-05-ui-items-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'

interface TabItemOptions {
  className?: string
}

export function TabItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
  _options?: TabItemOptions,
): React.ReactElement {
  const label = getNodeLabel(node)
  return (
    <span
      {...props}
      className={ax({
        recipe: 'item-sm', interactive: 'tab',
        layout: 'row', text: state.selected ? 'primary' : 'muted',
      })}
    >
      {label}
    </span>
  )
}
