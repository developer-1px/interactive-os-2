import React from 'react'
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
  const indent = ((state.level ?? 1) - 1) * 20
  const hasChildren = state.expanded !== undefined

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        paddingLeft: 8 + indent,
        background: state.focused ? 'var(--tree-focus-bg, #e3f2fd)' : state.selected ? 'var(--tree-select-bg, #f5f5f5)' : 'transparent',
        cursor: 'default',
        userSelect: 'none',
        fontSize: 14,
        lineHeight: '24px',
      }}
    >
      <span style={{ width: 16, opacity: 0.5, flexShrink: 0 }}>
        {hasChildren ? (state.expanded ? '▾' : '▸') : ''}
      </span>
      <span>{(node.data as Record<string, unknown>)?.name as string}</span>
    </div>
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
