/**
 * Integration test: Grid keyboard interactions
 *
 * Tests 2D navigation with ArrowDown/Up (rows) and ArrowRight/Left (columns).
 * No engine.dispatch() calls — only userEvent keyboard simulation.
 */
import { useState } from 'react'
import { describe, it, expect } from 'vitest'
import { render, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../components/aria'
import { Grid } from '../ui/Grid'
import { grid } from '../behaviors/grid'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { core } from '../plugins/core'
import { crud } from '../plugins/crud'
import { rename } from '../plugins/rename'
import { dnd } from '../plugins/dnd'
import { history } from '../plugins/history'
import { focusRecovery } from '../plugins/focusRecovery'
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
const plugins = [core()]

function renderGrid(data: NormalizedData) {
  return render(
    <Aria behavior={behavior} data={data} plugins={plugins} aria-label="Employees">
      <Aria.Item
        render={(node: Record<string, unknown>, state: NodeState) => {
          const cells = (node.data as Record<string, unknown>)?.cells as string[]
          return (
            <div style={{ display: 'flex' }} data-testid={`row-${node.id}`} data-focused={state.focused} data-selected={state.selected}>
              {cells.map((cell, i) => (
                <Aria.Cell key={i} index={i}>
                  <span data-testid={`cell-${node.id}-${i}`}>{cell}</span>
                </Aria.Cell>
              ))}
            </div>
          )
        }}
      />
    </Aria>
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

describe('Grid keyboard integration', () => {
  describe('row navigation', () => {
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

    it('Mod+Home moves to first row', async () => {
      const user = userEvent.setup()
      const { container } = renderGrid(fixtureData())

      getRowElement(container, 'row-3')!.focus()
      await user.keyboard('{Control>}{Home}{/Control}')

      expect(getFocusedRowId(container)).toBe('row-1')
    })

    it('Mod+End moves to last row', async () => {
      const user = userEvent.setup()
      const { container } = renderGrid(fixtureData())

      getRowElement(container, 'row-1')!.focus()
      await user.keyboard('{Control>}{End}{/Control}')

      expect(getFocusedRowId(container)).toBe('row-3')
    })
  })

  describe('column navigation', () => {
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

    it('Home moves to first column in row', async () => {
      const user = userEvent.setup()
      const { container } = renderGrid(fixtureData())

      getRowElement(container, 'row-1')!.focus()
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{ArrowRight}')
      expect(getFocusedCellColIndex(container)).toBe(2)

      await user.keyboard('{Home}')
      expect(getFocusedCellColIndex(container)).toBe(0)
    })

    it('End moves to last column in row', async () => {
      const user = userEvent.setup()
      const { container } = renderGrid(fixtureData())

      getRowElement(container, 'row-1')!.focus()
      expect(getFocusedCellColIndex(container)).toBe(0)

      await user.keyboard('{End}')
      expect(getFocusedCellColIndex(container)).toBe(2)
    })
  })

  describe('selection', () => {
    it('Space toggles selection on focused row', async () => {
      const user = userEvent.setup()
      const { container } = renderGrid(fixtureData())

      getRowElement(container, 'row-1')!.focus()
      await user.keyboard('{ }')

      const testRow = container.querySelector('[data-testid="row-row-1"]')
      expect(testRow?.getAttribute('data-selected')).toBe('true')
    })
  })

  describe('ARIA roles and attributes', () => {
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

    it('cells have aria-colindex', () => {
      const { container } = renderGrid(fixtureData())
      const cells = container.querySelectorAll('[role="gridcell"]')
      const colIndices = Array.from(cells).map((c) => c.getAttribute('aria-colindex'))
      // 3 rows × [1, 2, 3]
      expect(colIndices).toEqual(['1', '2', '3', '1', '2', '3', '1', '2', '3'])
    })

    it('rows have aria-rowindex', () => {
      const { container } = renderGrid(fixtureData())
      const rows = container.querySelectorAll('[role="row"]')
      const rowIndices = Array.from(rows).map((r) => r.getAttribute('aria-rowindex'))
      expect(rowIndices).toEqual(['1', '2', '3'])
    })
  })
})

// --- enableEditing tests via Grid component ---

const editingPlugins = [core(), crud(), rename(), dnd(), history(), focusRecovery()]
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
      renderCell={(value, col, _state) => {
        // Only the 'name' column is editable — multiple Aria.Editable per row
        // would compete for focus in rename mode (each useEffect calls el.focus())
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

describe('Grid enableEditing integration', () => {
  it('F2 enters rename mode on focused row', () => {
    const { container } = render(<StatefulEditableGrid />)
    const firstRow = getRowElement(container, 'row-1')!

    act(() => { firstRow.focus() })
    act(() => { fireEvent.keyDown(firstRow, { key: 'F2' }) })

    expect(container.querySelector('[contenteditable]')).not.toBeNull()
  })

  it('Delete removes focused row', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulEditableGrid />)

    const firstRow = getRowElement(container, 'row-1')!
    act(() => { firstRow.focus() })
    await user.keyboard('{Delete}')

    const rows = container.querySelectorAll('[role="row"]')
    expect(rows.length).toBe(2)
    expect(getRowElement(container, 'row-1')).toBeNull()
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

  it('boundary: first row ArrowUp does nothing', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulEditableGrid />)

    const firstRow = getRowElement(container, 'row-1')!
    act(() => { firstRow.focus() })
    expect(getFocusedRowId(container)).toBe('row-1')

    await user.keyboard('{ArrowUp}')

    expect(getFocusedRowId(container)).toBe('row-1')
  })

  it('boundary: last col ArrowRight does nothing', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulEditableGrid />)

    const firstRow = getRowElement(container, 'row-1')!
    act(() => { firstRow.focus() })

    // Move to last column
    await user.keyboard('{End}')
    expect(getFocusedCellColIndex(container)).toBe(2)

    // ArrowRight at last column should stay
    await user.keyboard('{ArrowRight}')
    expect(getFocusedCellColIndex(container)).toBe(2)
  })
})
