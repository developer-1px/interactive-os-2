import React from 'react'
import styles from './TreeView.module.css'
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
  const hasChildren = state.expanded !== undefined

  return (
    <span className={styles.treeInner}>
      <span className={styles.treeChevron}>
        {hasChildren ? (state.expanded ? '▾' : '▸') : ''}
      </span>
      <span>{(node.data as Record<string, unknown>)?.name as string}</span>
    </span>
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
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
