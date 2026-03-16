import React from 'react'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { disclosure } from '../behaviors/disclosure'
import { core } from '../plugins/core'

interface DisclosureGroupProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState) => React.ReactNode
}

const defaultRenderItem = (item: Record<string, unknown>, state: NodeState): React.ReactNode => (
  <div style={{
    padding: '8px 12px',
    background: state.focused ? 'var(--disclosure-focus-bg, #e3f2fd)' : 'transparent',
    cursor: 'default',
    userSelect: 'none',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }}>
    <span style={{ opacity: 0.5 }}>{state.expanded ? '▾' : '▸'}</span>
    <span>{item.label as string ?? item.name as string ?? item.id as string}</span>
  </div>
)

export function DisclosureGroup({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
}: DisclosureGroupProps) {
  return (
    <Aria behavior={disclosure} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Node render={renderItem} />
    </Aria>
  )
}
