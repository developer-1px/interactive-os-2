/**
 * Integration test: CMS i18n Grid boundary cases
 *
 * V7: empty cell (ja) allows F2 rename entry
 * V8: Key column (col 0) F2 does not enter rename
 * V10: boundary navigation — first row/first col, ArrowUp + ArrowLeft do nothing
 */
import { useState, useRef, useEffect } from 'react'
import { describe, it, expect } from 'vitest'
import { render, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Grid } from '../interactive-os/ui/Grid'
import { Aria } from '../interactive-os/components/aria'
import { core, GRID_COL_ID } from '../interactive-os/plugins/core'
import { rename } from '../interactive-os/plugins/rename'
import { history } from '../interactive-os/plugins/history'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'
import { translatableEntriesToGrid, I18N_COLUMNS } from '../pages/cms/cmsI18nAdapter'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID, type NormalizedData } from '../interactive-os/core/types'

// Single CMS entity: text with ja empty
function cmsFixture(): NormalizedData {
  return createStore({
    entities: {
      'hero-title': {
        id: 'hero-title',
        data: {
          type: 'text',
          role: 'heading',
          value: { ko: '제목', en: 'Title', ja: '' },
        },
      },
    },
    relationships: {
      [ROOT_ID]: ['hero-title'],
    },
  })
}

const plugins = [core(), rename(), history(), focusRecovery()]

/**
 * Renders a single Aria.Editable per row (the focused column only)
 * to avoid focus-competition between multiple editables.
 * This mirrors the production pattern from grid-keyboard tests.
 */
function StatefulI18nGrid() {
  const [data, setData] = useState(() => translatableEntriesToGrid(cmsFixture()))
  const dataRef = useRef(data)
  useEffect(() => { dataRef.current = data })

  return (
    <Grid
      data={data}
      columns={I18N_COLUMNS}
      plugins={plugins}
      enableEditing
      onChange={setData}
      aria-label="i18n Translation Sheet"
      renderCell={(_props, value, col, state) => {
        const isLocale = col.key === 'ko' || col.key === 'en' || col.key === 'ja'
        // Only the focused column gets Aria.Editable to avoid multi-editable focus race
        const focusedCol = (dataRef.current.entities[GRID_COL_ID]?.colIndex as number) ?? 0
        const colIdx = I18N_COLUMNS.indexOf(col)
        if (isLocale && state.focused && colIdx === focusedCol) {
          return (
            <Aria.Editable field="cells" placeholder="—">
              <span>{String(value ?? '')}</span>
            </Aria.Editable>
          )
        }
        return <span>{String(value ?? '')}</span>
      }}
    />
  )
}

function getFocusedRowId(container: HTMLElement): string | null {
  const focused = container.querySelector('[role="row"][tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

function getFocusedColIndex(container: HTMLElement): number {
  const focusedRow = container.querySelector('[role="row"][tabindex="0"]')
  if (!focusedRow) return -1
  const focusedCell = focusedRow.querySelector('[role="gridcell"][tabindex="0"]')
  if (!focusedCell) return -1
  const colIndex = focusedCell.getAttribute('aria-colindex')
  return colIndex ? parseInt(colIndex, 10) : -1
}

describe('CMS i18n Grid boundary cases', () => {
  describe('V7: empty cell (ja) allows F2 rename', () => {
    it('F2 on ja column (empty) enters rename mode with contenteditable', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulI18nGrid />)

      // Grid has one row from the fixture
      const rows = container.querySelectorAll('[role="row"]')
      expect(rows.length).toBe(1)

      // Focus the row
      const row = rows[0] as HTMLElement
      act(() => { row.focus() })

      // Navigate to last column (ja = col 3, aria-colindex=4)
      // I18N_COLUMNS: key(0), ko(1), en(2), ja(3) — 4 columns
      await user.keyboard('{End}')
      expect(getFocusedColIndex(container)).toBe(4) // aria-colindex is 1-based

      // Press F2 to enter rename mode — use fireEvent to avoid timing issues
      act(() => { fireEvent.keyDown(row, { key: 'F2' }) })

      // contenteditable should appear even for empty cell
      const editable = container.querySelector('[contenteditable]')
      expect(editable).not.toBeNull()
    })
  })

  describe('V8: Key column F2 does not enter rename', () => {
    it('F2 on Key column (col 0) does not produce contenteditable', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulI18nGrid />)

      const row = container.querySelector('[role="row"]') as HTMLElement
      act(() => { row.focus() })

      // Navigate to first column (Key)
      await user.keyboard('{Home}')
      expect(getFocusedColIndex(container)).toBe(1) // aria-colindex 1 = Key column

      // Press F2 — Key column has no Aria.Editable, so rename should not activate
      act(() => { fireEvent.keyDown(row, { key: 'F2' }) })

      const editable = container.querySelector('[contenteditable]')
      expect(editable).toBeNull()
    })
  })

  describe('V10: boundary navigation', () => {
    it('ArrowUp on first row stays on first row', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulI18nGrid />)

      const row = container.querySelector('[role="row"]') as HTMLElement
      act(() => { row.focus() })

      const rowIdBefore = getFocusedRowId(container)
      await user.keyboard('{ArrowUp}')

      expect(getFocusedRowId(container)).toBe(rowIdBefore)
    })

    it('ArrowLeft on first column stays on first column', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulI18nGrid />)

      const row = container.querySelector('[role="row"]') as HTMLElement
      act(() => { row.focus() })

      // Ensure we start at col 1 (first column, aria-colindex=1)
      await user.keyboard('{Home}')
      expect(getFocusedColIndex(container)).toBe(1)

      // ArrowLeft should not move past col 1
      await user.keyboard('{ArrowLeft}')
      expect(getFocusedColIndex(container)).toBe(1)
    })

    it('ArrowUp + ArrowLeft at origin (0,0) do nothing', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulI18nGrid />)

      const row = container.querySelector('[role="row"]') as HTMLElement
      act(() => { row.focus() })
      await user.keyboard('{Home}')

      const rowId = getFocusedRowId(container)
      const colIdx = getFocusedColIndex(container)

      // Both boundary keys
      await user.keyboard('{ArrowUp}')
      await user.keyboard('{ArrowLeft}')

      expect(getFocusedRowId(container)).toBe(rowId)
      expect(getFocusedColIndex(container)).toBe(colIdx)
    })
  })
})
