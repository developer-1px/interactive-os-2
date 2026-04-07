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
      className={ax({ interactive: 'item', shape: 'md', controlSize: 'sm', padding: 'sm', content: 'text', layout: 'bar', gap: 'xs' })}
      style={{ paddingLeft: `calc(${depth} * var(--space-md) + var(--space-sm))` }}
    >
      <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} variant="tree" />
      {options?.icon && <span className="shrink-0">{options.icon}</span>}
      <AriaEditable field={field}>
        <span className={ax({ textStyle: 'caption', text: state.focused ? 'primary' : 'secondary', clamp: '1' })}>{label}</span>
      </AriaEditable>
      {options?.rightContent && <span className="shrink-0 ml-auto">{options.rightContent}</span>}
    </div>
  )
}
