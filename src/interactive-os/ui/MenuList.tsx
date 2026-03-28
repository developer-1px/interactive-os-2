import React from 'react'
import { ExpandIndicator } from './indicators'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { menu } from '../pattern/roles/menu'
import styles from './MenuList.module.css'

interface MenuListProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = (item.data as Record<string, unknown>)?.label as string
    ?? (item.data as Record<string, unknown>)?.name as string
    ?? item.id as string
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
}: MenuListProps) {
  return (
    <Aria pattern={menu} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
