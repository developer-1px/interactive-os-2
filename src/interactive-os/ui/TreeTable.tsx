/** @catalog 트리 + 다컬럼 테이블 — row-focus only (cell 네비게이션 없음, macOS Finder 리스트 뷰) */
import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { TreeView } from './TreeView'
import { ExpandIndicator, SortIndicator } from './indicators'
import { ax } from '@styles/ax'

interface TreeTableColumn {
  key: string
  header?: string
  width?: string
}

type RenderCell = (
  value: unknown,
  column: TreeTableColumn,
  state: NodeState,
  data?: Record<string, unknown>,
) => React.ReactNode

interface TreeTableProps extends Omit<AriaComponentProps, 'renderItem'> {
  columns: TreeTableColumn[]
  renderCell?: RenderCell
  header?: boolean
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  onSortColumn?: (key: string) => void
  selectable?: boolean
}

const defaultRenderCell: RenderCell = (value) => String(value ?? '')

export function TreeTable({
  data,
  columns,
  plugins,
  onChange,
  onActivate,
  onFocusChange,
  renderCell = defaultRenderCell,
  header = false,
  sortKey,
  sortDir,
  onSortColumn,
  selectable = true,
  'aria-label': ariaLabel,
}: TreeTableProps) {
  const gridStyle = React.useMemo(
    () => ({ '--grid-columns': columns.map(c => c.width ?? '1fr').join(' ') } as React.CSSProperties),
    [columns],
  )

  const renderRow = React.useCallback(
    (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement => {
      const d = node.data as Record<string, unknown> | undefined
      const cells = d?.cells as unknown[] | undefined
      const hasChildren = state.expanded !== undefined
      const depth = (state.level ?? 1) - 1

      return (
        <div
          {...props}
          className={`${props.className ?? ''} ${ax({ role: 'item', interactive: 'item' })}`}
        >
          {columns.map((col, i) => {
            const value = cells?.[i] ?? d?.[col.key]
            if (i === 0) {
              return (
                <span key={col.key} className={ax({ layout: 'bar' })} style={{ paddingInlineStart: `calc(${depth} * var(--space-md))` }}>
                  <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} variant="tree" />
                  {renderCell(value, col, state, d)}
                </span>
              )
            }
            return <span key={col.key}>{renderCell(value, col, state, d)}</span>
          })}
        </div>
      )
    },
    [columns, renderCell],
  )

  return (
    <div className={ax({ layout: 'table' })} style={gridStyle} role="presentation">
      {header && (
        <div role="row" className={ax({ placement: 'sticky' })}>
          {columns.map((col, i) => (
            <div key={col.key} role="columnheader">
              <button
                type="button"
                className={ax({ role: 'item', interactive: 'button', textStyle: 'caption', tone: 'neutral-dim', content: 'text', layout: 'bar' })}
                onClick={onSortColumn ? () => onSortColumn(col.key) : undefined}
                disabled={!onSortColumn}
              >
                {i === 0 && <ExpandIndicator hasChildren={false} variant="tree" />}
                {col.header ?? col.key}
                {sortKey === col.key && <SortIndicator direction={sortDir === 'asc' ? 'ascending' : 'descending'} />}
              </button>
            </div>
          ))}
        </div>
      )}
      <TreeView
        data={data}
        plugins={plugins}
        onChange={onChange}
        onActivate={onActivate}
        onFocusChange={onFocusChange}
        renderItem={renderRow}
        selectable={selectable}
        aria-label={ariaLabel}
      />
    </div>
  )
}
