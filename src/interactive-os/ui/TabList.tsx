import React from 'react'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState, PatternContext } from '../pattern/types'
import type { Command } from '../engine/types'
import { useTabList } from './useTabList'
import { ROOT_ID } from '../store/types'
import { getChildren } from '../store/createStore'
import styles from './TabList.module.css'

interface TabListProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, tab: Record<string, unknown>, state: NodeState) => React.ReactElement
  enableEditing?: boolean
  keyMap?: Record<string, (ctx: PatternContext) => Command | void>
  initialFocus?: string
  'aria-label'?: string
}

const defaultRenderItem = (_props: React.HTMLAttributes<HTMLElement>, tab: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = (tab.data as Record<string, unknown>)?.label as string
    ?? (tab.data as Record<string, unknown>)?.name as string
    ?? tab.id as string
  const cls = styles.tab + (state.focused ? ' ' + styles.tabFocused : '') + (state.selected ? ' ' + styles.tabSelected : '')
  return <span className={cls}>{label}</span>
}

export function TabList({
  data,
  plugins,
  onChange,
  onActivate,
  renderItem = defaultRenderItem,
  enableEditing = false,
  keyMap,
  initialFocus,
  'aria-label': ariaLabel,
}: TabListProps) {
  const tl = useTabList({
    data,
    plugins,
    onChange,
    onActivate,
    enableEditing,
    keyMap,
    initialFocus,
    'aria-label': ariaLabel,
  })

  const store = tl.getStore()
  const childIds = getChildren(store, ROOT_ID)

  return (
    <div {...(tl.rootProps as React.HTMLAttributes<HTMLDivElement>)}>
      {childIds.map((id) => {
        const entity = store.entities[id]
        if (!entity) return null
        const state = tl.getItemState(id)
        const props = tl.getItemProps(id)
        return (
          <div key={id} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
            {renderItem({} as React.HTMLAttributes<HTMLElement>, entity, state)}
          </div>
        )
      })}
    </div>
  )
}
