/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { CalendarGrid } from './CalendarGrid'
import { useEngine } from '@os/engine/useEngine'
import { buildCalendarCells, buildGridStore } from './calendarComputation'
import { useMemo } from 'react'

export const meta = {
  slug: 'calendar-grid',
  category: 'ui',
  label: 'CalendarGrid',
}

export function Demo() {
  const year = 2026
  const month = 3 // April

  const cells = useMemo(() => buildCalendarCells(year, month), [])
  const cellMeta = useMemo(() => {
    const map = new Map<string, { dayOfMonth: number; isCurrentMonth: boolean }>()
    for (const c of cells) map.set(c.id, { dayOfMonth: c.meta.dayOfMonth, isCurrentMonth: c.meta.isCurrentMonth })
    return map
  }, [cells])

  const gridStore = useMemo(() => buildGridStore(year, month, null, 0, true), [])
  const { engine, store } = useEngine({ data: gridStore })

  return <CalendarGrid engine={engine} store={store} cellMeta={cellMeta} aria-label="April 2026" />
}
