import React from 'react'
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
      <div style={{ display: 'flex' }}>
        {columns.map((col, i) => (
          <Aria.Cell key={col.key} index={i}>
            <div
              style={{
                padding: '4px 12px',
                minWidth: 120,
                background: state.focused ? 'var(--grid-focus-bg, #e3f2fd)' : state.selected ? 'var(--grid-select-bg, #f5f5f5)' : 'transparent',
                cursor: 'default',
                userSelect: 'none',
                fontSize: 14,
                lineHeight: '28px',
              }}
            >
              {renderCell(cells?.[i], col, state)}
            </div>
          </Aria.Cell>
        ))}
      </div>
    )
  }

  return (
    <Aria behavior={behavior} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Node render={renderRow} />
    </Aria>
  )
}
