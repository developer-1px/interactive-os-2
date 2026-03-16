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
  renderItem?: (item: Record<string, unknown>, state: NodeState) => React.ReactNode
}

const defaultRenderItem = (item: Record<string, unknown>, state: NodeState): React.ReactNode => (
  <div style={{
    padding: '6px 12px',
    paddingLeft: 12 + ((state.level ?? 1) - 1) * 16,
    background: state.focused ? 'var(--menu-focus-bg, #e3f2fd)' : 'transparent',
    cursor: 'default',
    userSelect: 'none',
    fontSize: 14,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }}>
    <span>{item.label as string ?? item.name as string ?? item.id as string}</span>
    {state.expanded !== undefined && (
      <span style={{ opacity: 0.5, fontSize: 12 }}>{state.expanded ? '▾' : '▸'}</span>
    )}
  </div>
)

export function MenuList({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
}: MenuListProps) {
  return (
    <Aria behavior={menu} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Node render={renderItem} />
    </Aria>
  )
}
