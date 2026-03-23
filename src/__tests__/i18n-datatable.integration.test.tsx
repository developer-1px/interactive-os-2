/**
 * Integration test: i18n DataTable editing behaviors
 *
 * V1: printable key on editable cell → replace edit (contenteditable shows only typed char)
 * E2: printable key on read-only cell (col 0) → no edit
 * V16: F2 on editable cell → preserve edit (existing value shown)
 * V14: replace mode → Escape → original value restored
 * Tab continuation: Tab during editing → confirm + move + auto-edit
 */
import { useState, useRef } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Grid } from '../interactive-os/ui/Grid'
import { Aria } from '../interactive-os/components/aria'
import { core, GRID_COL_ID } from '../interactive-os/plugins/core'
import { rename } from '../interactive-os/plugins/rename'
import { history } from '../interactive-os/plugins/history'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'
import { i18nColumns, i18nInitialData } from '../pages/sharedI18nData'
import type { NormalizedData } from '../interactive-os/core/types'

const plugins = [core(), rename(), history(), focusRecovery()]

/**
 * Stateful wrapper rendering Grid with i18n sample data.
 * Column 0 (key) is read-only. Columns 1-3 (ko, en, ja) are editable via Aria.Editable.
 * enableEditing + tabCycle enabled for Tab continuation testing.
 */
function I18nGrid() {
  const [data, setData] = useState(() => i18nInitialData)
  const dataRef = useRef(data)
  dataRef.current = data

  return (
    <Grid
      data={data}
      columns={i18nColumns}
      plugins={plugins}
      enableEditing
      tabCycle
      onChange={setData}
      aria-label="i18n DataTable"
      renderCell={(value, col, state) => {
        const isEditable = col.key === 'ko' || col.key === 'en' || col.key === 'ja'
        const focusedCol = (dataRef.current.entities[GRID_COL_ID]?.colIndex as number) ?? 0
        const colIdx = i18nColumns.indexOf(col)
        if (isEditable && state.focused && colIdx === focusedCol) {
          return (
            <Aria.Editable field="cells" allowEmpty tabContinue>
              <span>{String(value ?? '')}</span>
            </Aria.Editable>
          )
        }
        return <span>{String(value ?? '')}</span>
      }}
    />
  )
}

function getEditableEl(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[contenteditable]')
}

function getFocusedColIndex(container: HTMLElement): number {
  const focusedRow = container.querySelector('[role="row"][tabindex="0"]')
  if (!focusedRow) return -1
  const focusedCell = focusedRow.querySelector('[role="gridcell"][tabindex="0"]')
  if (!focusedCell) return -1
  const colIndex = focusedCell.getAttribute('aria-colindex')
  return colIndex ? parseInt(colIndex, 10) : -1
}

describe('i18n DataTable editing', () => {
  describe('V1: printable key on editable cell → replace edit', () => {
    it('typing a printable key enters replace mode with only that character', async () => {
      const user = userEvent.setup()
      const { container } = render(<I18nGrid />)

      // Focus first row
      const row = container.querySelector('[role="row"]') as HTMLElement
      act(() => { row.focus() })

      // Navigate to ko column (col 1, aria-colindex=2)
      await user.keyboard('{ArrowRight}')
      expect(getFocusedColIndex(container)).toBe(2) // aria-colindex is 1-based

      // Type a printable key 'x'
      act(() => {
        fireEvent.keyDown(row, { key: 'x' })
      })

      // Should enter editing mode with contenteditable
      const editable = getEditableEl(container)
      expect(editable).not.toBeNull()
      // Content should be only the typed character (replace mode)
      expect(editable!.textContent).toBe('x')
    })
  })

  describe('E2: printable key on read-only cell → no edit', () => {
    it('typing on key column (col 0) does not enter editing', async () => {
      const user = userEvent.setup()
      const { container } = render(<I18nGrid />)

      // Focus first row
      const row = container.querySelector('[role="row"]') as HTMLElement
      act(() => { row.focus() })

      // Ensure col 0 (Home moves to first col)
      await user.keyboard('{Home}')
      expect(getFocusedColIndex(container)).toBe(1) // aria-colindex 1 = key column

      // Type a printable key
      act(() => {
        fireEvent.keyDown(row, { key: 'a' })
      })

      // No contenteditable should appear (key column has no Aria.Editable)
      const editable = getEditableEl(container)
      expect(editable).toBeNull()
    })
  })

  describe('V16: F2 on editable cell → preserve edit (existing value)', () => {
    it('F2 enters edit mode showing the existing cell value', async () => {
      const user = userEvent.setup()
      const { container } = render(<I18nGrid />)

      // Focus first row
      const row = container.querySelector('[role="row"]') as HTMLElement
      act(() => { row.focus() })

      // Navigate to ko column (col 1)
      await user.keyboard('{ArrowRight}')

      // Press F2 to start normal (non-replace) rename
      act(() => {
        fireEvent.keyDown(row, { key: 'F2' })
      })

      // Should enter editing mode
      const editable = getEditableEl(container)
      expect(editable).not.toBeNull()
      // Content should show existing value (first row, ko column = '헤드리스 ARIA 엔진')
      expect(editable!.textContent).toBe('헤드리스 ARIA 엔진')
    })
  })

  describe('V14: replace mode → Escape → original value restored', () => {
    it('Escape during replace mode cancels and restores original value', async () => {
      const user = userEvent.setup()
      const { container } = render(<I18nGrid />)

      // Focus first row
      const row = container.querySelector('[role="row"]') as HTMLElement
      act(() => { row.focus() })

      // Navigate to ko column
      await user.keyboard('{ArrowRight}')

      // Type a key to enter replace mode
      act(() => {
        fireEvent.keyDown(row, { key: 'z' })
      })

      // Verify in editing mode
      let editable = getEditableEl(container)
      expect(editable).not.toBeNull()
      expect(editable!.textContent).toBe('z')

      // Press Escape to cancel
      act(() => {
        fireEvent.keyDown(editable!, { key: 'Escape' })
      })

      // Editing should be cancelled
      editable = getEditableEl(container)
      expect(editable).toBeNull()

      // Original value should be visible in the cell
      const focusedRow = container.querySelector('[role="row"][tabindex="0"]')
      const cells = focusedRow?.querySelectorAll('[role="gridcell"]')
      // ko column cell (index 1) should show original value
      const koCell = cells?.[1]
      expect(koCell?.textContent).toBe('헤드리스 ARIA 엔진')
    })
  })

  describe('Tab continuation: Tab during editing → confirm + move + auto-edit', () => {
    it('Tab during editing confirms value, moves to next cell, and starts editing', () => {
      vi.useFakeTimers()
      try {
        const { container } = render(<I18nGrid />)

        // Focus first row
        const row = container.querySelector('[role="row"]') as HTMLElement
        act(() => { row.focus() })

        // Navigate to ko column (col 1, aria-colindex=2) using fireEvent
        act(() => { fireEvent.keyDown(row, { key: 'ArrowRight' }) })
        expect(getFocusedColIndex(container)).toBe(2)

        // Enter editing with F2
        act(() => { fireEvent.keyDown(row, { key: 'F2' }) })

        let editable = getEditableEl(container)
        expect(editable).not.toBeNull()

        // Type some text
        editable!.textContent = 'new value'

        // Press Tab to confirm + move to next cell
        act(() => { fireEvent.keyDown(editable!, { key: 'Tab' }) })

        // Flush setTimeout(0) for Tab navigation dispatch
        act(() => { vi.advanceTimersByTime(1) })

        // Flush setTimeout(0) for startRename dispatch
        act(() => { vi.advanceTimersByTime(1) })

        // After Tab: should have moved to next column (en, col 2, aria-colindex=3)
        expect(getFocusedColIndex(container)).toBe(3)

        // Should auto-enter editing on the new cell
        editable = getEditableEl(container)
        expect(editable).not.toBeNull()
      } finally {
        vi.useRealTimers()
      }
    })
  })
})
