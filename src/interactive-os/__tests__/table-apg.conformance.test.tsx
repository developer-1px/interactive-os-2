// V1: 2026-03-28-checked-axis-childrole-prd.md
/**
 * APG Conformance: Table
 * https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/table/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Aria } from '../primitives/aria'
import { table } from '../pattern/roles/table'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { EXPANDED_ID } from '../axis/expand'

// ---------------------------------------------------------------------------
// Fixtures — rowgroup > row > cell
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  const store = createStore({
    entities: {
      tbody: { id: 'tbody', data: { name: 'Body' } },
      row1: { id: 'row1', data: { name: 'Row 1' } },
      cell1a: { id: 'cell1a', data: { name: 'A1' } },
      cell1b: { id: 'cell1b', data: { name: 'B1' } },
      row2: { id: 'row2', data: { name: 'Row 2' } },
      cell2a: { id: 'cell2a', data: { name: 'A2' } },
      cell2b: { id: 'cell2b', data: { name: 'B2' } },
    },
    relationships: {
      [ROOT_ID]: ['tbody'],
      tbody: ['row1', 'row2'],
      row1: ['cell1a', 'cell1b'],
      row2: ['cell2a', 'cell2b'],
    },
  })
  // Pre-expand all levels so children are visible
  return {
    ...store,
    entities: {
      ...store.entities,
      [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: ['tbody', 'row1', 'row2'] },
    },
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderTable(data: NormalizedData) {
  return render(
    <Aria pattern={table} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <span {...props} data-testid={`item-${item.id}`}>
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )} />
    </Aria>,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

// ---------------------------------------------------------------------------
// 1. ARIA Structure — 3-level heterogeneous childRole
// ---------------------------------------------------------------------------

describe('APG Table — ARIA Structure', () => {
  it('container has role="table"', () => {
    const { container } = renderTable(fixtureData())
    expect(container.querySelector('[role="table"]')).not.toBeNull()
  })

  it('level 1 nodes have role="rowgroup"', () => {
    const { container } = renderTable(fixtureData())
    expect(getNode(container, 'tbody')?.getAttribute('role')).toBe('rowgroup')
  })

  it('level 2 nodes have role="row"', () => {
    const { container } = renderTable(fixtureData())
    expect(getNode(container, 'row1')?.getAttribute('role')).toBe('row')
    expect(getNode(container, 'row2')?.getAttribute('role')).toBe('row')
  })

  it('level 3 nodes have role="cell"', () => {
    const { container } = renderTable(fixtureData())
    expect(getNode(container, 'cell1a')?.getAttribute('role')).toBe('cell')
    expect(getNode(container, 'cell1b')?.getAttribute('role')).toBe('cell')
    expect(getNode(container, 'cell2a')?.getAttribute('role')).toBe('cell')
    expect(getNode(container, 'cell2b')?.getAttribute('role')).toBe('cell')
  })
})
