import React from 'react'
import type { NormalizedData, Plugin, Command } from '../core/types'
import type { BehaviorContext, NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { tabs } from '../behaviors/tabs'
import { core } from '../plugins/core'
import { history, historyCommands } from '../plugins/history'
import { crudCommands } from '../plugins/crud'
import { clipboardCommands } from '../plugins/clipboard'
import { renameCommands } from '../plugins/rename'
import { dndCommands } from '../plugins/dnd'

interface TabListProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (tab: Record<string, unknown>, state: NodeState) => React.ReactNode
  enableEditing?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultRenderItem = (tab: Record<string, unknown>, _state: NodeState): React.ReactNode => (
  <span>{(tab.data as Record<string, unknown>)?.label as string ?? (tab.data as Record<string, unknown>)?.name as string ?? tab.id as string}</span>
)

const editingKeyMap: Record<string, (ctx: BehaviorContext) => Command | void> = {
  'Mod+C': (ctx) => clipboardCommands.copy(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
  'Mod+X': (ctx) => clipboardCommands.cut(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
  'Mod+V': (ctx) => clipboardCommands.paste(ctx.focused),
  'Delete': (ctx) => crudCommands.remove(ctx.focused),
  'Mod+Z': () => historyCommands.undo(),
  'Mod+Shift+Z': () => historyCommands.redo(),
  'F2': (ctx) => renameCommands.startRename(ctx.focused),
  'Alt+ArrowLeft': (ctx) => dndCommands.moveUp(ctx.focused),
  'Alt+ArrowRight': (ctx) => dndCommands.moveDown(ctx.focused),
}

export function TabList({
  data,
  plugins = [core(), history()],
  onChange,
  renderItem = defaultRenderItem,
  enableEditing = false,
}: TabListProps) {
  return (
    <Aria
      behavior={tabs}
      data={data}
      plugins={plugins}
      onChange={onChange}
      keyMap={enableEditing ? editingKeyMap : undefined}
    >
      <Aria.Node render={renderItem} />
    </Aria>
  )
}
