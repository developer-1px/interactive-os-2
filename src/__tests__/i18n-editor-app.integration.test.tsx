import { describe, it, expect, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetClipboard } from '../interactive-os/plugins/clipboard'
import PageI18nEditor from '../pages/PageI18nEditor'
import { translatableEntriesToGrid } from '../pages/cms/cmsI18nAdapter'
import { cmsStore } from '../pages/cms/cms-store'

// ── Helpers ──

function getFocusedRowId(container: HTMLElement): string | null {
  const focused = container.querySelector('[role="row"][tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

function getRowCount(container: HTMLElement): number {
  return container.querySelectorAll('[role="row"]').length
}

function getAllRows(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('[role="row"]'))
}

function getCellText(row: HTMLElement, colIndex: number): string {
  const cells = row.querySelectorAll('[role="gridcell"]')
  return cells[colIndex]?.textContent ?? ''
}

function focusRow(row: HTMLElement) {
  act(() => row.focus())
}

// ── Tests ──

describe('PageI18nEditor', () => {
  beforeEach(() => resetClipboard())

  // ── Rendering ──

  describe('rendering', () => {
    it('renders page title and key hints', () => {
      const { container } = render(<PageI18nEditor />)
      expect(container.querySelector('.page-title')?.textContent).toBe('i18n Editor')
      expect(container.querySelector('.page-desc')).not.toBeNull()
      const kbds = container.querySelectorAll('kbd')
      expect(kbds.length).toBeGreaterThanOrEqual(7) // Enter, Shift+Enter, F2, Tab, Delete, ⌘X/C/V, ⌘Z
    })

    it('renders Grid with role="grid" and aria-label', () => {
      const { container } = render(<PageI18nEditor />)
      const grid = container.querySelector('[role="grid"]')
      expect(grid).not.toBeNull()
      expect(grid?.getAttribute('aria-label')).toBe('i18n Translation Editor')
    })

    it('renders 4 column headers (key + 3 locales)', () => {
      const { container } = render(<PageI18nEditor />)
      const headers = container.querySelectorAll('.grid-header-cell')
      expect(headers.length).toBe(4)
      expect(headers[0]?.textContent).toBe('KEY')
      expect(headers[1]?.textContent).toBe('KO')
      expect(headers[2]?.textContent).toBe('EN')
      expect(headers[3]?.textContent).toBe('JA')
    })

    it('renders all CMS translatable fields as rows', () => {
      const { container } = render(<PageI18nEditor />)
      const gridData = translatableEntriesToGrid(cmsStore)
      const expectedRows = Object.keys(gridData.entities).filter(k => !k.startsWith('__')).length
      expect(getRowCount(container)).toBe(expectedRows)
    })

    it('key column shows identifier text with cell-key class', () => {
      const { container } = render(<PageI18nEditor />)
      const keyCell = container.querySelector('.cell-key')
      expect(keyCell).not.toBeNull()
      // Key format: "entityId.fieldName"
      expect(keyCell?.textContent).toMatch(/\w+\.\w+/)
    })

    it('empty locale cells show "—" with cell-empty class', () => {
      const { container } = render(<PageI18nEditor />)
      // localeMap() creates { ko: 'text', en: '', ja: '' } — en/ja are empty for most entries
      const emptyCells = container.querySelectorAll('.cell-empty')
      expect(emptyCells.length).toBeGreaterThan(0)
      // All empty cells show "—"
      for (const cell of emptyCells) {
        expect(cell.textContent).toBe('—')
      }
    })

    it('non-empty locale cells show actual text without cell-empty class', () => {
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      // First row ko column should have actual text (not "—")
      const koText = getCellText(rows[0]!, 1)
      expect(koText).not.toBe('—')
      expect(koText).not.toBe('')
    })
  })

  // ── Cell mode navigation ──

  describe('cell mode navigation', () => {
    it('Enter moves focus to next row', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      const secondRowId = rows[1]!.getAttribute('data-node-id')
      focusRow(rows[0]!)
      await user.keyboard('{Enter}')
      expect(getFocusedRowId(container)).toBe(secondRowId)
      expect(container.querySelector('[data-renaming]')).toBeNull()
    })

    it('Shift+Enter moves focus to previous row', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      const firstRowId = rows[0]!.getAttribute('data-node-id')
      focusRow(rows[1]!)
      await user.keyboard('{Shift>}{Enter}{/Shift}')
      expect(getFocusedRowId(container)).toBe(firstRowId)
    })

    it('ArrowDown moves focus to next row', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      const secondRowId = rows[1]!.getAttribute('data-node-id')
      focusRow(rows[0]!)
      await user.keyboard('{ArrowDown}')
      expect(getFocusedRowId(container)).toBe(secondRowId)
    })

    it('ArrowRight moves to next column', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      focusRow(rows[0]!)
      // Initially on col 0 (key)
      await user.keyboard('{ArrowRight}')
      // Now on col 1 (ko) — the active cell should have Editable
      const focusedRow = container.querySelector('[role="row"][tabindex="0"]')
      const activeCells = focusedRow?.querySelectorAll('[role="gridcell"]')
      // Col 1 gridcell should have tabindex="0" (focused column)
      expect(activeCells?.[1]?.getAttribute('tabindex')).toBe('0')
    })

    it('Enter at last row does not move', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      const lastRow = rows[rows.length - 1]!
      const lastRowId = lastRow.getAttribute('data-node-id')
      focusRow(lastRow)
      await user.keyboard('{Enter}')
      expect(getFocusedRowId(container)).toBe(lastRowId)
    })

    it('Shift+Enter at first row does not move', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      const firstRowId = rows[0]!.getAttribute('data-node-id')
      focusRow(rows[0]!)
      await user.keyboard('{Shift>}{Enter}{/Shift}')
      expect(getFocusedRowId(container)).toBe(firstRowId)
    })
  })

  // ── Cell editing ──

  describe('cell editing', () => {
    it('F2 on editable column enters edit mode', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      focusRow(rows[0]!)
      await user.keyboard('{ArrowRight}') // move to ko column
      await user.keyboard('{F2}')
      expect(container.querySelector('[data-renaming]')).not.toBeNull()
      expect(container.querySelector('[contenteditable]')).not.toBeNull()
    })

    it('F2 on key column does not enter edit mode', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      focusRow(rows[0]!)
      // Stay on key column (col 0)
      await user.keyboard('{F2}')
      expect(container.querySelector('[contenteditable]')).toBeNull()
    })

    it('typing printable key enters replace edit mode', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      focusRow(rows[0]!)
      await user.keyboard('{ArrowRight}') // ko column
      await user.keyboard('a')
      // Should be in edit mode with the typed character
      expect(container.querySelector('[contenteditable]')).not.toBeNull()
      const editable = container.querySelector('[contenteditable]')
      expect(editable?.textContent).toBe('a')
    })

    it('Escape cancels edit and restores original value', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      focusRow(rows[0]!)
      await user.keyboard('{ArrowRight}')
      const originalText = getCellText(rows[0]!, 1)
      await user.keyboard('{F2}')
      await user.keyboard('new value')
      await user.keyboard('{Escape}')
      expect(container.querySelector('[data-renaming]')).toBeNull()
      // Value should be restored
      const restoredText = getCellText(getAllRows(container)[0]!, 1)
      expect(restoredText).toBe(originalText)
    })

    it('Enter in edit mode confirms and moves down', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      const secondRowId = rows[1]!.getAttribute('data-node-id')
      focusRow(rows[0]!)
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{F2}')
      await user.keyboard('{Enter}')
      await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
      expect(getFocusedRowId(container)).toBe(secondRowId)
      expect(container.querySelector('[data-renaming]')).toBeNull()
    })

    it('Shift+Enter in edit mode confirms and moves up', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      const firstRowId = rows[0]!.getAttribute('data-node-id')
      focusRow(rows[1]!)
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{F2}')
      await user.keyboard('{Shift>}{Enter}{/Shift}')
      await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
      expect(getFocusedRowId(container)).toBe(firstRowId)
      expect(container.querySelector('[data-renaming]')).toBeNull()
    })

    it('Tab in edit mode confirms and moves to next cell in edit mode', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      focusRow(rows[0]!)
      await user.keyboard('{ArrowRight}') // ko column
      await user.keyboard('{F2}')
      expect(container.querySelector('[data-renaming]')).not.toBeNull()
      await user.keyboard('{Tab}')
      await act(async () => { await new Promise((r) => setTimeout(r, 20)) })
      // Should have moved to en column and auto-started rename (tabContinue)
      expect(container.querySelector('[data-renaming]')).not.toBeNull()
    })

    it('double-click on editable cell enters edit mode', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      focusRow(rows[0]!)
      await user.keyboard('{ArrowRight}') // activate ko column
      // Find the Editable span and double-click
      const editableWrapper = container.querySelector('[data-placeholder]')
      if (editableWrapper) {
        await user.dblClick(editableWrapper)
        expect(container.querySelector('[contenteditable]')).not.toBeNull()
      }
    })
  })

  // ── Cell clipboard ──

  describe('cell clipboard', () => {
    it('Delete clears cell value without removing row', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const initialCount = getRowCount(container)
      const rows = getAllRows(container)
      focusRow(rows[0]!)
      await user.keyboard('{ArrowRight}') // ko column
      await user.keyboard('{Delete}')
      expect(getRowCount(container)).toBe(initialCount)
      // Cell should show "—" (empty placeholder)
      const cell = getAllRows(container)[0]!.querySelectorAll('[role="gridcell"]')[1]
      expect(cell?.textContent).toBe('—')
    })

    it('Mod+C → ArrowDown → Mod+V pastes cell value', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      focusRow(rows[0]!)
      await user.keyboard('{ArrowRight}')
      const sourceText = getCellText(rows[0]!, 1)
      await user.keyboard('{Control>}c{/Control}')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Control>}v{/Control}')
      const targetText = getCellText(getAllRows(container)[1]!, 1)
      expect(targetText).toBe(sourceText)
    })

    it('Mod+X cuts cell value (copy + clear)', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      focusRow(rows[0]!)
      await user.keyboard('{ArrowRight}')
      const originalText = getCellText(rows[0]!, 1)
      expect(originalText).not.toBe('—')
      await user.keyboard('{Control>}x{/Control}')
      // Source cell cleared
      const clearedText = getCellText(getAllRows(container)[0]!, 1)
      expect(clearedText).toBe('—')
      // Paste to next row
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Control>}v{/Control}')
      const pastedText = getCellText(getAllRows(container)[1]!, 1)
      expect(pastedText).toBe(originalText)
    })

    it('Mod+Z undoes Delete', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      focusRow(rows[0]!)
      await user.keyboard('{ArrowRight}')
      const originalText = getCellText(rows[0]!, 1)
      await user.keyboard('{Delete}')
      expect(getCellText(getAllRows(container)[0]!, 1)).toBe('—')
      await user.keyboard('{Control>}z{/Control}')
      expect(getCellText(getAllRows(container)[0]!, 1)).toBe(originalText)
    })

    it('Mod+Z undoes Mod+X cut', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      focusRow(rows[0]!)
      await user.keyboard('{ArrowRight}')
      const originalText = getCellText(rows[0]!, 1)
      await user.keyboard('{Control>}x{/Control}')
      expect(getCellText(getAllRows(container)[0]!, 1)).toBe('—')
      await user.keyboard('{Control>}z{/Control}')
      expect(getCellText(getAllRows(container)[0]!, 1)).toBe(originalText)
    })

    it('Delete on already empty cell is no-op', async () => {
      const user = userEvent.setup()
      const { container } = render(<PageI18nEditor />)
      const rows = getAllRows(container)
      focusRow(rows[0]!)
      // Move to ja column (col 3) — likely empty for most entries
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
      const textBefore = getCellText(getAllRows(container)[0]!, 3)
      await user.keyboard('{Delete}')
      const textAfter = getCellText(getAllRows(container)[0]!, 3)
      expect(textAfter).toBe(textBefore)
    })
  })
})
