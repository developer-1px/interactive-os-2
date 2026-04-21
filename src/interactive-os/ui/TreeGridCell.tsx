/** @catalog TreeGrid 셀 한 칸 — Aria.Cell + col 0의 depth indent + ExpandIndicator 주입 */
import React from 'react'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { ExpandIndicator } from './indicators'
import { ax } from '@styles/ax'
import type { ColumnDef, RenderCell } from './TreeGrid'

interface TreeGridCellProps {
  column: ColumnDef
  columnIndex: number
  value: unknown
  state: NodeState
  data?: Record<string, unknown>
  depth: number
  hasChildren: boolean
  renderCell: RenderCell
}

export function TreeGridCell({
  column,
  columnIndex,
  value,
  state,
  data,
  depth,
  hasChildren,
  renderCell,
}: TreeGridCellProps): React.ReactElement {
  return (
    <Aria.Cell index={columnIndex}>
      {columnIndex === 0 ? (
        <span className={ax({ layout: 'bar' })} style={{ paddingInlineStart: `${depth * 24}px` }}>
          {hasChildren
            ? <ExpandIndicator expanded={state.expanded} hasChildren variant="tree" />
            : depth > 0 && <span className={ax({ flex: 'none' })} />}
          {renderCell({} as React.HTMLAttributes<HTMLElement>, value, column, state, data)}
        </span>
      ) : (
        renderCell({} as React.HTMLAttributes<HTMLElement>, value, column, state, data)
      )}
    </Aria.Cell>
  )
}
