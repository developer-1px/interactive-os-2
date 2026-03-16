import React from 'react'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { listbox } from '../behaviors/listbox'
import { core } from '../plugins/core'

interface ListBoxProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState) => React.ReactNode
}

const defaultRenderItem = (item: Record<string, unknown>, state: NodeState): React.ReactNode => (
  <div
    style={{
      padding: '6px 12px',
      background: state.focused ? 'var(--list-focus-bg, #e3f2fd)' : state.selected ? 'var(--list-select-bg, #e8f5e9)' : 'transparent',
      cursor: 'default',
      userSelect: 'none',
      fontSize: 14,
      borderLeft: state.selected ? '3px solid var(--list-accent, #4caf50)' : '3px solid transparent',
    }}
  >
    {(item.data as Record<string, unknown>)?.label as string ?? (item.data as Record<string, unknown>)?.name as string ?? item.id as string}
  </div>
)

export function ListBox({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
}: ListBoxProps) {
  return (
    <Aria behavior={listbox} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Node render={renderItem} />
    </Aria>
  )
}
