/** @catalog 네비게이션 리스트 */
import React from 'react'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { useNavList } from './useNavList'
import { ROOT_ID } from '../store/types'
import { getChildren } from '../store/createStore'
import { ListItem } from './items/ListItem'
import { ax } from '@styles/ax'

interface NavListProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
  renderGroupLabel?: (label: string) => React.ReactNode
  initialFocus?: string
  'aria-label'?: string
}

// data.icon (ReactNode)와 data.rightContent를 ListItem slot으로 자동 전달
const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const data = item.data as Record<string, unknown> | undefined
  return ListItem(props, item, state, {
    icon: data?.icon as React.ReactNode | undefined,
    rightContent: data?.rightContent as React.ReactNode | undefined,
  })
}

const defaultRenderGroupLabel = (label: string): React.ReactNode => (
  <div className={ax({ textStyle: 'overline' })}>{label}</div>
)

function isGroup(entity: Record<string, unknown>): boolean {
  return (entity.data as Record<string, unknown>)?.type === 'group'
}

function getLabel(entity: Record<string, unknown>): string {
  return (entity.data as Record<string, unknown>)?.label as string
    ?? (entity.data as Record<string, unknown>)?.name as string
    ?? entity.id as string
}

export function NavList({
  data,
  plugins = [],
  onChange,
  onActivate,
  renderItem = defaultRenderItem,
  renderGroupLabel = defaultRenderGroupLabel,
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
  const rootChildren = getChildren(store, ROOT_ID)

  const renderItems = (ids: string[]) =>
    ids.map((id) => {
      const entity = store.entities[id]
      if (!entity) return null
      const state = nav.getItemState(id)
      const props = nav.getItemProps(id)
      return React.cloneElement(renderItem(props as React.HTMLAttributes<HTMLElement>, entity, state), { key: id })
    })

  const hasGroups = rootChildren.some((id) => {
    const entity = store.entities[id]
    return entity && isGroup(entity)
  })

  if (!hasGroups) {
    return (
      <div {...(nav.rootProps as React.HTMLAttributes<HTMLDivElement>)}>
        {renderItems(rootChildren)}
      </div>
    )
  }

  return (
    <div {...(nav.rootProps as React.HTMLAttributes<HTMLDivElement>)} className={`${(nav.rootProps as React.HTMLAttributes<HTMLDivElement>).className ?? ''} ${ax({ layout: 'stack', gap: 'lg' })}`}>
      {rootChildren.map((id) => {
        const entity = store.entities[id]
        if (!entity) return null
        if (isGroup(entity)) {
          const groupChildren = getChildren(store, id)
          return (
            <div key={id} role="group" aria-label={getLabel(entity)} className={`navlist-group ${ax({ layout: 'stack', gap: 'xs' })}`}>
              {renderGroupLabel(getLabel(entity))}
              {renderItems(groupChildren)}
            </div>
          )
        }
        const state = nav.getItemState(id)
        const props = nav.getItemProps(id)
        return React.cloneElement(renderItem(props as React.HTMLAttributes<HTMLElement>, entity, state), { key: id })
      })}
    </div>
  )
}
