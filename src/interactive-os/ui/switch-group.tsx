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
    <div style={{
      padding: '8px 12px',
      background: state.focused ? 'var(--switch-focus-bg, #e3f2fd)' : 'transparent',
      cursor: 'default',
      userSelect: 'none',
      fontSize: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    }}>
      <span>{label}</span>
      <span style={{
        fontWeight: 600,
        color: checked ? 'var(--switch-on-color, #1976d2)' : 'var(--switch-off-color, #9e9e9e)',
      }}>
        {checked ? '●' : '○'}
      </span>
    </div>
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
