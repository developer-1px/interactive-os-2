import React from 'react'

import type { NormalizedData, Plugin, Command } from '../core/types'
import type { BehaviorContext, NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { grid as gridBehavior } from '../behaviors/grid'
import { core } from '../plugins/core'
import { clipboardCommands } from '../plugins/clipboard'
import { replaceEditPlugin } from '../axes/edit'

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
  renderCell?: (props: React.HTMLAttributes<HTMLElement>, value: unknown, column: ColumnDef, state: NodeState) => React.ReactElement
  enableEditing?: boolean
  /** Enable Tab/Shift+Tab cell cycling across columns and rows */
  tabCycle?: boolean
  /** Render column headers inside the grid-table container (subgrid-aligned) */
  header?: boolean
  keyMap?: Record<string, (ctx: BehaviorContext) => Command | void>
  'aria-label'?: string
}

/** Cell-level clipboard keyMap (Mod+C/V with colIndex) — component-level override */
const cellClipboardKeyMap: Record<string, (ctx: BehaviorContext) => Command | void> = {
  'Mod+C': (ctx) => {
    const colIndex = ctx.grid?.colIndex ?? 0
    return clipboardCommands.copyCellValue(ctx.focused, colIndex)
  },
  'Mod+V': (ctx) => {
    const colIndex = ctx.grid?.colIndex ?? 0
    return clipboardCommands.pasteCellValue(ctx.focused, colIndex)
  },
}

const defaultRenderCell = (props: React.HTMLAttributes<HTMLElement>, value: unknown, _column: ColumnDef, _state: NodeState): React.ReactElement => (
  <span {...props}>{String(value ?? '')}</span>
)

const defaultPlugins: Plugin[] = [core()]

export function Grid({
  data,
  columns,
  plugins = defaultPlugins,
  onChange,
  renderCell = defaultRenderCell,
  enableEditing = false,
  tabCycle = false,
  header = false,
  keyMap,
  'aria-label': ariaLabel,
}: GridProps) {
  const behavior = React.useMemo(
    () => gridBehavior({ columns: columns.length, tabCycle, edit: enableEditing }),
    [columns.length, tabCycle, enableEditing],
  )

  const mergedPlugins = React.useMemo(
    () => enableEditing ? [...plugins, replaceEditPlugin()] : plugins,
    [plugins, enableEditing],
  )

  const mergedKeyMap = React.useMemo(
    () => (enableEditing || keyMap) ? { ...(enableEditing ? cellClipboardKeyMap : {}), ...keyMap } : undefined,
    [enableEditing, keyMap],
  )

  const gridStyle = React.useMemo(
    () => ({ '--grid-col-count': columns.length } as React.CSSProperties),
    [columns.length],
  )

  const renderRow = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement => {
    const cells = (node.data as Record<string, unknown>)?.cells as unknown[] | undefined
    return (
      <div className="grid-row" {...props}>
        {columns.map((col, i) => (
          <Aria.Cell key={col.key} index={i}>
            {renderCell({} as React.HTMLAttributes<HTMLElement>, cells?.[i], col, state)}
          </Aria.Cell>
        ))}
      </div>
    )
  }

  return (
    <div className="grid-table" style={gridStyle}>
      {header && (
        <div className="grid-header">
          {columns.map((col) => (
            <div key={col.key} className="grid-header-cell">{col.header}</div>
          ))}
        </div>
      )}
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
    </div>
  )
}
