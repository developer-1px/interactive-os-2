import React from 'react'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { useNavList } from './useNavList'
import { core } from '../plugins/core'
import { ROOT_ID } from '../store/types'
import { getChildren } from '../store/createStore'
import styles from './NavList.module.css'

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

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = (item.data as Record<string, unknown>)?.label as string
    ?? (item.data as Record<string, unknown>)?.name as string
    ?? item.id as string
  const cls = styles.item + (state.focused ? ' ' + styles.itemFocused : '')
  return <div {...props} className={cls}>{label}</div>
}

const defaultRenderGroupLabel = (label: string): React.ReactNode => (
  <div className={styles.groupLabel}>{label}</div>
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
  plugins = [core()],
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
    <div {...(nav.rootProps as React.HTMLAttributes<HTMLDivElement>)}>
      {rootChildren.map((id) => {
        const entity = store.entities[id]
        if (!entity) return null
        if (isGroup(entity)) {
          const groupChildren = getChildren(store, id)
          return (
            <div key={id} role="group" aria-label={getLabel(entity)} className={styles.group}>
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
