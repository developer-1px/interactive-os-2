/** @catalog TreeGrid column 모드 — header + row 렌더 + plugin 합성 */
import React from 'react'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { treegrid } from '../pattern/roles/treegrid'
import { edit, replaceEditPlugin } from '../plugins/edit'
import { search } from '../plugins/search'
import { cellEdit } from '../plugins/cellEdit'
import { SortIndicator } from './indicators'
import { ax } from '@styles/ax'
import { TreeGridRow } from './TreeGridRow'
import { TreeGridCell } from './TreeGridCell'
import type { TreeGridColumnProps, RenderCell } from './TreeGrid'

const defaultRenderCell: RenderCell = (props, value) => (
  <span {...props}>{String(value ?? '')}</span>
)

export function TreeGridColumns({
  id,
  data,
  columns,
  plugins: userPlugins,
  onChange,
  onActivate,
  onFocusChange,
  renderCell = defaultRenderCell,
  enableEditing = false,
  searchable = false,
  header = false,
  sortKey,
  sortDir,
  onSortColumn,
  keyMap,
  'aria-label': ariaLabel,
}: TreeGridColumnProps): React.ReactElement {
  const plugins = userPlugins ?? []
  const pattern = React.useMemo(
    () => treegrid(columns.length),
    [columns.length],
  )

  const mergedPlugins = React.useMemo(
    () => {
      const result = [...plugins]
      if (enableEditing) { result.push(edit({ tree: true }), replaceEditPlugin(), cellEdit()) }
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
    const nodeData = node.data as Record<string, unknown> | undefined
    const cells = nodeData?.cells as unknown[] | undefined
    const hasChildren = state.expanded !== undefined
    const depth = (state.level ?? 1) - 1

    return (
      <TreeGridRow
        ariaProps={props}
        focused={state.focused}
        selected={state.selected}
      >
        {columns.map((col, i) => (
          <TreeGridCell
            key={col.key}
            column={col}
            columnIndex={i}
            value={cells?.[i]}
            state={state}
            data={nodeData}
            depth={depth}
            hasChildren={hasChildren}
            renderCell={renderCell}
          />
        ))}
      </TreeGridRow>
    )
  }

  return (
    <div className={ax({ layout: 'table' })} style={gridStyle}>
      {header && (
        <div role="row" className={ax({ placement: 'sticky' })}>
          {columns.map((col) => (
            <div key={col.key} role="columnheader">
              <button
                type="button"
                className={ax({ role: 'item', interactive: 'button', textStyle: 'caption', tone: 'neutral-dim', content: 'text', layout: 'bar' })}
                onClick={onSortColumn ? () => onSortColumn(col.key) : undefined}
              >
                {col.header}
                {sortKey === col.key && <SortIndicator direction={sortDir === 'asc' ? 'ascending' : 'descending'} />}
              </button>
            </div>
          ))}
        </div>
      )}
      <Aria
        id={id}
        pattern={pattern}
        data={data}
        plugins={mergedPlugins}
        onChange={onChange}
        onActivate={onActivate}
        onFocusChange={onFocusChange}
        keyMap={keyMap}
        aria-label={ariaLabel}
      >
        {searchable && <Aria.Search placeholder="Search..." />}
        <Aria.Item render={renderRow} />
      </Aria>
    </div>
  )
}
