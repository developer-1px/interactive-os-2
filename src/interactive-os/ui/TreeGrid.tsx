import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { treegrid } from '../behaviors/treegrid'
import { core } from '../plugins/core'
import { history } from '../plugins/history'
import { replaceEditPlugin } from '../axes/edit'

interface TreeGridProps {
  id?: string
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState) => React.ReactElement
  enableEditing?: boolean
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const hasChildren = state.expanded !== undefined

  return (
    <span {...props} className="item-inner">
      <span className="item-chevron--tree">
        {hasChildren ? (state.expanded ? '▾' : '▸') : ''}
      </span>
      <span>{(node.data as Record<string, unknown>)?.name as string}</span>
    </span>
  )
}

export function TreeGrid({
  id,
  data,
  plugins = [core(), history()],
  onChange,
  renderItem = defaultRenderItem,
  enableEditing = false,
}: TreeGridProps) {
  const behavior = React.useMemo(
    () => treegrid({ edit: enableEditing }),
    [enableEditing],
  )

  const mergedPlugins = React.useMemo(
    () => enableEditing ? [...plugins, replaceEditPlugin()] : plugins,
    [plugins, enableEditing],
  )

  return (
    <Aria
      id={id}
      behavior={behavior}
      data={data}
      plugins={mergedPlugins}
      onChange={onChange}
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
