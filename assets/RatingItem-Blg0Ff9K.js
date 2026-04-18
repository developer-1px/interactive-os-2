var e=`// ② Rating star item — each star is a radio option
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { ax } from '@styles/ax'
import { StarIndicator } from '../indicators/StarIndicator'

export function RatingItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement {
  const value = (node.data as Record<string, unknown>)?.value as number | undefined
  const checked = state.checked === true
  const selected = state.selected ?? false
  return (
    <div
      {...props}
      className={ax({ role: 'control', interactive: 'check', layout: 'center' })}
      data-focused={state.focused || undefined}
      aria-label={\`\${value}\`}
    >
      <StarIndicator filled={checked || selected} />
    </div>
  )
}
`;export{e as default};