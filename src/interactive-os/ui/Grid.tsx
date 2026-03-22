import React from 'react'

import type { NormalizedData, Plugin, Command } from '../core/types'
import type { BehaviorContext, NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { grid as gridBehavior } from '../behaviors/grid'
import { core } from '../plugins/core'
import { crudCommands } from '../plugins/crud'
import { renameCommands } from '../plugins/rename'
import { dndCommands } from '../plugins/dnd'

interface ColumnDef {
  key: string
  header: string
  field?: string
}

interface GridProps {
  data: NormalizedData
  columns: ColumnDef[]
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderCell?: (value: unknown, column: ColumnDef, state: NodeState) => React.ReactNode
  enableEditing?: boolean
  keyMap?: Record<string, (ctx: BehaviorContext) => Command | void>
  'aria-label'?: string
}

const editingKeyMap: Record<string, (ctx: BehaviorContext) => Command | void> = {
  'Delete': (ctx) => crudCommands.remove(ctx.focused),
  'F2': (ctx) => renameCommands.startRename(ctx.focused),
  'Alt+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
  'Alt+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),
}

const defaultRenderCell = (value: unknown): React.ReactNode => (
  <span>{String(value ?? '')}</span>
)

export function Grid({
  data,
  columns,
  plugins = [core()],
  onChange,
  renderCell = defaultRenderCell,
  enableEditing = false,
  keyMap,
  'aria-label': ariaLabel,
}: GridProps) {
  const behavior = React.useMemo(() => gridBehavior({ columns: columns.length }), [columns.length])

  const mergedKeyMap = React.useMemo(
    () => ({ ...(enableEditing ? editingKeyMap : {}), ...keyMap }),
    [enableEditing, keyMap],
  )

  const renderRow = (node: Record<string, unknown>, state: NodeState): React.ReactNode => {
    const cells = (node.data as Record<string, unknown>)?.cells as unknown[] | undefined
    return (
      <div className="grid-row">
        {columns.map((col, i) => (
          <Aria.Cell key={col.key} index={i}>
            {renderCell(cells?.[i], col, state)}
          </Aria.Cell>
        ))}
      </div>
    )
  }

  return (
    <Aria
      behavior={behavior}
      data={data}
      plugins={plugins}
      onChange={onChange}
      keyMap={Object.keys(mergedKeyMap).length > 0 ? mergedKeyMap : undefined}
      aria-label={ariaLabel}
    >
      <Aria.Item render={renderRow} />
    </Aria>
  )
}
