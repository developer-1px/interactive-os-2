// ② 2026-04-05-ui-items-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'

export interface ListItemOptions {
  icon?: React.ReactNode
  rightContent?: React.ReactNode
  className?: string
}

export function ListItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
  options?: ListItemOptions,
): React.ReactElement {
  const label = getNodeLabel(node)
  return (
    <div
      {...props}
      className={ax({ interactive: 'item', shape: 'md', layout: 'bar', gap: 'sm', textStyle: 'caption' })}
      data-focused={state.focused || undefined}
      data-selected={state.selected || undefined}
    >
      {options?.icon && <span className="shrink-0">{options.icon}</span>}
      <span className={ax({ text: state.focused ? 'primary' : 'secondary', clamp: '1' })}>{label}</span>
      {options?.rightContent && <span className="shrink-0 ml-auto">{options.rightContent}</span>}
    </div>
  )
}
