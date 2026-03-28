import React from 'react'
import { ExpandIndicator } from './indicators'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { useTreeView } from './useTreeView'
import { expandCommands } from '../axis/expand'
import { ROOT_ID } from '../store/types'
import { getChildren } from '../store/createStore'

export interface TreeItemRenderProps {
  toggleProps?: React.HTMLAttributes<HTMLElement>
}

interface TreeViewProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  renderItem?: (props: TreeItemRenderProps, item: Record<string, unknown>, state: NodeState) => React.ReactElement
  selectionFollowsFocus?: boolean
  selectable?: boolean
  initialFocus?: string
  'aria-label'?: string
}

const defaultRenderItem = (props: TreeItemRenderProps, node: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
    ?? (node.data as Record<string, unknown>)?.name as string
    ?? node.id as string
  const hasChildren = state.expanded !== undefined
  return (
    <div className="inline-flex items-center gap-xs">
      <span {...props.toggleProps}><ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} variant="tree" /></span>
      <span>{label}</span>
    </div>
  )
}

export function TreeView({
  data,
  plugins = [],
  onChange,
  onActivate,
  renderItem = defaultRenderItem,
  selectionFollowsFocus,
  selectable,
  initialFocus,
  'aria-label': ariaLabel,
}: TreeViewProps) {
  const tv = useTreeView({
    data,
    plugins,
    onChange,
    onActivate,
    selectionFollowsFocus,
    selectable,
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
      const renderProps: TreeItemRenderProps = {
        toggleProps: children.length > 0
          ? { onClick: (e: React.MouseEvent) => { e.preventDefault(); tv.dispatch(expandCommands.toggleExpand(id)) } }
          : undefined,
      }
      return (
        <div key={id} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
          {renderItem(renderProps, entity, state)}
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
