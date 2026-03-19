import React from 'react'
import './TreeView.css'
import type { NormalizedData, Plugin, Command } from '../core/types'
import type { BehaviorContext, NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { treegrid } from '../behaviors/treegrid'
import { core } from '../plugins/core'
import { history, historyCommands } from '../plugins/history'
import { crudCommands } from '../plugins/crud'
import { clipboardCommands } from '../plugins/clipboard'
import { renameCommands } from '../plugins/rename'
import { dndCommands } from '../plugins/dnd'

interface TreeGridProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (node: Record<string, unknown>, state: NodeState) => React.ReactNode
  enableEditing?: boolean
}

const defaultRenderItem = (node: Record<string, unknown>, state: NodeState): React.ReactNode => {
  const hasChildren = state.expanded !== undefined

  return (
    <span className="tree-inner">
      <span className="chevron tree-chevron">
        {hasChildren ? (state.expanded ? '▾' : '▸') : ''}
      </span>
      <span>{(node.data as Record<string, unknown>)?.name as string}</span>
    </span>
  )
}

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
  'Alt+ArrowLeft': (ctx) => dndCommands.moveOut(ctx.focused),
  'Alt+ArrowRight': (ctx) => dndCommands.moveIn(ctx.focused),
}

export function TreeGrid({
  data,
  plugins = [core(), history()],
  onChange,
  renderItem = defaultRenderItem,
  enableEditing = false,
}: TreeGridProps) {
  return (
    <Aria
      behavior={treegrid}
      data={data}
      plugins={plugins}
      onChange={onChange}
      keyMap={enableEditing ? editingKeyMap : undefined}
    >
      <Aria.Node render={renderItem} />
    </Aria>
  )
}
