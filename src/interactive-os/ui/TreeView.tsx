import React from 'react'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { useTreeView } from './useTreeView'
import { core } from '../plugins/core'
import { ROOT_ID } from '../store/types'
import { getChildren } from '../store/createStore'
import styles from './TreeView.module.css'

interface TreeViewProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
  followFocus?: boolean
  initialFocus?: string
  'aria-label'?: string
}

const defaultRenderItem = (_props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
    ?? (node.data as Record<string, unknown>)?.name as string
    ?? node.id as string
  const hasChildren = state.expanded !== undefined
  const cls = styles.item + (state.focused ? ' ' + styles.itemFocused : '') + (state.selected ? ' ' + styles.itemSelected : '')
  return (
    <div className={cls}>
      <span className={styles.chevron}>{hasChildren ? (state.expanded ? '▾' : '▸') : ''}</span>
      <span>{label}</span>
    </div>
  )
}

export function TreeView({
  data,
  plugins = [core()],
  onChange,
  onActivate,
  renderItem = defaultRenderItem,
  followFocus,
  initialFocus,
  'aria-label': ariaLabel,
}: TreeViewProps) {
  const tv = useTreeView({
    data,
    plugins,
    onChange,
    onActivate,
    followFocus,
    initialFocus,
    'aria-label': ariaLabel,
  })

  const store = tv.getStore()

  function renderNodes(parentId: string): React.ReactNode {
    const childIds = getChildren(store, parentId)
    return childIds.map((id) => {
      const entity = store.entities[id]
      if (!entity) return null
      const state = tv.getItemState(id)
      const props = tv.getItemProps(id)
      const children = getChildren(store, id)
      return (
        <div key={id} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
          {renderItem({} as React.HTMLAttributes<HTMLElement>, entity, state)}
          {state.expanded && children.length > 0 && (
            <div role="group">
              {renderNodes(id)}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div {...(tv.rootProps as React.HTMLAttributes<HTMLDivElement>)}>
      {renderNodes(ROOT_ID)}
    </div>
  )
}
