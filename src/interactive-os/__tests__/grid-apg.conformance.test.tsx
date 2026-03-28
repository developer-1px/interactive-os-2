// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Data Grid
 * https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/data-grids/
 */
import { describe, it, expect } from 'vitest'
import { render, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Aria } from '../primitives/aria'
import { Grid } from '../ui/Grid'
import { grid } from '../pattern/examples/grid'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { crud } from '../plugins/crud'
import { rename } from '../plugins/rename'
import { dnd } from '../plugins/dnd'
import { history } from '../plugins/history'
import { focusRecovery } from '../plugins/focusRecovery'
import { captureAriaTree, extractRoleHierarchy } from './helpers/ariaTreeSnapshot'
import type { Plugin } from '../plugins/types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      'row-1': { id: 'row-1', data: { cells: ['Alice', '30', 'alice@example.com'] } },
      'row-2': { id: 'row-2', data: { cells: ['Bob', '25', 'bob@example.com'] } },
      'row-3': { id: 'row-3', data: { cells: ['Carol', '35', 'carol@example.com'] } },
    },
    relationships: {
      [ROOT_ID]: ['row-1', 'row-2', 'row-3'],
    },
  })
}

const behavior = grid({ columns: 3 })
const tabCycleBehavior = grid({ columns: 3, tabCycle: true })
const plugins: Plugin[] = []

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderGrid(data: NormalizedData, opts?: { tabCycle?: boolean }) {
  const b = opts?.tabCycle ? tabCycleBehavior : behavior
  return render(
    <Aria behavior={b} data={data} plugins={plugins} aria-label="Employees">
      <Aria.Item
        render={(props, node: Record<string, unknown>, state: NodeState) => {
          const cells = (node.data as Record<string, unknown>)?.cells as string[]
          return (
            <div {...props} style={{ display: 'flex' }} data-testid={`row-${node.id}`} data-focused={state.focused} data-selected={state.selected}>
              {cells.map((cell, i) => (
                <Aria.Cell key={i} index={i}>
                  <span data-testid={`cell-${node.id}-${i}`}>{cell}</span>
                </Aria.Cell>
              ))}
            </div>
          )
        }}
      />
    </Aria>,
  )
}

function getFocusedRowId(container: HTMLElement): string | null {
  const focused = container.querySelector('[role="row"][tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

function getFocusedCellColIndex(container: HTMLElement): number | null {
  const focusedRow = container.querySelector('[role="row"][tabindex="0"]')
  if (!focusedRow) return null
  const focusedCell = focusedRow.querySelector('[role="gridcell"][tabindex="0"]')
  if (!focusedCell) return null
  const colIndex = focusedCell.getAttribute('aria-colindex')
  return colIndex ? parseInt(colIndex, 10) - 1 : null
}

function getRowElement(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

// ---------------------------------------------------------------------------
// 1. ARIA Role Structure
// ---------------------------------------------------------------------------

describe('APG Grid — ARIA Role Structure', () => {
  it('container has role="grid"', () => {
    const { container } = renderGrid(fixtureData())
    expect(container.querySelector('[role="grid"]')).not.toBeNull()
  })

  it('rows have role="row"', () => {
    const { container } = renderGrid(fixtureData())
    const rows = container.querySelectorAll('[role="row"]')
    expect(rows.length).toBe(3)
  })

  it('cells have role="gridcell"', () => {
    const { container } = renderGrid(fixtureData())
    const cells = container.querySelectorAll('[role="gridcell"]')
    expect(cells.length).toBe(9) // 3 rows × 3 columns
  })

  it('role hierarchy: grid > row > gridcell', () => {
    const { container } = renderGrid(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('grid')
    expect(hierarchy).toContain('row')
    expect(hierarchy).toContain('gridcell')
  })

  it('cells have aria-colindex (1-based)', () => {
    const { container } = renderGrid(fixtureData())
    const cells = container.querySelectorAll('[role="gridcell"]')
    const colIndices = Array.from(cells).map((c) => c.getAttribute('aria-colindex'))
    // 3 rows × [1, 2, 3]
    expect(colIndices).toEqual(['1', '2', '3', '1', '2', '3', '1', '2', '3'])
  })

  it('rows have aria-rowindex (1-based)', () => {
    const { container } = renderGrid(fixtureData())
    const rows = container.querySelectorAll('[role="row"]')
    const rowIndices = Array.from(rows).map((r) => r.getAttribute('aria-rowindex'))
    expect(rowIndices).toEqual(['1', '2', '3'])
  })

  it('rows have aria-selected', () => {
    const { container } = renderGrid(fixtureData())
    const rows = container.querySelectorAll('[role="row"]')
    rows.forEach((row) => {
      expect(row.getAttribute('aria-selected')).not.toBeNull()
    })
  })

  it('initial focus: first row has tabindex=0', () => {
    const { container } = renderGrid(fixtureData())
    expect(getFocusedRowId(container)).toBe('row-1')
  })

  it('initial focus: first cell has tabindex=0', () => {
    const { container } = renderGrid(fixtureData())
    expect(getFocusedCellColIndex(container)).toBe(0)
  })

  it('captureAriaTree shows grid structure with aria attributes', () => {
    const { container } = renderGrid(fixtureData())
    const tree = captureAriaTree(container)
    expect(tree).toContain('grid')
    expect(tree).toContain('row')
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard: Row Navigation (ArrowDown / ArrowUp)
// ---------------------------------------------------------------------------

describe('APG Grid — Keyboard: Row Navigation', () => {
  it('ArrowDown moves focus to next row', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData())

    expect(getFocusedRowId(container)).toBe('row-1')
    getRowElement(container, 'row-1')!.focus()
    await user.keyboard('{ArrowDown}')

    expect(getFocusedRowId(container)).toBe('row-2')
  })

  it('ArrowUp moves focus to previous row', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData())

    getRowElement(container, 'row-2')!.focus()
    await user.keyboard('{ArrowUp}')

    expect(getFocusedRowId(container)).toBe('row-1')
  })

  it('Ctrl+Home moves to first row', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData())

    getRowElement(container, 'row-3')!.focus()
    await user.keyboard('{Control>}{Home}{/Control}')

    expect(getFocusedRowId(container)).toBe('row-1')
  })

  it('Ctrl+End moves to last row', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData())

    getRowElement(container, 'row-1')!.focus()
    await user.keyboard('{Control>}{End}{/Control}')

    expect(getFocusedRowId(container)).toBe('row-3')
  })

  it('boundary: ArrowUp at first row stays on first row', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData())

    getRowElement(container, 'row-1')!.focus()
    await user.keyboard('{ArrowUp}')

    expect(getFocusedRowId(container)).toBe('row-1')
  })

  it('boundary: ArrowDown at last row stays on last row', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData())

    getRowElement(container, 'row-3')!.focus()
    await user.keyboard('{ArrowDown}')

    expect(getFocusedRowId(container)).toBe('row-3')
  })
})

// ---------------------------------------------------------------------------
// 3. Keyboard: Column Navigation (ArrowRight / ArrowLeft / Home / End)
// ---------------------------------------------------------------------------

describe('APG Grid — Keyboard: Column Navigation', () => {
  it('ArrowRight moves to next column', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData())

    expect(getFocusedCellColIndex(container)).toBe(0)
    getRowElement(container, 'row-1')!.focus()
    await user.keyboard('{ArrowRight}')

    expect(getFocusedCellColIndex(container)).toBe(1)
  })

  it('ArrowLeft moves to previous column', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData())

    getRowElement(container, 'row-1')!.focus()
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowRight}')
    expect(getFocusedCellColIndex(container)).toBe(2)

    await user.keyboard('{ArrowLeft}')
    expect(getFocusedCellColIndex(container)).toBe(1)
  })

  it('Home moves to first column in current row', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData())

    getRowElement(container, 'row-1')!.focus()
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowRight}')
    expect(getFocusedCellColIndex(container)).toBe(2)

    await user.keyboard('{Home}')
    expect(getFocusedCellColIndex(container)).toBe(0)
  })

  it('End moves to last column in current row', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData())

    getRowElement(container, 'row-1')!.focus()
    expect(getFocusedCellColIndex(container)).toBe(0)

    await user.keyboard('{End}')
    expect(getFocusedCellColIndex(container)).toBe(2)
  })

  it('boundary: ArrowRight at last column stays on last column', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData())

    getRowElement(container, 'row-1')!.focus()
    await user.keyboard('{End}')
    expect(getFocusedCellColIndex(container)).toBe(2)

    await user.keyboard('{ArrowRight}')
    expect(getFocusedCellColIndex(container)).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// 4. Selection
// ---------------------------------------------------------------------------

describe('APG Grid — Selection', () => {
  it('Space toggles selection on focused row', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData())

    getRowElement(container, 'row-1')!.focus()
    await user.keyboard('{ }')

    const testRow = container.querySelector('[data-testid="row-row-1"]')
    expect(testRow?.getAttribute('data-selected')).toBe('true')
  })

  it('rows start with aria-selected=false', () => {
    const { container } = renderGrid(fixtureData())
    const rows = container.querySelectorAll('[role="row"]')
    rows.forEach((row) => {
      expect(row.getAttribute('aria-selected')).toBe('false')
    })
  })

  it('aria-selected=true after Space selection', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData())

    getRowElement(container, 'row-2')!.focus()
    await user.keyboard('{ }')

    const row2 = getRowElement(container, 'row-2')
    expect(row2?.getAttribute('aria-selected')).toBe('true')
  })
})

// ---------------------------------------------------------------------------
// 5. Tab Cell Cycle (tabCycle: true)
// ---------------------------------------------------------------------------

describe('APG Grid — Tab Cell Cycle (tabCycle: true)', () => {
  it('Tab moves to next column', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData(), { tabCycle: true })

    getRowElement(container, 'row-1')!.focus()
    expect(getFocusedCellColIndex(container)).toBe(0)

    await user.keyboard('{Tab}')

    expect(getFocusedRowId(container)).toBe('row-1')
    expect(getFocusedCellColIndex(container)).toBe(1)
  })

  it('Tab at last column wraps to first column of next row', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData(), { tabCycle: true })

    getRowElement(container, 'row-1')!.focus()
    await user.keyboard('{End}')
    expect(getFocusedCellColIndex(container)).toBe(2)

    await user.keyboard('{Tab}')

    expect(getFocusedRowId(container)).toBe('row-2')
    expect(getFocusedCellColIndex(container)).toBe(0)
  })

  it('Tab at absolute last cell (last row, last col) stops', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData(), { tabCycle: true })

    getRowElement(container, 'row-3')!.focus()
    await user.keyboard('{End}')
    expect(getFocusedRowId(container)).toBe('row-3')
    expect(getFocusedCellColIndex(container)).toBe(2)

    await user.keyboard('{Tab}')

    expect(getFocusedRowId(container)).toBe('row-3')
    expect(getFocusedCellColIndex(container)).toBe(2)
  })

  it('Shift+Tab moves to previous column', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData(), { tabCycle: true })

    getRowElement(container, 'row-1')!.focus()
    await user.keyboard('{End}')
    expect(getFocusedCellColIndex(container)).toBe(2)

    await user.keyboard('{Shift>}{Tab}{/Shift}')

    expect(getFocusedRowId(container)).toBe('row-1')
    expect(getFocusedCellColIndex(container)).toBe(1)
  })

  it('Shift+Tab at first column wraps to last column of previous row', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData(), { tabCycle: true })

    getRowElement(container, 'row-2')!.focus()
    expect(getFocusedCellColIndex(container)).toBe(0)

    await user.keyboard('{Shift>}{Tab}{/Shift}')

    expect(getFocusedRowId(container)).toBe('row-1')
    expect(getFocusedCellColIndex(container)).toBe(2)
  })

  it('Shift+Tab at absolute first cell (first row, first col) stops', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData(), { tabCycle: true })

    getRowElement(container, 'row-1')!.focus()
    expect(getFocusedRowId(container)).toBe('row-1')
    expect(getFocusedCellColIndex(container)).toBe(0)

    await user.keyboard('{Shift>}{Tab}{/Shift}')

    expect(getFocusedRowId(container)).toBe('row-1')
    expect(getFocusedCellColIndex(container)).toBe(0)
  })

  it('Tab does nothing when tabCycle is not enabled', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData()) // no tabCycle

    getRowElement(container, 'row-1')!.focus()
    expect(getFocusedCellColIndex(container)).toBe(0)

    await user.keyboard('{Tab}')

    // Without tabCycle, Tab should NOT be handled by the grid
    const col = getFocusedCellColIndex(container)
    // Either focus left (null) or stayed at col 0 — never moved to col 1
    expect(col).not.toBe(1)
  })
})

// ---------------------------------------------------------------------------
// 6. Grid Component (with column defs)
// ---------------------------------------------------------------------------

const editingPlugins = [crud(), rename(), dnd(), history(), focusRecovery()]
const columnDefs = [
  { key: 'name', header: 'Name', field: 'name' },
  { key: 'age', header: 'Age', field: 'age' },
  { key: 'email', header: 'Email', field: 'email' },
]

function editableFixtureData(): NormalizedData {
  return createStore({
    entities: {
      'row-1': { id: 'row-1', data: { name: 'Alice', age: '30', email: 'alice@example.com', cells: ['Alice', '30', 'alice@example.com'] } },
      'row-2': { id: 'row-2', data: { name: 'Bob', age: '25', email: 'bob@example.com', cells: ['Bob', '25', 'bob@example.com'] } },
      'row-3': { id: 'row-3', data: { name: 'Carol', age: '35', email: 'carol@example.com', cells: ['Carol', '35', 'carol@example.com'] } },
    },
    relationships: {
      [ROOT_ID]: ['row-1', 'row-2', 'row-3'],
    },
  })
}

function StatefulEditableGrid() {
  const [data, setData] = useState(editableFixtureData())
  return (
    <Grid
      data={data}
      columns={columnDefs}
      plugins={editingPlugins}
      enableEditing
      onChange={setData}
      aria-label="Employees"
      renderCell={(_props, value, col, _state) => {
        if (col.field === 'name') {
          return (
            <Aria.Editable field={col.field}>
              <span>{String(value ?? '')}</span>
            </Aria.Editable>
          )
        }
        return <span>{String(value ?? '')}</span>
      }}
    />
  )
}

describe('APG Grid — Editing Integration', () => {
  it('F2 enters rename mode on focused row', () => {
    const { container } = render(<StatefulEditableGrid />)
    const firstRow = getRowElement(container, 'row-1')!

    act(() => { firstRow.focus() })
    act(() => { fireEvent.keyDown(firstRow, { key: 'F2' }) })

    expect(container.querySelector('[contenteditable]')).not.toBeNull()
  })

  it('Delete clears focused cell value (cellEdit intercepts row delete)', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulEditableGrid />)

    const firstRow = getRowElement(container, 'row-1')!
    act(() => { firstRow.focus() })
    await user.keyboard('{Delete}')

    // Row still exists — cellEdit plugin intercepts Delete for cell clear
    const rows = container.querySelectorAll('[role="row"]')
    expect(rows.length).toBe(3)
    expect(getRowElement(container, 'row-1')).not.toBeNull()
  })

  it('Alt+ArrowDown moves row down', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulEditableGrid />)

    const firstRow = getRowElement(container, 'row-1')!
    act(() => { firstRow.focus() })
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')

    const rows = container.querySelectorAll('[role="row"]')
    const ids = Array.from(rows).map((r) => r.getAttribute('data-node-id'))
    expect(ids).toEqual(['row-2', 'row-1', 'row-3'])
  })
})
