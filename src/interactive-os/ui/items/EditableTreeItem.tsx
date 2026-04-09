// ② 2026-04-06-itemslots-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { AriaEditable } from '../../primitives/AriaEditable'
import { ExpandIndicator } from '../indicators'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'

export interface EditableTreeItemOptions {
  field?: string
  icon?: React.ReactNode
  rightContent?: React.ReactNode
}

export function EditableTreeItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
  options?: EditableTreeItemOptions,
): React.ReactElement {
  const label = getNodeLabel(node)
  const field = options?.field ?? 'label'
  const hasChildren = state.expanded !== undefined
  const depth = (state.level ?? 1) - 1
  return (
    <div
      {...props}
      className={ax({ recipe: 'item-sm', interactive: 'item' })}
      style={{ paddingLeft: `calc(${depth} * var(--space-md) + var(--space-sm))` }}
    >
      <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} variant="tree" />
      {options?.icon && <span className={ax({ flex: 'none' })}>{options.icon}</span>}
      <AriaEditable field={field}>
        <span className={ax({ textStyle: 'caption', text: state.focused ? 'primary' : 'secondary', clamp: '1', flex: '1' })}>{label}</span>
      </AriaEditable>
      {options?.rightContent && <span className={ax({ flex: 'none' })}>{options.rightContent}</span>}
    </div>
  )
}
