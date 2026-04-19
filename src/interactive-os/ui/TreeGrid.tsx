/** @catalog 트리+그리드 복합 테이블 */
import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps, ItemSlots } from './types'
import { Aria } from '../primitives/aria'
import { AriaInternalContext } from '../primitives/AriaInternalContext'
import { GRID_COL_ID } from '../axis/navigate'
import { treegrid } from '../pattern/roles/treegrid'
import { history } from '../plugins/history'
import { edit, replaceEditPlugin } from '../plugins/edit'
import { search } from '../plugins/search'
import { cellEdit } from '../plugins/cellEdit'
import { ExpandIndicator, SortIndicator } from './indicators'
import { TreeItem, EditableTreeItem } from './items'
import { ax } from '@styles/ax'

// ── Column mode (Grid-like columns + tree hierarchy) ──

interface ColumnDef {
  key: string
  header: string
  width?: string
}

type RenderCell = (
  props: React.HTMLAttributes<HTMLElement>,
  value: unknown,
  column: ColumnDef,
  state: NodeState,
  data?: Record<string, unknown>,
) => React.ReactElement

interface TreeGridColumnProps extends Omit<AriaComponentProps, 'renderItem'> {
  id?: string
  columns: ColumnDef[]
  renderCell?: RenderCell
  enableEditing?: boolean
  searchable?: boolean
  header?: boolean
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  onSortColumn?: (key: string) => void
  keyMap?: Record<string, import('../axis/types').KeyHandler>
}

// ── Simple mode (TreeItem-based, no columns) ──

interface TreeGridSimpleProps extends AriaComponentProps {
  id?: string
  enableEditing?: boolean
  columns?: number
}

export type TreeGridProps = TreeGridColumnProps | TreeGridSimpleProps

function isColumnMode(props: TreeGridProps): props is TreeGridColumnProps {
  return Array.isArray((props as TreeGridColumnProps).columns)
}

// ── Simple mode helpers ──

function makeRenderItem(editable: boolean, slots?: ItemSlots) {
  const Item = editable ? EditableTreeItem : TreeItem
  if (!slots) return (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement =>
    Item(props, node, state)
  return (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement =>
    Item(props, node, state, {
      icon: slots.icon?.(node, state),
      rightContent: slots.rightContent?.(node, state),
    })
}

// ── Column mode: default cell renderer ──

const defaultRenderCell: RenderCell = (props, value, _column, _state) => (
  <span {...props}>{String(value ?? '')}</span>
)

// Re-export Cell for grid consumers (e.g. TreegridEmail)
// eslint-disable-next-line react-refresh/only-export-components
export const Cell = Aria.Cell

/** Row wrapper that surfaces `data-row-mode` when colIndex === -1 so CSS can paint
 *  the whole row (not individual cells) as the active selection target. */
function TreeGridRow({
  ariaProps,
  focused,
  selected,
  children,
}: {
  ariaProps: React.HTMLAttributes<HTMLElement>
  focused: boolean
  selected: boolean
  children: React.ReactNode
}) {
  const aria = React.useContext(AriaInternalContext)
  const store = aria?.getStore()
  const colIndex = (store?.entities[GRID_COL_ID]?.colIndex as number | undefined) ?? -1
  const rowMode = colIndex < 0
  return (
    <div
      className={ax({ role: 'item', interactive: 'item' })}
      data-focused={focused || undefined}
      data-selected={selected || undefined}
      data-row-mode={rowMode && focused ? '' : undefined}
      {...ariaProps}
    >
      {children}
    </div>
  )
}

// ── Column mode component ──

function TreeGridColumns({
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
}: TreeGridColumnProps) {
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
    const data = node.data as Record<string, unknown> | undefined
    const cells = data?.cells as unknown[] | undefined
    const hasChildren = state.expanded !== undefined
    const depth = (state.level ?? 1) - 1

    return (
      <TreeGridRow
        ariaProps={props}
        focused={state.focused}
        selected={state.selected}
      >
        {columns.map((col, i) => (
          <Aria.Cell key={col.key} index={i}>
            {i === 0 ? (
              <span className={ax({ layout: 'bar' })} style={{ paddingInlineStart: `${depth * 24}px` }}>
                {hasChildren
                  ? <ExpandIndicator expanded={state.expanded} hasChildren variant="tree" />
                  : depth > 0 && <span className={ax({ flex: 'none' })} />}
                {renderCell({} as React.HTMLAttributes<HTMLElement>, cells?.[i], col, state, data)}
              </span>
            ) : (
              renderCell({} as React.HTMLAttributes<HTMLElement>, cells?.[i], col, state, data)
            )}
          </Aria.Cell>
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

// ── Simple mode component ──

function TreeGridSimple({
  id,
  data,
  plugins = [history()],
  onChange,
  renderItem,
  itemSlots,
  enableEditing = false,
  columns,
  onActivate,
  onFocusChange,
  'aria-label': ariaLabel,
}: TreeGridSimpleProps) {
  const defaultRenderer = React.useMemo(() => makeRenderItem(enableEditing, itemSlots), [enableEditing, itemSlots])
  const resolvedRenderItem = renderItem ?? defaultRenderer
  const pattern = React.useMemo(
    () => columns ? treegrid(columns) : treegrid(1),
    [columns],
  )

  const mergedPlugins = React.useMemo(
    () => enableEditing ? [...plugins, edit({ tree: true }), replaceEditPlugin()] : plugins,
    [plugins, enableEditing],
  )

  return (
    <Aria
      id={id}
      pattern={pattern}
      data={data}
      plugins={mergedPlugins}
      onChange={onChange}
      onActivate={onActivate}
      onFocusChange={onFocusChange}
      aria-label={ariaLabel}
    >
      <Aria.Item render={resolvedRenderItem} />
    </Aria>
  )
}

// ── Public API ──

export function TreeGrid(props: TreeGridProps) {
  if (isColumnMode(props)) return <TreeGridColumns {...props} />
  return <TreeGridSimple {...props} />
}
