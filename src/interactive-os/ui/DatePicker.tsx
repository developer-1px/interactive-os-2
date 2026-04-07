/** @catalog 날짜 선택 피커 */
// ② 2026-04-03-command-unification-prd.md
import React, { useMemo, useCallback, useRef, useEffect } from 'react'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import { DirectionIndicator, ExpandIndicator } from './indicators'
import './DatePicker.css'
import { FOCUS_ID } from '../axis/navigate'
import { useEngine } from '../engine/useEngine'
import { CalendarGrid } from './CalendarGrid'
import { calendarCommands, calendarNavCommands } from './calendarCommands'
import { MONTHS, buildCalendarCells, buildGridStore, findDayIndex, clampDay, formatDate } from './calendarComputation'

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

  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // year/month are TransformAdapter inputs — they rebuild NormalizedData
  const [yearMonth, setYearMonth] = React.useState({ year: target.getFullYear(), month: target.getMonth() })
  const { year, month } = yearMonth
  const [isOpen, setIsOpen] = React.useState(false)
  const [focusDayIndex, setFocusDayIndex] = React.useState(() => findDayIndex(target.getFullYear(), target.getMonth(), target))

  const cells = useMemo(() => buildCalendarCells(year, month), [year, month])
  const cellMeta = useMemo(() => {
    const map = new Map<string, { dayOfMonth: number; isCurrentMonth: boolean }>()
    for (const c of cells) map.set(c.id, { dayOfMonth: c.meta.dayOfMonth, isCurrentMonth: c.meta.isCurrentMonth })
    return map
  }, [cells])

  const gridStore = useMemo(
    () => buildGridStore(year, month, value, focusDayIndex, isOpen),
    [year, month, value, focusDayIndex, isOpen],
  )

  const calendarPlugin = useMemo(() => ({
    name: 'calendar',
    commands: {
      open: calendarCommands.open,
      close: calendarCommands.close,
      setFocusDay: calendarCommands.setFocusDay,
      changeMonth: calendarNavCommands.changeMonth,
      changeYear: calendarNavCommands.changeYear,
    },
  }), [])

  const { engine, store } = useEngine({ data: gridStore, plugins: [calendarPlugin] })

  // ── Dialog open/close ──

  const openDialog = useCallback(() => {
    const t = value ?? today
    const y = t.getFullYear()
    const m = t.getMonth()
    const idx = findDayIndex(y, m, t)
    setYearMonth({ year: y, month: m }) // eslint-disable-line react-hooks/set-state-in-effect
    setFocusDayIndex(idx) // eslint-disable-line react-hooks/set-state-in-effect
    setIsOpen(true) // eslint-disable-line react-hooks/set-state-in-effect
    engine.dispatch(calendarCommands.open(idx))
  }, [engine, value, today])

  const closeDialog = useCallback((returnFocus = true) => {
    dialogRef.current?.hidePopover?.()
    setIsOpen(false)
    engine.dispatch(calendarCommands.close())
    if (returnFocus) requestAnimationFrame(() => inputRef.current?.focus())
  }, [engine])

  // ── Month/year navigation ──

  const changeMonth = useCallback((delta: number) => {
    setYearMonth(prev => {
      let nextMonth = prev.month + delta
      let nextYear = prev.year
      if (nextMonth < 0) { nextYear--; nextMonth = 11 }
      else if (nextMonth > 11) { nextYear++; nextMonth = 0 }
      const focusCell = cells[focusDayIndex]
      if (focusCell) {
        const day = clampDay(nextYear, nextMonth, focusCell.meta.date.getDate())
        const newDate = new Date(nextYear, nextMonth, day)
        setFocusDayIndex(findDayIndex(nextYear, nextMonth, newDate))
      }
      engine.dispatch(calendarNavCommands.changeMonth(delta, nextYear, nextMonth))
      return { year: nextYear, month: nextMonth }
    })
  }, [cells, focusDayIndex, engine])

  const changeYear = useCallback((delta: number) => {
    setYearMonth(prev => {
      const nextYear = prev.year + delta
      engine.dispatch(calendarNavCommands.changeYear(delta, nextYear))
      return { ...prev, year: nextYear }
    })
  }, [engine])

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
      const d = cell.meta.date
      // eslint-disable-next-line react-hooks/set-state-in-effect -- store subscription sync
      setYearMonth({ year: d.getFullYear(), month: d.getMonth() })
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
      if (e.shiftKey) changeYear(-1)
      else changeMonth(-1)
      return
    }
    if (e.key === 'PageDown') {
      e.preventDefault()
      if (e.shiftKey) changeYear(1)
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
  }, [closeDialog, changeMonth, changeYear])

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

  // ── Show popover + focus grid on open ──

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return
    dialogRef.current.showPopover?.()

    requestAnimationFrame(() => {
      const cell = dialogRef.current?.querySelector<HTMLElement>(`[data-calendar-id="day-${focusDayIndex}"]`)
      cell?.focus()
    })
  }, [isOpen, focusDayIndex])

  // ── Space = select without closing ──

  const handleGridContainerKeyDown = useCallback((e: React.KeyboardEvent) => {
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
    <div className={"relative inline-block"}>
      <div className={`${ax({ layout: 'bar' })} dp-anchor`}>
        <input
          ref={inputRef}
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={ariaLabel}
          aria-autocomplete="none"
          className={`cursor-default ${ax({ surface: 'input', textStyle: 'body', text: 'primary' })} dp-input`}
          type="text"
          readOnly
          value={value ? formatDate(value) : ''}
          placeholder="MM/DD/YYYY"
          onClick={openDialog}
          onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); openDialog() } }}
        />
        <button
          className={`${ax({ surface: 'ghost', layout: 'center', text: 'secondary', border: 'default' })} dp-trigger`}
          aria-label="Choose Date"
          tabIndex={-1}
          onClick={() => isOpen ? closeDialog() : openDialog()}
        >
          <ExpandIndicator expanded={isOpen} />
        </button>
      </div>

      {isOpen && (
        <div
          ref={dialogRef}
          popover="manual"
          role="dialog"
          aria-modal="true"
          aria-label="Choose Date"
          className={`${ax({ surface: 'overlay', padding: 'sm', border: 'default', shape: 'sm' })} dp-dialog`}
          onKeyDown={handleDialogKeyDown}
        >
          <div className={`${ax({ layout: 'bar', gap: 'xs' })} dp-nav-bar`}>
            <button className={`${ax({ surface: 'ghost', layout: 'center', text: 'secondary', shape: 'sm' })} dp-nav-btn`} aria-label="Previous Year" onClick={() => changeYear(-1)}>
              <DirectionIndicator direction="prev" double />
            </button>
            <button className={`${ax({ surface: 'ghost', layout: 'center', text: 'secondary', shape: 'sm' })} dp-nav-btn`} aria-label="Previous Month" onClick={() => changeMonth(-1)}>
              <DirectionIndicator direction="prev" />
            </button>
            <span className={`text-center ${ax({ flex: '1', textStyle: 'label', text: 'primary' })} `} aria-live="polite">{MONTHS[month]} {year}</span>
            <button className={`${ax({ surface: 'ghost', layout: 'center', text: 'secondary', shape: 'sm' })} dp-nav-btn`} aria-label="Next Month" onClick={() => changeMonth(1)}>
              <DirectionIndicator direction="next" />
            </button>
            <button className={`${ax({ surface: 'ghost', layout: 'center', text: 'secondary', shape: 'sm' })} dp-nav-btn`} aria-label="Next Year" onClick={() => changeYear(1)}>
              <DirectionIndicator direction="next" double />
            </button>
          </div>

          <div onKeyDown={handleGridContainerKeyDown}>
            <CalendarGrid
              engine={engine}
              store={store}
              cellMeta={cellMeta}
              onActivate={onGridActivate}
              aria-label={`${MONTHS[month]} ${year}`}
            />
          </div>

          <div className={`${ax({ layout: 'row', gap: 'sm' })} dp-actions`}>
            <button className={`${ax({ surface: 'ghost', controlSize: 'sm', padding: 'sm', content: 'text', text: 'primary' })} dp-action-btn font-inherit`} onClick={() => closeDialog()}>Cancel</button>
            <button className={`${ax({ surface: 'ghost', controlSize: 'sm', padding: 'sm', content: 'text', text: 'primary' })} dp-action-btn font-inherit`} onClick={confirmFocused}>OK</button>
          </div>
        </div>
      )}
    </div>
  )
}
