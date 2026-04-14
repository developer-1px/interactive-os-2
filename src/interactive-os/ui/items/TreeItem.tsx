// ② 2026-04-05-ui-items-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { ExpandIndicator } from '../indicators'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'

export interface TreeItemOptions {
  icon?: React.ReactNode
  rightContent?: React.ReactNode
  className?: string
}

export function TreeItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
  options?: TreeItemOptions,
): React.ReactElement {
  const label = getNodeLabel(node)
  const hasChildren = state.expanded !== undefined
  const depth = (state.level ?? 1) - 1
  return (
    <div
      {...props}
      className={ax({ role: 'item', interactive: 'item', layout: 'row', width: 'full' })}
      style={{ paddingLeft: `calc(${depth} * var(--space-md) + var(--space-sm))` }}
    >
      <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} variant="tree" />
      {options?.icon && <span className={ax({ layout: 'center', flex: 'none' })}>{options.icon}</span>}
      <span className={ax({ text: state.focused ? 'primary' : 'secondary', clamp: '1', flex: '1' })}>{label}</span>
      {options?.rightContent && <span className={ax({ flex: 'none' })}>{options.rightContent}</span>}
    </div>
  )
}
