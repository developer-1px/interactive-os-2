import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { useNavList } from './useNavList'
import { core } from '../plugins/core'
import { ROOT_ID } from '../core/types'
import { getChildren } from '../core/createStore'

interface NavListProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
  initialFocus?: string
  'aria-label'?: string
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, _state: NodeState): React.ReactElement => (
  <span {...props}>
    {(item.data as Record<string, unknown>)?.label as string ?? (item.data as Record<string, unknown>)?.name as string ?? item.id as string}
  </span>
)

export function NavList({
  data,
  plugins = [core()],
  onChange,
  onActivate,
  renderItem = defaultRenderItem,
  initialFocus,
  'aria-label': ariaLabel,
}: NavListProps) {
  const nav = useNavList({
    data,
    plugins,
    onChange,
    onActivate,
    initialFocus,
    'aria-label': ariaLabel,
  })

  const store = nav.getStore()
  const childIds = getChildren(store, ROOT_ID)

  return (
    <div {...(nav.rootProps as React.HTMLAttributes<HTMLDivElement>)}>
      {childIds.map((id) => {
        const entity = store.entities[id]
        if (!entity) return null
        const state = nav.getItemState(id)
        const props = nav.getItemProps(id)
        return React.cloneElement(renderItem(props as React.HTMLAttributes<HTMLElement>, entity, state), { key: id })
      })}
    </div>
  )
}
