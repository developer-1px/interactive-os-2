/** @catalog 2차원 그리드 탐색 */
import React from 'react'

import { ax } from '@styles/ax'
import type { Plugin } from '../engine/types'
import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { Aria } from '../primitives/aria'
import { grid as gridBehavior } from '../pattern/roles/grid'
import { cellEdit } from '../plugins/cellEdit'
import { search } from '../plugins/search'
import { edit, replaceEditPlugin } from '../plugins/edit'
import styles from './Grid.module.css'

interface ColumnDef {
  key: string
  header: string
  field?: string
  width?: string
}

interface GridProps extends Omit<AriaComponentProps, 'renderItem'> {
  columns: ColumnDef[]
  renderCell?: (props: React.HTMLAttributes<HTMLElement>, value: unknown, column: ColumnDef, state: NodeState) => React.ReactElement
  enableEditing?: boolean
  /** Enable Ctrl+F search with inline filter */
  searchable?: boolean
  /** Enable Tab/Shift+Tab cell cycling across columns and rows */
  tabCycle?: boolean
  /** Render column headers inside the grid-table container (subgrid-aligned) */
  header?: boolean
  /** Initial focused column index (default 0). Use 1+ to skip a read-only key column. */
  initialColIndex?: number
  keyMap?: Record<string, import('../axis/types').KeyHandler>
  onFocusChange?: (nodeId: string | null) => void
}

const defaultRenderCell = (props: React.HTMLAttributes<HTMLElement>, value: unknown, _column: ColumnDef, _state: NodeState): React.ReactElement => (
  <span {...props}>{String(value ?? '')}</span>
)

const defaultPlugins: Plugin[] = []

export function Grid({
  data,
  columns,
  plugins = defaultPlugins,
  onChange,
  onActivate,
  onFocusChange,
  renderCell = defaultRenderCell,
  enableEditing = false,
  searchable = false,
  tabCycle = false,
  header = false,
  initialColIndex,
  keyMap,
  'aria-label': ariaLabel,
}: GridProps) {
  const pattern = React.useMemo(
    () => gridBehavior({ columns: columns.length, tabCycle, initialColIndex }),
    [columns.length, tabCycle, initialColIndex],
  )

  const mergedPlugins = React.useMemo(
    () => {
      const result = [...plugins]
      if (enableEditing) { result.push(edit(), replaceEditPlugin(), cellEdit()) }
      if (searchable) { result.push(search()) }
      return result
    },
    [plugins, enableEditing, searchable],
  )

  const gridStyle = React.useMemo(
    () => {
      const hasCustomWidth = columns.some(c => c.width)
      if (hasCustomWidth) {
        return { '--grid-columns': columns.map(c => c.width ?? '1fr').join(' ') } as React.CSSProperties
      }
      return { '--grid-col-count': columns.length } as React.CSSProperties
    },
    [columns],
  )

  const renderRow = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement => {
    const cells = (node.data as Record<string, unknown>)?.cells as unknown[] | undefined
    return (
      <div
        className={`${styles.row} ${ax({ role: 'item' })}`}
        data-focused={state.focused || undefined}
        data-selected={state.selected || undefined}
        {...props}
      >
        {columns.map((col, i) => (
          <Aria.Cell key={col.key} index={i}>
            {renderCell({} as React.HTMLAttributes<HTMLElement>, cells?.[i], col, state)}
          </Aria.Cell>
        ))}
      </div>
    )
  }

  return (
    <div className={`${styles.table} ${ax({ width: 'full', flex: '1' })}`} style={gridStyle}>
      {header && (
        <div className={`${styles.header} ${ax({ placement: 'sticky', surface: 'sunken', border: 'bottom' })}`}>
          {columns.map((col, i) => (
            <div key={col.key} className={ax({ role: 'item', textStyle: 'overline', text: 'secondary', content: 'text', ...(i < columns.length - 1 ? { border: 'end' } : {}) })}>{col.header}</div>
          ))}
        </div>
      )}
      <Aria
        pattern={pattern}
        data={data}
        plugins={mergedPlugins}
        onChange={onChange}
        onActivate={onActivate}
        onFocusChange={onFocusChange}
        keyMap={keyMap}
        aria-label={ariaLabel}
      >
        <Aria.Item render={renderRow} />
      </Aria>
    </div>
  )
}
