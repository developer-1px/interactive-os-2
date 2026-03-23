import React from 'react'

import type { NormalizedData, Plugin, Command } from '../core/types'
import type { BehaviorContext, NodeState } from '../behaviors/types'
import type { CommandEngine } from '../core/createCommandEngine'
import { Aria } from '../components/aria'
import { grid as gridBehavior } from '../behaviors/grid'
import { core, FOCUS_ID } from '../plugins/core'
import { crudCommands } from '../plugins/crud'
import { renameCommands, RENAME_ID } from '../plugins/rename'
import { dndCommands } from '../plugins/dnd'
import { clipboardCommands } from '../plugins/clipboard'
import { isPrintableKey } from '../plugins/typeahead'

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
  /** Enable Tab/Shift+Tab cell cycling across columns and rows */
  tabCycle?: boolean
  keyMap?: Record<string, (ctx: BehaviorContext) => Command | void>
  'aria-label'?: string
}

const editingKeyMap: Record<string, (ctx: BehaviorContext) => Command | void> = {
  'Delete': (ctx) => crudCommands.remove(ctx.focused),
  'F2': (ctx) => renameCommands.startRename(ctx.focused),
  'Alt+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
  'Alt+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),
  'Mod+C': (ctx) => {
    const colIndex = ctx.grid?.colIndex ?? 0
    return clipboardCommands.copyCellValue(ctx.focused, colIndex)
  },
  'Mod+V': (ctx) => {
    const colIndex = ctx.grid?.colIndex ?? 0
    return clipboardCommands.pasteCellValue(ctx.focused, colIndex)
  },
}

const defaultRenderCell = (value: unknown): React.ReactNode => (
  <span>{String(value ?? '')}</span>
)

/** Plugin that intercepts printable keys on focused cells and starts replace-mode editing */
function createReplaceEditPlugin(): Plugin {
  return {
    onUnhandledKey(event: KeyboardEvent, engine: CommandEngine): boolean {
      if (!isPrintableKey(event)) return false
      const store = engine.getStore()
      // Don't trigger if already in rename mode
      if (store.entities[RENAME_ID]?.active) return false
      const focusedId = (store.entities[FOCUS_ID]?.focusedId as string) ?? ''
      if (!focusedId) return false
      engine.dispatch(renameCommands.startRename(focusedId, { replace: true, initialChar: event.key }))
      return true
    },
  }
}

export function Grid({
  data,
  columns,
  plugins = [core()],
  onChange,
  renderCell = defaultRenderCell,
  enableEditing = false,
  tabCycle = false,
  keyMap,
  'aria-label': ariaLabel,
}: GridProps) {
  const behavior = React.useMemo(
    () => gridBehavior({ columns: columns.length, tabCycle }),
    [columns.length, tabCycle],
  )

  const replaceEditPlugin = React.useMemo(
    () => enableEditing ? createReplaceEditPlugin() : null,
    [enableEditing],
  )
  const mergedPlugins = React.useMemo(
    () => replaceEditPlugin ? [...plugins, replaceEditPlugin] : plugins,
    [plugins, replaceEditPlugin],
  )

  const hasKeyMap = enableEditing || !!keyMap
  const mergedKeyMap = React.useMemo(
    () => hasKeyMap ? { ...(enableEditing ? editingKeyMap : {}), ...keyMap } : undefined,
    [enableEditing, keyMap, hasKeyMap],
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
      plugins={mergedPlugins}
      onChange={onChange}
      keyMap={mergedKeyMap}
      aria-label={ariaLabel}
    >
      <Aria.Item render={renderRow} />
    </Aria>
  )
}
