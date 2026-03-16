/**
 * Integration test: Grid keyboard interactions
 *
 * Tests 2D navigation with ArrowDown/Up (rows) and ArrowRight/Left (columns).
 * No engine.dispatch() calls — only userEvent keyboard simulation.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../components/aria'
import { grid } from '../behaviors/grid'
import { createStore } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { core } from '../plugins/core'
import React from 'react'

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
      <Aria.Node
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
