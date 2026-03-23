import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { menu } from '../behaviors/menu'
import { core } from '../plugins/core'

interface MenuListProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => (
  <span {...props} className="item-inner item-spread">
    <span>{(item.data as Record<string, unknown>)?.label as string ?? (item.data as Record<string, unknown>)?.name as string ?? item.id as string}</span>
    {state.expanded !== undefined && (
      <span className="chevron item-chevron">{state.expanded ? '▾' : '▸'}</span>
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
