// ② 2026-03-30-listbox-example-unification-prd.md
import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { Aria } from '../primitives/aria'
import { listboxGrouped } from '../pattern/roles/listboxGrouped'
import styles from './ListBox.module.css'

interface ListBoxGroupedProps extends AriaComponentProps {
}

const defaultRenderItem = (
  props: React.HTMLAttributes<HTMLElement>,
  item: Record<string, unknown>,
  state: NodeState,
  children?: React.ReactNode,
): React.ReactElement => {
  const label = (item.data as Record<string, unknown>)?.label as string
    ?? (item.data as Record<string, unknown>)?.name as string
    ?? item.id as string

  if (children) {
    const labelId = `group-label-${item.id}`
    return (
      <ul {...props} aria-labelledby={labelId} className={styles.group}>
        <li role="presentation" id={labelId} className={styles.groupLabel}>
          {label}
        </li>
        {children}
      </ul>
    )
  }

  return (
    <li
      {...props}
      className={styles.item}
      data-focused={state.focused || undefined}
      data-selected={state.selected || undefined}
    >
      <span className={styles.label}>{label}</span>
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
