import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { NormalizedData } from '../../store/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { FOCUS_ID } from '../../axis/navigate'
import { SELECTION_ID } from '../../axis/select'
import { useAria } from '../../primitives/useAria'
import { calendarGrid } from '../../pattern/roles/calendarGrid'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import styles from './datepicker.module.css'

// APG #16: Date Picker Combobox
// https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-datepicker/

// ── Calendar computation (pure) ──

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

interface DayCell {
  id: string
  date: Date
  dayOfMonth: number
  isCurrentMonth: boolean
}

function buildCalendarCells(year: number, month: number): DayCell[] {
  const firstDay = getFirstDayOfWeek(year, month)
  const startDate = new Date(year, month, 1 - firstDay)
  const cells: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    cells.push({
      id: `day-${i}`,
      date,
      dayOfMonth: date.getDate(),
      isCurrentMonth: date.getMonth() === month && date.getFullYear() === year,
    })
  }
  return cells
}

function buildGridStore(year: number, month: number, selectedDate: Date | null, focusDayIndex: number): NormalizedData {
  const cells = buildCalendarCells(year, month)
  const entities: Record<string, { id: string; [key: string]: unknown }> = {}
  for (const cell of cells) {
    entities[cell.id] = {
      id: cell.id,
      data: { date: cell.date.toISOString(), dayOfMonth: cell.dayOfMonth, isCurrentMonth: cell.isCurrentMonth },
    }
  }
  entities[FOCUS_ID] = { id: FOCUS_ID, focusedId: `day-${focusDayIndex}` }
  const selectedIdx = selectedDate
    ? cells.findIndex(c => c.date.toDateString() === selectedDate.toDateString())
    : -1
  entities[SELECTION_ID] = { id: SELECTION_ID, selectedIds: selectedIdx >= 0 ? [`day-${selectedIdx}`] : [] }
  return createStore({ entities, relationships: { [ROOT_ID]: cells.map(c => c.id) } })
}

function findDayIndex(year: number, month: number, targetDate: Date): number {
  const firstDay = getFirstDayOfWeek(year, month)
  const startDate = new Date(year, month, 1 - firstDay)
  const diff = Math.round((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, Math.min(41, diff))
}

function formatDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
}

function parseDate(str: string): Date | null {
  const parts = str.split('/')
  if (parts.length !== 3) return null
  const m = parseInt(parts[0]!, 10), d = parseInt(parts[1]!, 10), y = parseInt(parts[2]!, 10)
  if (isNaN(m) || isNaN(d) || isNaN(y)) return null
  return new Date(y, m - 1, d)
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

// ── Calendar Grid (useAria-based) ──

function CalendarGrid({
  year, month, selectedDate, focusDayIndex, isOpen,
  onFocusChange, onSelect, onActivate, onKeyDown,
}: {
  year: number; month: number; selectedDate: Date | null; focusDayIndex: number; isOpen: boolean
  onFocusChange: (idx: number, cell: DayCell) => void
  onSelect: (cell: DayCell) => void
  onActivate: (cell: DayCell) => void
  onKeyDown: (e: React.KeyboardEvent) => void
}) {
  const cells = useMemo(() => buildCalendarCells(year, month), [year, month])
  const gridStore = useMemo(
    () => buildGridStore(year, month, selectedDate, focusDayIndex),
    [year, month, selectedDate, focusDayIndex],
  )

  const onChange = useCallback((nextStore: NormalizedData) => {
    const focusedId = (nextStore.entities[FOCUS_ID]?.focusedId as string) ?? ''
    const match = focusedId.match(/^day-(\d+)$/)
    if (match) {
      const idx = parseInt(match[1]!, 10)
      const cell = cells[idx]
      if (cell) onFocusChange(idx, cell)
    }
    const selectedIds = (nextStore.entities[SELECTION_ID]?.selectedIds as string[]) ?? []
    if (selectedIds.length > 0) {
      const selMatch = selectedIds[0]!.match(/^day-(\d+)$/)
      if (selMatch) {
        const cell = cells[parseInt(selMatch[1]!, 10)]
        if (cell) onSelect(cell)
      }
    }
  }, [cells, onFocusChange, onSelect])

  const onActivateHandler = useCallback((nodeId: string) => {
    const match = nodeId.match(/^day-(\d+)$/)
    if (match) {
      const cell = cells[parseInt(match[1]!, 10)]
      if (cell) onActivate(cell)
    }
  }, [cells, onActivate])

  const aria = useAria({
    pattern: calendarGrid,
    data: gridStore,
    plugins: [],
    onChange,
    onActivate: onActivateHandler,
    autoFocus: false,
  })

  const rows = useMemo(() => {
    const result: DayCell[][] = []
    for (let r = 0; r < 6; r++) result.push(cells.slice(r * 7, r * 7 + 7))
    return result
  }, [cells])

  // Focus the correct day cell when dialog opens or focusDayIndex changes
  useEffect(() => {
    if (!isOpen) return
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-node-id="day-${focusDayIndex}"]`)
      el?.focus()
    })
  }, [isOpen, focusDayIndex])

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <table
      role="grid"
      className={styles.grid}
      aria-label={`${MONTHS[month]} ${year}`}
      {...aria.containerProps}
      onKeyDown={(e: React.KeyboardEvent) => {
        // Let Aria handle arrow keys first, then our handler for PageUp/Down/Tab/Escape
        const ariaHandler = (aria.containerProps as Record<string, unknown>).onKeyDown as ((e: React.KeyboardEvent) => void) | undefined
        ariaHandler?.(e)
        if (!e.defaultPrevented) onKeyDown(e)
      }}
    >
      <thead>
        <tr>
          {DAYS.map(d => <th key={d} className={styles.dayHeader} scope="col">{d}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map(cell => {
              const nodeProps = aria.getNodeProps(cell.id)
              const nodeState = aria.getNodeState(cell.id)
              return (
                <td
                  key={cell.id}
                  {...nodeProps}
                  className={styles.day}
                  data-focused={nodeState.focused || undefined}
                  data-selected={nodeState.selected || undefined}
                  data-outside={!cell.isCurrentMonth || undefined}
                >
                  {cell.dayOfMonth}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Main Component ──

export function DatePickerCombobox() {
  const today = useMemo(() => new Date(), [])
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [focusDayIndex, setFocusDayIndex] = useState(() => findDayIndex(today.getFullYear(), today.getMonth(), today))

  const inputRef = useRef<HTMLInputElement>(null)
  const prevYearRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const okRef = useRef<HTMLButtonElement>(null)
  const nextYearRef = useRef<HTMLButtonElement>(null)

  const changeMonth = useCallback((delta: number) => {
    setMonth(prev => {
      const next = prev + delta
      if (next < 0) { setYear(y => y - 1); return 11 }
      if (next > 11) { setYear(y => y + 1); return 0 }
      return next
    })
  }, [])

  const openDialog = useCallback(() => {
    const target = selectedDate ?? today
    setYear(target.getFullYear())
    setMonth(target.getMonth())
    setFocusDayIndex(findDayIndex(target.getFullYear(), target.getMonth(), target))
    setIsOpen(true)
  }, [selectedDate, today])

  const closeDialog = useCallback((returnFocus = true) => {
    setIsOpen(false)
    if (returnFocus) requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date)
    setInputValue(formatDate(date))
  }, [])

  // Grid callbacks
  const onFocusChange = useCallback((idx: number, cell: DayCell) => {
    if (!cell.isCurrentMonth) {
      setYear(cell.date.getFullYear())
      setMonth(cell.date.getMonth())
      setFocusDayIndex(findDayIndex(cell.date.getFullYear(), cell.date.getMonth(), cell.date))
    } else {
      setFocusDayIndex(idx)
    }
  }, [])

  const onSelect = useCallback((cell: DayCell) => selectDate(cell.date), [selectDate])
  const onActivate = useCallback((cell: DayCell) => { selectDate(cell.date); closeDialog() }, [selectDate, closeDialog])

  const onGridKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'PageUp') { e.preventDefault(); e.shiftKey ? setYear(y => y - 1) : changeMonth(-1) }
    else if (e.key === 'PageDown') { e.preventDefault(); e.shiftKey ? setYear(y => y + 1) : changeMonth(1) }
    else if (e.key === 'Escape') { e.preventDefault(); closeDialog() }
    else if (e.key === 'Tab') { e.preventDefault(); e.shiftKey ? nextYearRef.current?.focus() : cancelRef.current?.focus() }
  }, [changeMonth, closeDialog])

  const onButtonKeyDown = useCallback((e: React.KeyboardEvent, which: string) => {
    if (e.key === 'Escape') { e.preventDefault(); closeDialog(); return }
    if (e.key === 'Tab') {
      if (which === 'prev-year' && e.shiftKey) { e.preventDefault(); okRef.current?.focus() }
      else if (which === 'ok' && !e.shiftKey) { e.preventDefault(); prevYearRef.current?.focus() }
    }
  }, [closeDialog])

  const onInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); openDialog() }
    else if (e.key === 'Escape') { isOpen ? closeDialog() : (setInputValue(''), setSelectedDate(null)) }
  }, [isOpen, openDialog, closeDialog])

  return (
    <div className={styles.datepicker}>
      <label className={styles.label} id="dp-label">Date</label>
      <div className={styles.comboboxGroup}>
        <input
          ref={inputRef}
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-labelledby="dp-label"
          aria-autocomplete="none"
          className={styles.input}
          type="text"
          placeholder="MM/DD/YYYY"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={onInputKeyDown}
          onBlur={() => { if (inputValue) { const d = parseDate(inputValue); if (d && !isNaN(d.getTime())) setSelectedDate(d) } }}
        />
        <button
          className={styles.triggerButton}
          aria-label="Choose Date"
          tabIndex={-1}
          onClick={() => isOpen ? closeDialog() : openDialog()}
        >
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
        </button>
      </div>

      {isOpen && (
        <div role="dialog" aria-modal="true" aria-label="Choose Date" className={styles.dialog}>
          <div className={styles.navBar}>
            <button ref={prevYearRef} className={styles.navButton} aria-label="Previous Year" onClick={() => setYear(y => y - 1)} onKeyDown={e => onButtonKeyDown(e, 'prev-year')}><ChevronsLeft size="1em" /></button>
            <button className={styles.navButton} aria-label="Previous Month" onClick={() => changeMonth(-1)} onKeyDown={e => onButtonKeyDown(e, 'prev-month')}><ChevronLeft size="1em" /></button>
            <span className={styles.monthYear} aria-live="polite">{MONTHS[month]} {year}</span>
            <button className={styles.navButton} aria-label="Next Month" onClick={() => changeMonth(1)} onKeyDown={e => onButtonKeyDown(e, 'next-month')}><ChevronRight size="1em" /></button>
            <button ref={nextYearRef} className={styles.navButton} aria-label="Next Year" onClick={() => setYear(y => y + 1)} onKeyDown={e => onButtonKeyDown(e, 'next-year')}><ChevronsRight size="1em" /></button>
          </div>

          <CalendarGrid
            year={year} month={month} selectedDate={selectedDate}
            focusDayIndex={focusDayIndex} isOpen={isOpen}
            onFocusChange={onFocusChange} onSelect={onSelect}
            onActivate={onActivate} onKeyDown={onGridKeyDown}
          />

          <div className={styles.actions}>
            <button ref={cancelRef} className={styles.actionButton} onClick={() => closeDialog()} onKeyDown={e => onButtonKeyDown(e, 'cancel')}>Cancel</button>
            <button ref={okRef} className={styles.actionButton} onClick={() => {
              const cells = buildCalendarCells(year, month)
              const cell = cells[focusDayIndex]
              if (cell) selectDate(cell.date)
              closeDialog()
            }} onKeyDown={e => onButtonKeyDown(e, 'ok')}>OK</button>
          </div>
        </div>
      )}
    </div>
  )
}
