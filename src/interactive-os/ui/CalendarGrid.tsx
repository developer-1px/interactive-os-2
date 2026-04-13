/** @catalog 날짜 선택용 캘린더 그리드 */
// ② 2026-03-31-datepicker-composite-prd.md
import React, { useMemo } from 'react'
import { ax } from '@styles/ax'
import './CalendarGrid.css'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import type { CommandEngine } from '../engine/createCommandEngine'
import { calendarGrid } from '../pattern/roles/calendarGrid'
import { useAriaZone } from '../primitives/useAriaZone'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export interface CalendarGridProps {
  engine: CommandEngine
  store: NormalizedData
  cellMeta: Map<string, { dayOfMonth: number; isCurrentMonth: boolean }>
  onActivate?: (nodeId: string) => void
  'aria-label'?: string
}

const defaultRenderCell = (
  props: React.HTMLAttributes<HTMLElement>,
  _node: Record<string, unknown>,
  state: NodeState,
  meta: { dayOfMonth: number; isCurrentMonth: boolean },
  onClick?: () => void,
): React.ReactElement => (
  <td
    {...props}
    className={`calendar-day text-center ${ax({ recipe: 'control-sm', text: 'primary', padding: 'xs', content: 'text', gap: 'xs', shape: 'xs', layout: 'row', clamp: '1' })}`}
    data-focused={state.focused || undefined}
    data-selected={state.selected || undefined}
    data-outside={!meta.isCurrentMonth || undefined}
    onClick={onClick}
  >
    {meta.dayOfMonth}
  </td>
)

export function CalendarGrid({
  engine,
  store,
  cellMeta,
  onActivate,
  'aria-label': ariaLabel,
}: CalendarGridProps) {
  const grid = useAriaZone({
    engine,
    store,
    pattern: calendarGrid,
    scope: 'calendar',
    onActivate,
  })

  const cellIds = useMemo(() => {
    const ids: string[] = []
    cellMeta.forEach((_v, k) => ids.push(k))
    return ids
  }, [cellMeta])

  const rows = useMemo(() => {
    const result: string[][] = []
    for (let r = 0; r < 6; r++) result.push(cellIds.slice(r * 7, r * 7 + 7))
    return result
  }, [cellIds])

  return (
    <table
      role="grid"
      className="border-collapse"
      aria-label={ariaLabel}
      {...(grid.containerProps as React.HTMLAttributes<HTMLTableElement>)}
    >
      <thead>
        <tr>
          {DAYS.map(d => <th key={d} className={`text-center ${ax({ textStyle: 'caption', text: 'muted', padding: 'xs', weight: 'medium' })}`} scope="col">{d}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map(cellId => {
              const meta = cellMeta.get(cellId)
              if (!meta) return null
              const nodeProps = grid.getNodeProps(cellId)
              const nodeState = grid.getNodeState(cellId)
              const entity = store.entities[cellId] ?? { id: cellId }
              return (
                <React.Fragment key={cellId}>
                  {defaultRenderCell(
                    nodeProps as React.HTMLAttributes<HTMLElement>,
                    entity,
                    nodeState,
                    meta,
                    onActivate ? () => onActivate(cellId) : undefined,
                  )}
                </React.Fragment>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
