import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { Aria } from '../primitives/aria'
import { treegrid } from '../pattern/roles/treegrid'
import { history } from '../plugins/history'
import { edit, replaceEditPlugin } from '../plugins/edit'
import { TreeItem } from './items'

interface TreeGridProps extends AriaComponentProps {
  id?: string
  enableEditing?: boolean
  columns?: number
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement =>
  TreeItem(props, node, state)

// Re-export Cell for grid consumers (e.g. TreegridEmail)
// eslint-disable-next-line react-refresh/only-export-components
export const Cell = Aria.Cell

export function TreeGrid({
  id,
  data,
  plugins = [history()],
  onChange,
  renderItem = defaultRenderItem,
  enableEditing = false,
  columns,
  onActivate,
  'aria-label': ariaLabel,
}: TreeGridProps) {
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
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
