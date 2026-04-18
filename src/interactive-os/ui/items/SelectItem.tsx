import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'
import { CheckIndicator } from '../indicators'

export function SelectItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement {
  const label = getNodeLabel(node)
  return (
    <div
      {...props}
      className={ax({ role: 'item', interactive: 'item', content: 'text', layout: 'row', width: 'full' })}
      data-focused={state.focused || undefined}
      data-selected={state.selected || undefined}
    >
      <span className={ax({ clamp: '1', flex: '1' })}>{label}</span>
      {state.selected && <span className={ax({ flex: 'none' })}><CheckIndicator /></span>}
    </div>
  )
}
