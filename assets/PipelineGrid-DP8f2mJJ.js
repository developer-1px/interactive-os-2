var e=`/** @catalog 프로젝트 파이프라인 추상화 수준 그리드 */
import React from 'react'

import type { AriaComponentProps } from './types'
import type { NormalizedData } from '../store/types'
import { TreeGrid } from './TreeGrid'
import { TierCell } from './cells/TierCell'
import { PhaseCell } from './cells/PhaseCell'
import type { NodeState } from '../pattern/types'
import { GRID_COL_ID } from '../axis/navigate'

export interface ColumnDef {
  key: string
  header: string
  width?: string
}

export interface CellFocusInfo {
  rowId: string
  colKey: string
  colIndex: number
}

interface PipelineGridProps extends Omit<AriaComponentProps, 'renderItem'> {
  columns: ColumnDef[]
  header?: boolean
  onCellFocus?: (info: CellFocusInfo | null) => void
}

const STATUS_MAP: Record<string, 'done' | 'wip' | 'empty'> = {
  done: 'done',
  propagated: 'done',
  partial: 'wip',
  missing: 'empty',
}

function pipelineCellRouter(
  _props: React.HTMLAttributes<HTMLElement>,
  value: unknown,
  column: { key: string },
  _state: NodeState,
) {
  if (!value) return <span />

  if (column.key === 'feature') {
    const v = value as { text: string; tier: string; subtitle?: string; thumbnail?: string | null }
    return <TierCell text={v.text} tier={v.tier as 'need' | 'story' | 'feature' | 'screen' | 'layer' | 'component'} subtitle={v.subtitle} thumbnail={v.thumbnail} />
  }

  const v = value as { status: string | null }
  if (!v || v.status === null) return <span />

  return <PhaseCell status={STATUS_MAP[v.status] ?? 'empty'} />
}

export function PipelineGrid({
  data,
  columns,
  onChange,
  onActivate,
  onCellFocus,
  header,
  'aria-label': ariaLabel,
}: PipelineGridProps) {
  const rowRef = React.useRef<string>('')
  const pendingFocusRef = React.useRef<CellFocusInfo | null | undefined>(undefined)

  // Flush pending cell focus outside of the onChange → render cycle
  React.useEffect(() => {
    if (pendingFocusRef.current === undefined) return
    const pending = pendingFocusRef.current
    pendingFocusRef.current = undefined
    onCellFocus?.(pending)
  })

  // Track colIndex changes through store updates
  const handleChange = React.useCallback((next: NormalizedData) => {
    onChange?.(next)

    if (!onCellFocus || !rowRef.current) return

    const colEntity = next.entities[GRID_COL_ID]
    const colIndex = (colEntity?.colIndex as number) ?? 0
    const safeIndex = Math.max(0, colIndex)
    pendingFocusRef.current = { rowId: rowRef.current, colKey: columns[safeIndex]?.key ?? 'title', colIndex: safeIndex }
  }, [onChange, onCellFocus, columns])

  // Track row focus changes
  const handleFocusChange = React.useCallback((nodeId: string | null) => {
    if (!onCellFocus) return
    if (!nodeId) {
      rowRef.current = ''
      pendingFocusRef.current = null
      return
    }

    rowRef.current = nodeId
    pendingFocusRef.current = { rowId: nodeId, colKey: columns[0]?.key ?? 'title', colIndex: 0 }
  }, [onCellFocus, columns])

  return (
    <TreeGrid
      data={data}
      columns={columns}
      onChange={handleChange}
      onActivate={onActivate}
      onFocusChange={handleFocusChange}
      renderCell={pipelineCellRouter}
      header={header}
      aria-label={ariaLabel}
    />
  )
}
`;export{e as default};