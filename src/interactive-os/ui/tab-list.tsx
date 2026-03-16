import React from 'react'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { tabs } from '../behaviors/tabs'
import { core } from '../plugins/core'

interface TabListProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderTab?: (tab: Record<string, unknown>, state: NodeState) => React.ReactNode
}

const defaultRenderTab = (tab: Record<string, unknown>, state: NodeState): React.ReactNode => (
  <div
    style={{
      display: 'inline-flex',
      padding: '8px 16px',
      borderBottom: state.selected ? '2px solid var(--tab-accent, #1976d2)' : '2px solid transparent',
      color: state.selected ? 'var(--tab-active-color, #1976d2)' : 'inherit',
      fontWeight: state.selected ? 600 : 400,
      cursor: 'default',
      userSelect: 'none',
      fontSize: 14,
    }}
  >
    {tab.label as string ?? tab.name as string ?? tab.id as string}
  </div>
)

export function TabList({
  data,
  plugins = [core()],
  onChange,
  renderTab = defaultRenderTab,
}: TabListProps) {
  return (
    <Aria behavior={tabs} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Node render={renderTab} />
    </Aria>
  )
}
