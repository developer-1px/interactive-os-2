var e=`// ② 2026-04-05-ui-items-prd.md
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
      className={\`\${ax({
        role: 'control',
        interactive: 'button',
        layout: hasIcon ? 'center' : undefined,
        content: 'text', clamp: '1',
      })} \${ax.raw({ state: state.focused ? 'focused' : state.selected ? 'selected' : undefined })}\`}
      aria-label={hasIcon ? label : undefined}
    >
      {hasIcon ? options.icon : label}
    </span>
  )
}
`;export{e as default};