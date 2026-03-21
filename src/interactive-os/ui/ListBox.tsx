import React from 'react'
import './ListBox.css'
import type { NormalizedData, Plugin, Command } from '../core/types'
import type { BehaviorContext, NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { listbox } from '../behaviors/listbox'
import { core } from '../plugins/core'
import { history } from '../plugins/history'
import { crudCommands } from '../plugins/crud'
import { renameCommands } from '../plugins/rename'
import { dndCommands } from '../plugins/dnd'

interface ListBoxProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState) => React.ReactNode
  enableEditing?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultRenderItem = (item: Record<string, unknown>, _state: NodeState): React.ReactNode => (
  <span>
    {(item.data as Record<string, unknown>)?.label as string ?? (item.data as Record<string, unknown>)?.name as string ?? item.id as string}
  </span>
)

const editingKeyMap: Record<string, (ctx: BehaviorContext) => Command | void> = {
  'Delete': (ctx) => crudCommands.remove(ctx.focused),
  'Enter': (ctx) => renameCommands.startRename(ctx.focused),
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
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
