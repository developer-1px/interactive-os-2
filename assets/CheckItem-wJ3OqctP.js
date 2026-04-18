var e=`// ② 2026-04-05-ui-items-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'
import { CheckIndicator, IndeterminateIndicator } from '../indicators'

export function CheckItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement {
  const label = getNodeLabel(node)
  const isMixed = state.checked === 'mixed'
  return (
    <button
      type="button"
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      className={ax({ role: 'item', interactive: 'check', layout: 'row', width: 'full' })}
      data-focused={state.focused || undefined}
    >
      {isMixed ? <IndeterminateIndicator /> : <CheckIndicator />}
      <span className={ax.raw({ text: state.focused ? 'primary' : 'secondary' })}>{label}</span>
    </button>
  )
}
`;export{e as default};