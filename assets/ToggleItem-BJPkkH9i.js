var e=`// ② 2026-04-05-ui-items-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'

export function ToggleItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement {
  const label = getNodeLabel(node)
  const pressed = state.selected
  return (
    <div
      {...props}
      className={\`\${ax({
        role: 'control',
        interactive: 'check',
        surface: pressed ? 'action' : 'ghost',
        tone: pressed ? 'accent-dim' : undefined,
        layout: 'center',
        content: 'text',
      })} \${ax.raw({ text: pressed ? 'bright' : 'secondary', weight: 'semi' })}\`}
      data-focused={state.focused || undefined}
      data-selected={pressed || undefined}
    >
      {label}
    </div>
  )
}
`;export{e as default};