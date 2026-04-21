/** @catalog 트리+그리드 복합 테이블 — 모드 분기 엔트리 */
import type React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { Aria } from '../primitives/aria'
import { TreeGridColumns } from './TreeGridColumns'
import { TreeGridSimple } from './TreeGridSimple'

// ── Column mode types ──

export interface ColumnDef {
  key: string
  header: string
  width?: string
}

export type RenderCell = (
  props: React.HTMLAttributes<HTMLElement>,
  value: unknown,
  column: ColumnDef,
  state: NodeState,
  data?: Record<string, unknown>,
) => React.ReactElement

export interface TreeGridColumnProps extends Omit<AriaComponentProps, 'renderItem'> {
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

// ── Simple mode types ──

export interface TreeGridSimpleProps extends AriaComponentProps {
  id?: string
  enableEditing?: boolean
  columns?: number
}

export type TreeGridProps = TreeGridColumnProps | TreeGridSimpleProps

function isColumnMode(props: TreeGridProps): props is TreeGridColumnProps {
  return Array.isArray((props as TreeGridColumnProps).columns)
}

// Re-export Cell for grid consumers (e.g. TreegridEmail)
// eslint-disable-next-line react-refresh/only-export-components
export const Cell = Aria.Cell

// ── Public API ──

export function TreeGrid(props: TreeGridProps) {
  if (isColumnMode(props)) return <TreeGridColumns {...props} />
  return <TreeGridSimple {...props} />
}
