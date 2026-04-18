var e=`// ② 2026-04-05-ui-items-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'

export function DialogItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement {
  const label = getNodeLabel(node)
  return (
    <div
      {...props}
      className={\`\${ax({ role: 'item', interactive: 'item', content: 'text', layout: 'row', width: 'full' })} \${ax.raw({ text: state.focused ? 'primary' : 'secondary' })}\`}
      data-focused={state.focused || undefined}
    >
      {label}
    </div>
  )
}
`;export{e as default};