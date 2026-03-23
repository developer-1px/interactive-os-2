/**
 * Integration test: i18n DataTable editing behaviors
 *
 * V1: printable key on editable cell → replace edit (contenteditable shows only typed char)
 * E2: printable key on read-only cell (col 0) → no edit
 * V6: Mod+Z undo chain — multi-edit undo in reverse order
 * V8: empty cell renders empty string
 * V9: arrow keys in edit mode → text cursor, not grid navigation
 * V13: empty string confirm with allowEmpty
 * V14: replace mode → Escape → original value restored
 * V15: blur confirms edit
 * V16: F2 on editable cell → preserve edit (existing value shown)
 * V17: F2 on read-only cell → no edit
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
import { clipboard, resetClipboard } from '../interactive-os/plugins/clipboard'
import { i18nColumns, i18nInitialData } from '../pages/sharedI18nData'
import type { NormalizedData } from '../interactive-os/core/types'

const plugins = [core(), rename(), history(), focusRecovery(), clipboard()]

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
      renderCell={(_props, value, col, state) => {
        const isEditable = col.key === 'ko' || col.key === 'en' || col.key === 'ja'
        const focusedCol = (dataRef.current.entities[GRID_COL_ID]?.colIndex as number) ?? 0
        const colIdx = i18nColumns.indexOf(col)
        if (isEditable && state.focused && colIdx === focusedCol) {
          return (
            <Aria.Editable field={`cells.${colIdx}`} allowEmpty tabContinue>
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

  describe('V7: cell-level copy/paste in Grid with enableEditing', () => {
    beforeEach(() => {
      resetClipboard()
    })

    it('Mod+C copies cell value at current column, Mod+V pastes into another cell', async () => {
      const user = userEvent.setup()
      const { container } = render(<I18nGrid />)

      // Focus first row
      const row = container.querySelector('[role="row"]') as HTMLElement
      act(() => { row.focus() })

      // Navigate to ko column (col 1, aria-colindex=2)
      await user.keyboard('{ArrowRight}')
      expect(getFocusedColIndex(container)).toBe(2)

      // Copy cell value with Mod+C
      await user.keyboard('{Control>}c{/Control}')

      // Navigate to en column (col 2, aria-colindex=3)
      await user.keyboard('{ArrowRight}')
      expect(getFocusedColIndex(container)).toBe(3)

      // Paste cell value with Mod+V
      await user.keyboard('{Control>}v{/Control}')

      // en column should now have the ko value ('헤드리스 ARIA 엔진')
      const focusedRow = container.querySelector('[role="row"][tabindex="0"]')
      const cells = focusedRow?.querySelectorAll('[role="gridcell"]')
      // en column is index 2 (0=key, 1=ko, 2=en, 3=ja)
      expect(cells?.[2]?.textContent).toBe('헤드리스 ARIA 엔진')
    })

    it('paste is undoable via Mod+Z', async () => {
      const user = userEvent.setup()
      const { container } = render(<I18nGrid />)

      const row = container.querySelector('[role="row"]') as HTMLElement
      act(() => { row.focus() })

      // Navigate to ko column and copy
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{Control>}c{/Control}')

      // Navigate to en column and paste
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{Control>}v{/Control}')

      // Verify paste happened
      let focusedRow = container.querySelector('[role="row"][tabindex="0"]')
      let cells = focusedRow?.querySelectorAll('[role="gridcell"]')
      expect(cells?.[2]?.textContent).toBe('헤드리스 ARIA 엔진')

      // Undo with Mod+Z
      await user.keyboard('{Control>}z{/Control}')

      // en column should be restored to original value
      focusedRow = container.querySelector('[role="row"][tabindex="0"]')
      cells = focusedRow?.querySelectorAll('[role="gridcell"]')
      expect(cells?.[2]?.textContent).toBe('Headless ARIA Engine')
    })
  })

  describe('V6: Mod+Z undo chain', () => {
    beforeEach(() => {
      resetClipboard()
    })

    it('undoes multiple paste operations in reverse order', async () => {
      const user = userEvent.setup()
      const { container } = render(<I18nGrid />)

      // Focus first row
      const row = container.querySelector('[role="row"]') as HTMLElement
      act(() => { row.focus() })

      // Navigate to ko column (col 1, aria-colindex=2)
      await user.keyboard('{ArrowRight}')
      expect(getFocusedColIndex(container)).toBe(2)

      // Copy ko cell value ('헤드리스 ARIA 엔진')
      await user.keyboard('{Control>}c{/Control}')

      // Navigate to en column (col 2, aria-colindex=3) and paste
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{Control>}v{/Control}')

      // Verify: en column now has ko value
      let focusedRow = container.querySelector('[role="row"][tabindex="0"]')
      let cells = focusedRow?.querySelectorAll('[role="gridcell"]')
      expect(cells?.[2]?.textContent).toBe('헤드리스 ARIA 엔진')

      // Navigate to ja column (col 3, aria-colindex=4) and paste
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{Control>}v{/Control}')

      // Verify: ja column now has ko value
      focusedRow = container.querySelector('[role="row"][tabindex="0"]')
      cells = focusedRow?.querySelectorAll('[role="gridcell"]')
      expect(cells?.[3]?.textContent).toBe('헤드리스 ARIA 엔진')

      // Mod+Z → ja column reverts to original ('')
      await user.keyboard('{Control>}z{/Control}')
      focusedRow = container.querySelector('[role="row"][tabindex="0"]')
      cells = focusedRow?.querySelectorAll('[role="gridcell"]')
      expect(cells?.[3]?.textContent).toBe('')

      // Mod+Z → en column reverts to original ('Headless ARIA Engine')
      await user.keyboard('{Control>}z{/Control}')
      focusedRow = container.querySelector('[role="row"][tabindex="0"]')
      cells = focusedRow?.querySelectorAll('[role="gridcell"]')
      expect(cells?.[2]?.textContent).toBe('Headless ARIA Engine')
    })
  })

  describe('V8: empty cell renders empty string', () => {
    it('cell with empty value renders empty text content', () => {
      const { container } = render(<I18nGrid />)

      // hero-title row is first row, ja column (col 3, index 3) has empty string ''
      const rows = container.querySelectorAll('[role="row"]')
      const firstRow = rows[0] as HTMLElement
      const cells = firstRow.querySelectorAll('[role="gridcell"]')
      // ja column is index 3 (0=key, 1=ko, 2=en, 3=ja)
      const jaCell = cells[3]
      expect(jaCell?.textContent).toBe('')
    })
  })

  describe('V9: arrow keys in edit mode = text cursor, not grid navigation', () => {
    it('ArrowLeft/ArrowRight do not navigate grid while editing', () => {
      vi.useFakeTimers()
      try {
        const { container } = render(<I18nGrid />)

        const row = container.querySelector('[role="row"]') as HTMLElement
        act(() => { row.focus() })

        // Navigate to ko column (col 1)
        act(() => { fireEvent.keyDown(row, { key: 'ArrowRight' }) })
        expect(getFocusedColIndex(container)).toBe(2)

        // Enter editing with F2
        act(() => { fireEvent.keyDown(row, { key: 'F2' }) })
        let editable = getEditableEl(container)
        expect(editable).not.toBeNull()

        // Press ArrowLeft — should stay in editing mode
        act(() => { fireEvent.keyDown(editable!, { key: 'ArrowLeft' }) })
        editable = getEditableEl(container)
        expect(editable).not.toBeNull()
        // Still at same column
        expect(getFocusedColIndex(container)).toBe(2)

        // Press ArrowRight — should stay in editing mode
        act(() => { fireEvent.keyDown(editable!, { key: 'ArrowRight' }) })
        editable = getEditableEl(container)
        expect(editable).not.toBeNull()
        expect(getFocusedColIndex(container)).toBe(2)
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('V13: empty string confirm with allowEmpty', () => {
    it('confirming empty content preserves empty string (does not cancel)', () => {
      vi.useFakeTimers()
      try {
        const { container } = render(<I18nGrid />)

        const row = container.querySelector('[role="row"]') as HTMLElement
        act(() => { row.focus() })

        // Navigate to ko column (col 1)
        act(() => { fireEvent.keyDown(row, { key: 'ArrowRight' }) })

        // Enter editing with F2
        act(() => { fireEvent.keyDown(row, { key: 'F2' }) })
        let editable = getEditableEl(container)
        expect(editable).not.toBeNull()

        // Clear content to empty string
        editable!.textContent = ''

        // Press Enter to confirm
        act(() => { fireEvent.keyDown(editable!, { key: 'Enter' }) })

        // Editing should end
        editable = getEditableEl(container)
        expect(editable).toBeNull()

        // Cell should show empty string (not original value)
        const focusedRow = container.querySelector('[role="row"][tabindex="0"]')
        const cells = focusedRow?.querySelectorAll('[role="gridcell"]')
        expect(cells?.[1]?.textContent).toBe('')
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('V15: blur confirms edit', () => {
    it('blurring the editable element confirms the new value', () => {
      vi.useFakeTimers()
      try {
        const { container } = render(<I18nGrid />)

        const row = container.querySelector('[role="row"]') as HTMLElement
        act(() => { row.focus() })

        // Navigate to ko column (col 1)
        act(() => { fireEvent.keyDown(row, { key: 'ArrowRight' }) })

        // Enter editing with F2
        act(() => { fireEvent.keyDown(row, { key: 'F2' }) })
        const editable = getEditableEl(container)
        expect(editable).not.toBeNull()

        // Modify content
        editable!.textContent = 'blurred value'

        // Blur to confirm
        act(() => { editable!.blur() })

        // Cell should show the new value
        const focusedRow = container.querySelector('[role="row"][tabindex="0"]')
        const cells = focusedRow?.querySelectorAll('[role="gridcell"]')
        expect(cells?.[1]?.textContent).toBe('blurred value')
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('V17: F2 on read-only cell → no edit', () => {
    it('F2 on key column (col 0) does not enter editing', () => {
      vi.useFakeTimers()
      try {
        const { container } = render(<I18nGrid />)

        const row = container.querySelector('[role="row"]') as HTMLElement
        act(() => { row.focus() })

        // Ensure col 0 (key column)
        act(() => { fireEvent.keyDown(row, { key: 'Home' }) })
        expect(getFocusedColIndex(container)).toBe(1) // aria-colindex 1 = key column

        // Press F2
        act(() => { fireEvent.keyDown(row, { key: 'F2' }) })

        // No contenteditable should appear
        const editable = getEditableEl(container)
        expect(editable).toBeNull()
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('Cell edit isolation: editing one cell does not affect other cells', () => {
    it('replace edit on EN cell only changes EN, preserves KEY/KO/JA', async () => {
      const user = userEvent.setup()
      const { container } = render(<I18nGrid />)

      // Focus first row
      const row = container.querySelector('[role="row"]') as HTMLElement
      act(() => { row.focus() })

      // Navigate to EN column (col 2, aria-colindex=3)
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{ArrowRight}')
      expect(getFocusedColIndex(container)).toBe(3)

      // Type 'z' to enter replace mode
      act(() => { fireEvent.keyDown(row, { key: 'z' }) })

      // Verify editing
      const editable = getEditableEl(container)
      expect(editable).not.toBeNull()
      expect(editable!.textContent).toBe('z')

      // Type more and confirm with Enter
      editable!.textContent = 'New EN Value'
      act(() => { fireEvent.keyDown(editable!, { key: 'Enter' }) })

      // Verify: EN cell changed
      const focusedRow = container.querySelector('[role="row"][tabindex="0"]')
      const cells = focusedRow?.querySelectorAll('[role="gridcell"]')
      expect(cells?.[2]?.textContent).toBe('New EN Value')

      // Verify: other cells unchanged
      expect(cells?.[0]?.textContent).toBe('hero.title')       // KEY
      expect(cells?.[1]?.textContent).toBe('헤드리스 ARIA 엔진')  // KO
      expect(cells?.[3]?.textContent).toBe('')                    // JA (empty)
    })

    it('F2 preserve edit on KO cell only changes KO', async () => {
      const user = userEvent.setup()
      const { container } = render(<I18nGrid />)

      const row = container.querySelector('[role="row"]') as HTMLElement
      act(() => { row.focus() })

      // Navigate to KO column (col 1, aria-colindex=2)
      await user.keyboard('{ArrowRight}')
      expect(getFocusedColIndex(container)).toBe(2)

      // F2 to enter preserve edit
      act(() => { fireEvent.keyDown(row, { key: 'F2' }) })

      const editable = getEditableEl(container)
      expect(editable).not.toBeNull()

      // Modify and confirm
      editable!.textContent = 'Updated KO'
      act(() => { fireEvent.keyDown(editable!, { key: 'Enter' }) })

      // Verify: KO changed, others unchanged
      const focusedRow = container.querySelector('[role="row"][tabindex="0"]')
      const cells = focusedRow?.querySelectorAll('[role="gridcell"]')
      expect(cells?.[0]?.textContent).toBe('hero.title')
      expect(cells?.[1]?.textContent).toBe('Updated KO')
      expect(cells?.[2]?.textContent).toBe('Headless ARIA Engine')
      expect(cells?.[3]?.textContent).toBe('')
    })

    it('undo after cell paste restores only that cell', async () => {
      resetClipboard()
      const user = userEvent.setup()
      const { container } = render(<I18nGrid />)

      const row = container.querySelector('[role="row"]') as HTMLElement
      act(() => { row.focus() })

      // Navigate to KO column, copy
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{Control>}c{/Control}')

      // Navigate to EN column, paste
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{Control>}v{/Control}')

      // Verify: EN changed, others intact
      let cells = container.querySelector('[role="row"][tabindex="0"]')?.querySelectorAll('[role="gridcell"]')
      expect(cells?.[0]?.textContent).toBe('hero.title')
      expect(cells?.[1]?.textContent).toBe('헤드리스 ARIA 엔진')
      expect(cells?.[2]?.textContent).toBe('헤드리스 ARIA 엔진')

      // Undo
      await user.keyboard('{Control>}z{/Control}')

      // Verify: EN restored, others still intact
      cells = container.querySelector('[role="row"][tabindex="0"]')?.querySelectorAll('[role="gridcell"]')
      expect(cells?.[0]?.textContent).toBe('hero.title')
      expect(cells?.[1]?.textContent).toBe('헤드리스 ARIA 엔진')
      expect(cells?.[2]?.textContent).toBe('Headless ARIA Engine')
    })
  })
})
