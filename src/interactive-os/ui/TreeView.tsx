import React from 'react'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { tree } from '../behaviors/tree'
import { core } from '../plugins/core'

const defaultPlugins: Plugin[] = [core()]

interface TreeViewProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (node: Record<string, unknown>, state: NodeState) => React.ReactNode
}

const defaultRenderItem = (node: Record<string, unknown>, state: NodeState): React.ReactNode => {
  const indent = ((state.level ?? 1) - 1) * 20
  const hasChildren = state.expanded !== undefined

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        paddingLeft: 8 + indent,
        background: state.focused ? 'var(--tree-focus-bg, #e3f2fd)' : state.selected ? 'var(--tree-select-bg, #f5f5f5)' : 'transparent',
        cursor: 'default',
        userSelect: 'none',
        fontSize: 14,
        lineHeight: '24px',
      }}
    >
      <span style={{ width: 16, opacity: 0.5, flexShrink: 0 }}>
        {hasChildren ? (state.expanded ? '▾' : '▸') : ''}
      </span>
      <span>{(node.data as Record<string, unknown>)?.name as string}</span>
    </div>
  )
}

export function TreeView({
  data,
  plugins = defaultPlugins,
  onChange,
  renderItem = defaultRenderItem,
}: TreeViewProps) {
  return (
    <Aria
      behavior={tree}
      data={data}
      plugins={plugins}
      onChange={onChange}
    >
      <Aria.Node render={renderItem} />
    </Aria>
  )
}
