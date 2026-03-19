import React from 'react'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { switchBehavior } from '../behaviors/switch'
import { core } from '../plugins/core'

interface SwitchGroupProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState) => React.ReactNode
}

const defaultRenderItem = (item: Record<string, unknown>, state: NodeState): React.ReactNode => {
  const label =
    (item.data as Record<string, unknown>)?.label as string ??
    (item.data as Record<string, unknown>)?.name as string ??
    item.id as string
  const checked = state.expanded ?? false

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
      <span>{label}</span>
      <span style={{ fontWeight: 600, color: checked ? 'var(--accent)' : 'var(--text-muted)' }}>
        {checked ? '●' : '○'}
      </span>
    </span>
  )
}

export function SwitchGroup({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
}: SwitchGroupProps) {
  return (
    <Aria behavior={switchBehavior} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Node render={renderItem} />
    </Aria>
  )
}
