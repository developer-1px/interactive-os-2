import React from 'react'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { radiogroup } from '../behaviors/radiogroup'
import { core } from '../plugins/core'

interface RadioGroupProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState) => React.ReactNode
}

const defaultRenderItem = (item: Record<string, unknown>, state: NodeState): React.ReactNode => (
  <div
    style={{
      padding: '6px 12px',
      background: state.focused ? 'var(--list-focus-bg, #e3f2fd)' : 'transparent',
      cursor: 'default',
      userSelect: 'none',
      fontSize: 14,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}
  >
    <span style={{ fontSize: 16 }}>{state.selected ? '◉' : '○'}</span>
    <span>{(item.data as Record<string, unknown>)?.label as string ?? item.id as string}</span>
  </div>
)

export function RadioGroup({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
}: RadioGroupProps) {
  return (
    <Aria behavior={radiogroup} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Node render={renderItem} />
    </Aria>
  )
}
