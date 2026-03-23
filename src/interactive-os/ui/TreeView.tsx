import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { useTreeView } from './useTreeView'
import { core } from '../plugins/core'
import { ROOT_ID } from '../core/types'
import { getChildren } from '../core/createStore'

interface TreeViewProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState) => React.ReactNode
  followFocus?: boolean
  initialFocus?: string
  'aria-label'?: string
}

const defaultRenderItem = (node: Record<string, unknown>, state: NodeState): React.ReactNode => {
  const hasChildren = state.expanded !== undefined
  return (
    <span className="item-inner">
      <span className="item-chevron--tree">
        {hasChildren ? (state.expanded ? '▾' : '▸') : ''}
      </span>
      <span>{(node.data as Record<string, unknown>)?.name as string ?? (node.data as Record<string, unknown>)?.label as string ?? node.id as string}</span>
    </span>
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
          {renderItem(entity, state)}
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
