var e=`import type { NormalizedData } from '../store/types'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import { FOCUS_ID } from '../core'
import { SELECTION_ID } from '../axis/select'
import { CALENDAR_ID } from './calendarCommands'

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export interface CellMeta {
  dayOfMonth: number
  isCurrentMonth: boolean
  date: Date
}

export function buildCalendarCells(year: number, month: number): { id: string; meta: CellMeta }[] {
  const firstDay = new Date(year, month, 1).getDay()
  const startDate = new Date(year, month, 1 - firstDay)
  const cells: { id: string; meta: CellMeta }[] = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    cells.push({
      id: \`day-\${i}\`,
      meta: {
        dayOfMonth: date.getDate(),
        isCurrentMonth: date.getMonth() === month && date.getFullYear() === year,
        date,
      },
    })
  }
  return cells
}

export function buildGridStore(year: number, month: number, selectedDate: Date | null, focusDayIndex: number, isOpen: boolean): NormalizedData {
  const cells = buildCalendarCells(year, month)
  const entities: Record<string, { id: string; [key: string]: unknown }> = {}
  for (const cell of cells) {
    entities[cell.id] = { id: cell.id, data: { dayOfMonth: cell.meta.dayOfMonth, isCurrentMonth: cell.meta.isCurrentMonth } }
  }
  entities[FOCUS_ID] = { id: FOCUS_ID, focusedId: \`day-\${focusDayIndex}\` }
  const selectedIdx = selectedDate
    ? cells.findIndex(c => c.meta.date.toDateString() === selectedDate.toDateString())
    : -1
  entities[SELECTION_ID] = { id: SELECTION_ID, selectedIds: selectedIdx >= 0 ? [\`day-\${selectedIdx}\`] : [] }
  entities[CALENDAR_ID] = { id: CALENDAR_ID, isOpen, focusDayIndex }
  return createStore({ entities, relationships: { [ROOT_ID]: cells.map(c => c.id) } })
}

export function findDayIndex(year: number, month: number, targetDate: Date): number {
  const firstDay = new Date(year, month, 1).getDay()
  const startDate = new Date(year, month, 1 - firstDay)
  const diff = Math.round((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, Math.min(41, diff))
}

export function clampDay(year: number, month: number, day: number): number {
  const maxDay = new Date(year, month + 1, 0).getDate()
  return Math.min(day, maxDay)
}

export function formatDate(date: Date): string {
  return \`\${date.getMonth() + 1}/\${date.getDate()}/\${date.getFullYear()}\`
}
`;export{e as default};