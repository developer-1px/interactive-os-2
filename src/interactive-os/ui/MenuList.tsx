import React from 'react'
import { ExpandIndicator } from './indicators'

import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { menu } from '../pattern/roles/menu'
import styles from './MenuList.module.css'

type MenuListProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  return (
    <div {...props} className={styles.item} data-focused={state.focused || undefined}>
      <span className={styles.label}>{label}</span>
      {state.expanded !== undefined && (
        <span className={styles.indicator}>
          <ExpandIndicator expanded={state.expanded} />
        </span>
      )}
    </div>
  )
}

export function MenuList({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  onActivate,
  'aria-label': ariaLabel,
}: MenuListProps) {
  return (
    <Aria
      pattern={menu}
      data={data}
      plugins={plugins}
      onChange={onChange}
      onActivate={onActivate}
      aria-label={ariaLabel}
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
