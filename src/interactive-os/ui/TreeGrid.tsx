import React from 'react'

import type { NormalizedData, Plugin, Command } from '../core/types'
import type { BehaviorContext, NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { treegrid } from '../behaviors/treegrid'
import { core } from '../plugins/core'
import { history } from '../plugins/history'
import { crudCommands } from '../plugins/crud'
import { renameCommands } from '../plugins/rename'
import { dndCommands } from '../plugins/dnd'

interface TreeGridProps {
  id?: string
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (node: Record<string, unknown>, state: NodeState) => React.ReactNode
  enableEditing?: boolean
}

const defaultRenderItem = (node: Record<string, unknown>, state: NodeState): React.ReactNode => {
  const hasChildren = state.expanded !== undefined

  return (
    <span className="item-inner">
      <span className="item-chevron--tree">
        {hasChildren ? (state.expanded ? '▾' : '▸') : ''}
      </span>
      <span>{(node.data as Record<string, unknown>)?.name as string}</span>
    </span>
  )
}

const editingKeyMap: Record<string, (ctx: BehaviorContext) => Command | void> = {
  'Delete': (ctx) => crudCommands.remove(ctx.focused),
  'F2': (ctx) => renameCommands.startRename(ctx.focused),
  'Alt+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
  'Alt+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),
  'Alt+ArrowLeft': (ctx) => dndCommands.moveOut(ctx.focused),
  'Alt+ArrowRight': (ctx) => dndCommands.moveIn(ctx.focused),
}

export function TreeGrid({
  id,
  data,
  plugins = [core(), history()],
  onChange,
  renderItem = defaultRenderItem,
  enableEditing = false,
}: TreeGridProps) {
  return (
    <Aria
      id={id}
      behavior={treegrid}
      data={data}
      plugins={plugins}
      onChange={onChange}
      keyMap={enableEditing ? editingKeyMap : undefined}
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
