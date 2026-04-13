// ② 2026-04-05-ui-items-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'

interface ToolbarItemOptions {
  icon?: React.ReactNode
  className?: string
}

export function ToolbarItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
  options?: ToolbarItemOptions,
): React.ReactElement {
  const label = getNodeLabel(node)
  const hasIcon = !!options?.icon
  return (
    <span
      {...props}
      className={ax({
        recipe: 'control-sm',
        interactive: 'button',
        layout: hasIcon ? 'center' : undefined,
        state: state.focused ? 'focused' : state.selected ? 'selected' : undefined,
        padding: 'xs', content: 'text', gap: 'xs', shape: 'xs', clamp: '1',
      })}
      aria-label={hasIcon ? label : undefined}
    >
      {hasIcon ? options.icon : label}
    </span>
  )
}
