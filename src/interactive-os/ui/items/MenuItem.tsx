// ② 2026-04-05-ui-items-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { ExpandIndicator } from '../indicators'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'

interface MenuItemOptions {
  icon?: React.ReactNode
  rightContent?: React.ReactNode
  indicator?: React.ReactNode
  className?: string
}

export function MenuItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
  options?: MenuItemOptions,
): React.ReactElement {
  const label = getNodeLabel(node)
  return (
    <div
      {...props}
      className={ax({ recipe: 'item-sm', interactive: 'item', layout: 'spread' })}
    >
      <span>{label}</span>
      {state.expanded !== undefined && (
        <span className={ax({ layout: 'bar', text: 'muted' })}>
          {options?.indicator ?? <ExpandIndicator expanded={state.expanded} />}
        </span>
      )}
      {options?.rightContent && <span className={ax({ flex: 'none' })}>{options.rightContent}</span>}
    </div>
  )
}
