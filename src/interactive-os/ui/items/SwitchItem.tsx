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
      className={ax({ role: 'item', interactive: 'check', layout: 'spread', width: 'full' })}
      data-focused={state.focused || undefined}
    >
      <span>{label}</span>
      <SwitchIndicator />
    </button>
  )
}
