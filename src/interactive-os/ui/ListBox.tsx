import React from 'react'
import type { NormalizedData, Plugin, Command } from '../core/types'
import type { BehaviorContext, NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { listbox } from '../behaviors/listbox'
import { core } from '../plugins/core'
import { history, historyCommands } from '../plugins/history'
import { crudCommands } from '../plugins/crud'
import { clipboardCommands } from '../plugins/clipboard'
import { renameCommands } from '../plugins/rename'
import { dndCommands } from '../plugins/dnd'

interface ListBoxProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState) => React.ReactNode
  enableEditing?: boolean
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

const editingKeyMap: Record<string, (ctx: BehaviorContext) => Command | void> = {
  'Mod+C': (ctx) => clipboardCommands.copy(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
  'Mod+X': (ctx) => clipboardCommands.cut(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
  'Mod+V': (ctx) => clipboardCommands.paste(ctx.focused),
  'Delete': (ctx) => crudCommands.remove(ctx.focused),
  'Mod+Z': () => historyCommands.undo(),
  'Mod+Shift+Z': () => historyCommands.redo(),
  'F2': (ctx) => renameCommands.startRename(ctx.focused),
  'Alt+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
  'Alt+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),
}

export function ListBox({
  data,
  plugins = [core(), history()],
  onChange,
  renderItem = defaultRenderItem,
  enableEditing = false,
}: ListBoxProps) {
  return (
    <Aria
      behavior={listbox}
      data={data}
      plugins={plugins}
      onChange={onChange}
      keyMap={enableEditing ? editingKeyMap : undefined}
    >
      <Aria.Node render={renderItem} />
    </Aria>
  )
}
