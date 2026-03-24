import { useState, useRef, useEffect } from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Grid } from '../interactive-os/ui/Grid'
import { Aria } from '../interactive-os/primitives/aria'
import { core, GRID_COL_ID } from '../interactive-os/plugins/core'
import { rename } from '../interactive-os/plugins/rename'
import { history } from '../interactive-os/plugins/history'
import { crud } from '../interactive-os/plugins/crud'
import { clipboard, resetClipboard } from '../interactive-os/plugins/clipboard'
import { dnd } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'
import { translatableEntriesToGrid, I18N_COLUMNS } from '../pages/cms/cmsI18nAdapter'
import { cmsStore } from '../pages/cms/cms-store'
import type { NormalizedData } from '../interactive-os/store/types'

const plugins = [core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

function I18nEditorFixture() {
  const gridData = translatableEntriesToGrid(cmsStore)
  const [data, setData] = useState<NormalizedData>(gridData)
  const dataRef = useRef(data)
  useEffect(() => { dataRef.current = data })

  const renderCell = (_props: React.HTMLAttributes<HTMLElement>, value: unknown, column: { key: string }) => {
    const text = String(value ?? '')
    const isKey = column.key === 'key'
    const colIdx = I18N_COLUMNS.findIndex(c => c.key === column.key)
    const focusedCol = (dataRef.current.entities[GRID_COL_ID]?.colIndex as number) ?? 0
    const isActiveCell = !isKey && colIdx === focusedCol

    if (isActiveCell) {
      return (
        <Aria.Editable field={`cells.${colIdx}`} allowEmpty enterContinue tabContinue>
          <span data-testid={`cell-${colIdx}`}>{text || '—'}</span>
        </Aria.Editable>
      )
    }

    return <span data-testid={isKey ? 'cell-key' : `cell-${colIdx}`}>{text || '—'}</span>
  }

  return (
    <Grid
      data={data}
      columns={I18N_COLUMNS}
      plugins={plugins}
      onChange={setData}
      enableEditing
      tabCycle
      renderCell={renderCell}
      aria-label="i18n Translation Editor"
      header
    />
  )
}

function getFocusedRowId(container: HTMLElement): string | null {
  const focused = container.querySelector('[role="row"][tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

function getRowCount(container: HTMLElement): number {
  return container.querySelectorAll('[role="row"]').length
}

describe('i18n Editor App', () => {
  beforeEach(() => resetClipboard())

  // V1: 2026-03-25-i18n-editor-app-prd.md
  it('renders Grid with CMS translatable fields', () => {
    const { container } = render(<I18nEditorFixture />)
    expect(container.querySelector('[role="grid"]')).not.toBeNull()
    // Columns: key + ko + en + ja = 4
    const headerCells = container.querySelectorAll('.grid-header-cell')
    expect(headerCells.length).toBe(4)
    // At least some rows from CMS data
    const rows = container.querySelectorAll('[role="row"]')
    expect(rows.length).toBeGreaterThan(5)
  })

  // V2: 2026-03-25-i18n-editor-app-prd.md
  it('Delete in cell mode clears cell value, not row', async () => {
    const user = userEvent.setup()
    const { container } = render(<I18nEditorFixture />)
    const rows = container.querySelectorAll('[role="row"]')
    const initialCount = rows.length
    const firstRow = rows[0] as HTMLElement
    act(() => firstRow.focus())
    // Move to column 1 (ko) since key column is col 0
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{Delete}')
    expect(getRowCount(container)).toBe(initialCount)
  })

  // V3: 2026-03-25-i18n-editor-app-prd.md
  it('Enter in cell mode moves to next row without entering edit', async () => {
    const user = userEvent.setup()
    const { container } = render(<I18nEditorFixture />)
    const rows = container.querySelectorAll('[role="row"]')
    const secondRowId = (rows[1] as HTMLElement).getAttribute('data-node-id')
    act(() => (rows[0] as HTMLElement).focus())
    await user.keyboard('{Enter}')
    expect(getFocusedRowId(container)).toBe(secondRowId)
    expect(container.querySelector('[data-renaming]')).toBeNull()
  })

  // V4: 2026-03-25-i18n-editor-app-prd.md
  it('F2 → edit → Enter confirms and moves down', async () => {
    const user = userEvent.setup()
    const { container } = render(<I18nEditorFixture />)
    const rows = container.querySelectorAll('[role="row"]')
    const secondRowId = (rows[1] as HTMLElement).getAttribute('data-node-id')
    act(() => (rows[0] as HTMLElement).focus())
    // Move to editable column (ko = col 1)
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{F2}')
    expect(container.querySelector('[data-renaming]')).not.toBeNull()
    await user.keyboard('{Enter}')
    await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
    expect(getFocusedRowId(container)).toBe(secondRowId)
    expect(container.querySelector('[data-renaming]')).toBeNull()
  })

  // V5: 2026-03-25-i18n-editor-app-prd.md
  it('Mod+C → ArrowDown → Mod+V pastes cell value', async () => {
    const user = userEvent.setup()
    const { container } = render(<I18nEditorFixture />)
    const rows = container.querySelectorAll('[role="row"]')
    act(() => (rows[0] as HTMLElement).focus())
    // Move to ko column
    await user.keyboard('{ArrowRight}')
    // Get original value
    const firstRowKo = (rows[0] as HTMLElement).querySelector('[data-testid="cell-1"]')?.textContent
    await user.keyboard('{Control>}c{/Control}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Control>}v{/Control}')
    // Second row ko should now have first row's value
    const updatedRows = container.querySelectorAll('[role="row"]')
    const secondRowKo = (updatedRows[1] as HTMLElement).querySelector('[data-testid="cell-1"]')?.textContent
    expect(secondRowKo).toBe(firstRowKo)
  })

  // V6: 2026-03-25-i18n-editor-app-prd.md
  it('Mod+Z undoes last edit', async () => {
    const user = userEvent.setup()
    const { container } = render(<I18nEditorFixture />)
    const rows = container.querySelectorAll('[role="row"]')
    act(() => (rows[0] as HTMLElement).focus())
    await user.keyboard('{ArrowRight}')
    const originalText = (rows[0] as HTMLElement).querySelector('[data-testid="cell-1"]')?.textContent
    await user.keyboard('{Delete}')
    // Value should be cleared
    const clearedText = (container.querySelectorAll('[role="row"]')[0] as HTMLElement).querySelector('[data-testid="cell-1"]')?.textContent
    expect(clearedText).not.toBe(originalText)
    // Undo
    await user.keyboard('{Control>}z{/Control}')
    const restoredText = (container.querySelectorAll('[role="row"]')[0] as HTMLElement).querySelector('[data-testid="cell-1"]')?.textContent
    expect(restoredText).toBe(originalText)
  })

  // V7: 2026-03-25-i18n-editor-app-prd.md
  it('key column is read-only — F2 does not enter edit mode', async () => {
    const user = userEvent.setup()
    const { container } = render(<I18nEditorFixture />)
    const rows = container.querySelectorAll('[role="row"]')
    act(() => (rows[0] as HTMLElement).focus())
    // Stay on key column (col 0)
    await user.keyboard('{F2}')
    // No editable should appear — key column has no Aria.Editable
    expect(container.querySelector('[contenteditable]')).toBeNull()
  })

  // V8: 2026-03-25-i18n-editor-app-prd.md
  it('Enter at last row does not move', async () => {
    const user = userEvent.setup()
    const { container } = render(<I18nEditorFixture />)
    const rows = container.querySelectorAll('[role="row"]')
    const lastRow = rows[rows.length - 1] as HTMLElement
    const lastRowId = lastRow.getAttribute('data-node-id')
    act(() => lastRow.focus())
    await user.keyboard('{Enter}')
    expect(getFocusedRowId(container)).toBe(lastRowId)
  })
})
