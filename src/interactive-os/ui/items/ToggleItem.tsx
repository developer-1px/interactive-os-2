// ② 2026-04-05-ui-items-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'
import { CheckIndicator } from '../indicators'

export function ToggleItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement {
  const label = getNodeLabel(node)
  return (
    <div
      {...props}
      className={ax({ recipe: 'item', interactive: 'check', padding: 'sm', gap: 'sm', shape: '2xs', layout: 'row', width: 'full' })}
      data-focused={state.focused || undefined}
      data-selected={state.selected || undefined}
    >
      <CheckIndicator checked={state.selected} />
      <span className={ax({ textStyle: 'body', text: 'primary' })}>{label}</span>
    </div>
  )
}
