// ② 2026-03-31-datepicker-composite-prd.md
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import styles from './DatePicker.module.css'
import type { NormalizedData } from '../store/types'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import { FOCUS_ID } from '../axis/navigate'
import { SELECTION_ID } from '../axis/select'
import { useEngine } from '../engine/useEngine'
import { CalendarGrid } from './CalendarGrid'

// ── Calendar computation (pure) ──

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

interface CellMeta {
  dayOfMonth: number
  isCurrentMonth: boolean
  date: Date
}

function buildCalendarCells(year: number, month: number): { id: string; meta: CellMeta }[] {
  const firstDay = new Date(year, month, 1).getDay()
  const startDate = new Date(year, month, 1 - firstDay)
  const cells: { id: string; meta: CellMeta }[] = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    cells.push({
      id: `day-${i}`,
      meta: {
        dayOfMonth: date.getDate(),
        isCurrentMonth: date.getMonth() === month && date.getFullYear() === year,
        date,
      },
    })
  }
  return cells
}

function buildGridStore(year: number, month: number, selectedDate: Date | null, focusDayIndex: number): NormalizedData {
  const cells = buildCalendarCells(year, month)
  const entities: Record<string, { id: string; [key: string]: unknown }> = {}
  for (const cell of cells) {
    entities[cell.id] = { id: cell.id, data: { dayOfMonth: cell.meta.dayOfMonth, isCurrentMonth: cell.meta.isCurrentMonth } }
  }
  entities[FOCUS_ID] = { id: FOCUS_ID, focusedId: `day-${focusDayIndex}` }
  const selectedIdx = selectedDate
    ? cells.findIndex(c => c.meta.date.toDateString() === selectedDate.toDateString())
    : -1
  entities[SELECTION_ID] = { id: SELECTION_ID, selectedIds: selectedIdx >= 0 ? [`day-${selectedIdx}`] : [] }
  return createStore({ entities, relationships: { [ROOT_ID]: cells.map(c => c.id) } })
}

function findDayIndex(year: number, month: number, targetDate: Date): number {
  const firstDay = new Date(year, month, 1).getDay()
  const startDate = new Date(year, month, 1 - firstDay)
  const diff = Math.round((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, Math.min(41, diff))
}

function formatDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
}

function clampDay(year: number, month: number, day: number): number {
  const maxDay = new Date(year, month + 1, 0).getDate()
  return Math.min(day, maxDay)
}

// ── Focus trap ──

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), [role="gridcell"]',
  ))
}

// ── DatePicker ──

export interface DatePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  'aria-label'?: string
}

export function DatePicker({
  value,
  onChange,
  'aria-label': ariaLabel = 'Date',
}: DatePickerProps) {
  const today = useMemo(() => new Date(), [])
  const target = value ?? today
  const [year, setYear] = useState(target.getFullYear())
  const [month, setMonth] = useState(target.getMonth())
  const [isOpen, setIsOpen] = useState(false)
  const [focusDayIndex, setFocusDayIndex] = useState(() => findDayIndex(target.getFullYear(), target.getMonth(), target))

  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const cells = useMemo(() => buildCalendarCells(year, month), [year, month])
  const cellMeta = useMemo(() => {
    const map = new Map<string, { dayOfMonth: number; isCurrentMonth: boolean }>()
    for (const c of cells) map.set(c.id, { dayOfMonth: c.meta.dayOfMonth, isCurrentMonth: c.meta.isCurrentMonth })
    return map
  }, [cells])

  const gridStore = useMemo(
    () => buildGridStore(year, month, value, focusDayIndex),
    [year, month, value, focusDayIndex],
  )
  const { engine, store } = useEngine({ data: gridStore })

  // ── Dialog open/close ──

  const openDialog = useCallback(() => {
    const t = value ?? today
    setYear(t.getFullYear())
    setMonth(t.getMonth())
    setFocusDayIndex(findDayIndex(t.getFullYear(), t.getMonth(), t))
    setIsOpen(true)
  }, [value, today])

  const closeDialog = useCallback((returnFocus = true) => {
    setIsOpen(false)
    if (returnFocus) requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  // ── Month/year navigation ──

  const changeMonth = useCallback((delta: number) => {
    setMonth(prev => {
      let next = prev + delta
      if (next < 0) { setYear(y => y - 1); next = 11 }
      else if (next > 11) { setYear(y => y + 1); next = 0 }
      // Clamp focus day to new month
      const focusCell = cells[focusDayIndex]
      if (focusCell) {
        const effectiveYear = delta < 0 && prev === 0 ? year - 1 : delta > 0 && prev === 11 ? year + 1 : year
        const day = clampDay(effectiveYear, next, focusCell.meta.date.getDate())
        const newDate = new Date(effectiveYear, next, day)
        setFocusDayIndex(findDayIndex(effectiveYear, next, newDate))
      }
      return next
    })
  }, [cells, focusDayIndex, year])

  // ── Grid callbacks ──

  const onGridActivate = useCallback((nodeId: string) => {
    const match = nodeId.match(/^day-(\d+)$/)
    if (!match) return
    const cell = cells[parseInt(match[1]!, 10)]
    if (!cell) return
    onChange(cell.meta.date)
    closeDialog()
  }, [cells, onChange, closeDialog])

  // ── Focus change detection via store subscription ──

  useEffect(() => {
    if (!isOpen) return
    const currentStore = engine.getStore()
    const focusedId = (currentStore.entities[FOCUS_ID]?.focusedId as string) ?? ''
    const match = focusedId.match(/^day-(\d+)$/)
    if (!match) return
    const idx = parseInt(match[1]!, 10)
    const cell = cells[idx]
    if (cell && !cell.meta.isCurrentMonth) {
      // Moved to a day outside current month — switch month
      const d = cell.meta.date
      setYear(d.getFullYear())
      setMonth(d.getMonth())
      setFocusDayIndex(findDayIndex(d.getFullYear(), d.getMonth(), d))
    } else if (idx !== focusDayIndex) {
      setFocusDayIndex(idx)
    }
  })

  // ── Focus trap (Tab/Shift+Tab) ──

  const handleDialogKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeDialog()
      return
    }

    if (e.key === 'PageUp') {
      e.preventDefault()
      if (e.shiftKey) setYear(y => y - 1)
      else changeMonth(-1)
      return
    }
    if (e.key === 'PageDown') {
      e.preventDefault()
      if (e.shiftKey) setYear(y => y + 1)
      else changeMonth(1)
      return
    }

    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = getFocusableElements(dialogRef.current)
      if (focusable.length === 0) return
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [closeDialog, changeMonth])

  // ── Outside click ──

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        closeDialog(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, closeDialog])

  // ── Focus grid on open ──

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return
    requestAnimationFrame(() => {
      const cell = dialogRef.current?.querySelector<HTMLElement>(`[data-calendar-id="day-${focusDayIndex}"]`)
      cell?.focus()
    })
  }, [isOpen, focusDayIndex])

  // ── Space = select without closing ──

  const handleGridContainerKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Space on grid: select the focused day but don't close
    if (e.key === ' ') {
      e.preventDefault()
      const cell = cells[focusDayIndex]
      if (cell) onChange(cell.meta.date)
    }
  }, [cells, focusDayIndex, onChange])

  // ── Confirm focused day ──

  const confirmFocused = useCallback(() => {
    const cell = cells[focusDayIndex]
    if (cell) onChange(cell.meta.date)
    closeDialog()
  }, [cells, focusDayIndex, onChange, closeDialog])

  return (
    <div className={styles.datepicker}>
      <div className={styles.comboboxGroup}>
        <input
          ref={inputRef}
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={ariaLabel}
          aria-autocomplete="none"
          className={styles.input}
          type="text"
          readOnly
          value={value ? formatDate(value) : ''}
          placeholder="MM/DD/YYYY"
          onClick={openDialog}
          onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); openDialog() } }}
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
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Choose Date"
          className={styles.dialog}
          onKeyDown={handleDialogKeyDown}
        >
          <div className={styles.navBar}>
            <button className={styles.navButton} aria-label="Previous Year" onClick={() => setYear(y => y - 1)}>
              <ChevronsLeft size="1em" />
            </button>
            <button className={styles.navButton} aria-label="Previous Month" onClick={() => changeMonth(-1)}>
              <ChevronLeft size="1em" />
            </button>
            <span className={styles.monthYear} aria-live="polite">{MONTHS[month]} {year}</span>
            <button className={styles.navButton} aria-label="Next Month" onClick={() => changeMonth(1)}>
              <ChevronRight size="1em" />
            </button>
            <button className={styles.navButton} aria-label="Next Year" onClick={() => setYear(y => y + 1)}>
              <ChevronsRight size="1em" />
            </button>
          </div>

          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div onKeyDown={handleGridContainerKeyDown}>
            <CalendarGrid
              engine={engine}
              store={store}
              cellMeta={cellMeta}
              onActivate={onGridActivate}
              aria-label={`${MONTHS[month]} ${year}`}
            />
          </div>

          <div className={styles.actions}>
            <button className={styles.actionButton} onClick={() => closeDialog()}>Cancel</button>
            <button className={styles.actionButton} onClick={confirmFocused}>OK</button>
          </div>
        </div>
      )}
    </div>
  )
}
