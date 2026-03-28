import React from 'react'
import { ExpandIndicator } from './indicators'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { treegrid } from '../pattern/roles/treegrid'
import { history } from '../plugins/history'
import { edit, replaceEditPlugin } from '../plugins/edit'

interface TreeGridProps {
  id?: string
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState) => React.ReactElement
  enableEditing?: boolean
  columns?: number
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
    ?? (node.data as Record<string, unknown>)?.name as string
    ?? node.id as string
  const hasChildren = state.expanded !== undefined
  return (
    <div {...props} className="flex-row items-center gap-xs">
      <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
      <span>{label}</span>
    </div>
  )
}

export function TreeGrid({
  id,
  data,
  plugins = [history()],
  onChange,
  renderItem = defaultRenderItem,
  enableEditing = false,
  columns,
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
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
