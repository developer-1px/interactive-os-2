/** @catalog 그룹핑된 리스트박스 */
// ② 2026-03-30-listbox-example-unification-prd.md
import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { listboxGrouped } from '../pattern/roles/listboxGrouped'
import { ax } from '@styles/ax'

type ListBoxGroupedProps = AriaComponentProps

const defaultRenderItem = (
  props: React.HTMLAttributes<HTMLElement>,
  item: Record<string, unknown>,
  state: NodeState,
  children?: React.ReactNode,
): React.ReactElement => {
  const label = getNodeLabel(item)

  if (children) {
    const labelId = `group-label-${item.id}`
    return (
      <ul {...props} aria-labelledby={labelId}>
        <li role="presentation" id={labelId} className={ax({ role: 'item', textStyle: 'overline', content: 'text' })}>
          {label}
        </li>
        {children}
      </ul>
    )
  }

  return (
    <li
      {...props}
      data-focused={state.focused || undefined}
      data-selected={state.selected || undefined}
    >
      <span>{label}</span>
    </li>
  )
}

export function ListBoxGrouped({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
}: ListBoxGroupedProps) {
  const pattern = React.useMemo(() => listboxGrouped, [])

  return (
    <Aria
      pattern={pattern}
      data={data}
      plugins={plugins}
      onChange={onChange}
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
