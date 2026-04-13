// ② 2026-04-05-ui-items-prd.md
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
  const isChecked = state.checked === true
  return (
    <div
      {...props}
      className={ax({ recipe: 'item', interactive: 'check', padding: 'sm', gap: 'sm', shape: '2xs', layout: 'row', width: 'full' })}
      data-focused={state.focused || undefined}
    >
      {isMixed ? <IndeterminateIndicator /> : <CheckIndicator checked={isChecked} />}
      <span className={ax({ textStyle: 'body', text: state.focused ? 'primary' : 'secondary' })}>{label}</span>
    </div>
  )
}
