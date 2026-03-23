import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState, BehaviorContext } from '../behaviors/types'
import type { Command } from '../core/types'
import { useTabList } from './useTabList'
import { ROOT_ID } from '../core/types'
import { getChildren } from '../core/createStore'

interface TabListProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  renderItem?: (tab: Record<string, unknown>, state: NodeState) => React.ReactNode
  enableEditing?: boolean
  keyMap?: Record<string, (ctx: BehaviorContext) => Command | void>
  initialFocus?: string
  'aria-label'?: string
}

const defaultRenderItem = (tab: Record<string, unknown>, _state: NodeState): React.ReactNode => (
  <span>{(tab.data as Record<string, unknown>)?.label as string ?? (tab.data as Record<string, unknown>)?.name as string ?? tab.id as string}</span>
)

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
            {renderItem(entity, state)}
          </div>
        )
      })}
    </div>
  )
}
