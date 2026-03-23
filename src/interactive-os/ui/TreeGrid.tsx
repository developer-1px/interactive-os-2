import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { treegrid } from '../behaviors/treegrid'
import { core } from '../plugins/core'
import { history } from '../plugins/history'
import { replaceEditPlugin } from '../axes/edit'
import styles from './TreeGrid.module.css'

interface TreeGridProps {
  id?: string
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState) => React.ReactElement
  enableEditing?: boolean
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
    ?? (node.data as Record<string, unknown>)?.name as string
    ?? node.id as string
  const hasChildren = state.expanded !== undefined
  const cls = styles.item + (state.focused ? ' ' + styles.itemFocused : '') + (state.selected ? ' ' + styles.itemSelected : '')
  return (
    <div {...props} className={cls}>
      <span className={styles.chevron}>{hasChildren ? (state.expanded ? '▾' : '▸') : ''}</span>
      <span>{label}</span>
    </div>
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
