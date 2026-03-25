import React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { menu } from '../pattern/menu'
import { core } from '../plugins/core'
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
    <div {...props} className={styles.item}>
      <span>{label}</span>
      {state.expanded !== undefined && (
        <span className={styles.chevron}>{state.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
      )}
    </div>
  )
}

export function MenuList({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
}: MenuListProps) {
  return (
    <Aria behavior={menu} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
