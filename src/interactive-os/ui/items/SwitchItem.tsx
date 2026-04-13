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
    <div
      {...props}
      className={ax({ recipe: 'item', interactive: 'check', layout: 'spread', text: state.checked ? 'primary' : undefined, padding: 'sm', gap: 'sm', shape: '2xs', width: 'full' })}
      data-focused={state.focused || undefined}
    >
      <span className={ax({ textStyle: 'body', text: state.focused ? 'primary' : 'secondary' })}>{label}</span>
      <SwitchIndicator />
    </div>
  )
}
