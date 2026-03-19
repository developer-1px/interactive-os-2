import React from 'react'
import './MenuList.css'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { menu } from '../behaviors/menu'
import { core } from '../plugins/core'

interface MenuListProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState) => React.ReactNode
}

const defaultRenderItem = (item: Record<string, unknown>, state: NodeState): React.ReactNode => (
  <span className="menu-inner">
    <span>{(item.data as Record<string, unknown>)?.label as string ?? (item.data as Record<string, unknown>)?.name as string ?? item.id as string}</span>
    {state.expanded !== undefined && (
      <span className="chevron menu-chevron">{state.expanded ? '▾' : '▸'}</span>
    )}
  </span>
)

export function MenuList({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
}: MenuListProps) {
  return (
    <Aria behavior={menu} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
