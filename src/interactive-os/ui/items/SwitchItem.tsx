// ② 2026-04-05-ui-items-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'
import { SwitchIndicator } from '../indicators'

export function SwitchItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement {
  const label = getNodeLabel(node)
  return (
    <button
      type="button"
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      className={`${ax({ role: 'item', interactive: 'check', layout: 'spread', width: 'full' })} ${ax.raw({ text: state.checked ? 'primary' : undefined })}`}
      data-focused={state.focused || undefined}
    >
      <span className={ax.raw({ text: state.focused ? 'primary' : 'secondary' })}>{label}</span>
      <SwitchIndicator />
    </button>
  )
}
