// ② 2026-04-06-itemslots-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { AriaEditable } from '../../primitives/AriaEditable'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'

export interface EditableListItemOptions {
  field?: string
  icon?: React.ReactNode
  rightContent?: React.ReactNode
}

export function EditableListItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
  options?: EditableListItemOptions,
): React.ReactElement {
  const label = getNodeLabel(node)
  const field = options?.field ?? 'label'
  return (
    <div
      {...props}
      className={ax({ role: 'item', interactive: 'item', content: 'text', layout: 'row', width: 'full' })}
      data-focused={state.focused || undefined}
      data-selected={state.selected || undefined}
    >
      {options?.icon && <span className={ax({ flex: 'none' })}>{options.icon}</span>}
      <AriaEditable field={field}>
        <span className={`${ax({ clamp: '1', flex: '1' })} ${ax.raw({ text: state.focused ? 'primary' : 'secondary' })}`}>{label}</span>
      </AriaEditable>
      {options?.rightContent && <span className={ax({ flex: 'none' })}>{options.rightContent}</span>}
    </div>
  )
}
