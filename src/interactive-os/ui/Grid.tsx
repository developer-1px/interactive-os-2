import React from 'react'
import './Grid.module.css'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { grid as gridBehavior } from '../behaviors/grid'
import { core } from '../plugins/core'

interface ColumnDef {
  key: string
  header: string
}

interface GridProps {
  data: NormalizedData
  columns: ColumnDef[]
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderCell?: (value: unknown, column: ColumnDef, state: NodeState) => React.ReactNode
  'aria-label'?: string
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
  'aria-label': ariaLabel,
}: GridProps) {
  const behavior = React.useMemo(() => gridBehavior({ columns: columns.length }), [columns.length])

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
    <Aria behavior={behavior} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderRow} />
    </Aria>
  )
}
