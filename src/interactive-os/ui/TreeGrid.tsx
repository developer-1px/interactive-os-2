import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps, ItemSlots } from './types'
import { Aria } from '../primitives/aria'
import { treegrid } from '../pattern/roles/treegrid'
import { history } from '../plugins/history'
import { edit, replaceEditPlugin } from '../plugins/edit'
import { TreeItem, EditableTreeItem } from './items'

interface TreeGridProps extends AriaComponentProps {
  id?: string
  enableEditing?: boolean
  columns?: number
}

function makeRenderItem(editable: boolean, slots?: ItemSlots) {
  const Item = editable ? EditableTreeItem : TreeItem
  if (!slots) return (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement =>
    Item(props, node, state)
  return (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement =>
    Item(props, node, state, {
      icon: slots.icon?.(node, state),
      rightContent: slots.rightContent?.(node, state),
    })
}

// Re-export Cell for grid consumers (e.g. TreegridEmail)
// eslint-disable-next-line react-refresh/only-export-components
export const Cell = Aria.Cell

export function TreeGrid({
  id,
  data,
  plugins = [history()],
  onChange,
  renderItem,
  itemSlots,
  enableEditing = false,
  columns,
  onActivate,
  'aria-label': ariaLabel,
}: TreeGridProps) {
  const defaultRenderer = React.useMemo(() => makeRenderItem(enableEditing, itemSlots), [enableEditing, itemSlots])
  const resolvedRenderItem = renderItem ?? defaultRenderer
  const pattern = React.useMemo(
    () => columns ? treegrid(columns) : treegrid(1),
    [columns],
  )

  const mergedPlugins = React.useMemo(
    () => enableEditing ? [...plugins, edit({ tree: true }), replaceEditPlugin()] : plugins,
    [plugins, enableEditing],
  )

  return (
    <Aria
      id={id}
      pattern={pattern}
      data={data}
      plugins={mergedPlugins}
      onChange={onChange}
      onActivate={onActivate}
      aria-label={ariaLabel}
    >
      <Aria.Item render={resolvedRenderItem} />
    </Aria>
  )
}
