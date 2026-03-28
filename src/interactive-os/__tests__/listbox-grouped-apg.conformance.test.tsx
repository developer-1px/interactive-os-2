// V1: 2026-03-28-checked-axis-childrole-prd.md
/**
 * APG Conformance: Listbox with Grouped Options
 * https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-grouped/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Aria } from '../primitives/aria'
import { listboxGrouped } from '../pattern/roles/listboxGrouped'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { EXPANDED_ID } from '../axis/expand'

// ---------------------------------------------------------------------------
// Fixtures — groups with options
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  const store = createStore({
    entities: {
      fruits: { id: 'fruits', data: { name: 'Fruits' } },
      apple: { id: 'apple', data: { name: 'Apple' } },
      banana: { id: 'banana', data: { name: 'Banana' } },
      vegs: { id: 'vegs', data: { name: 'Vegetables' } },
      carrot: { id: 'carrot', data: { name: 'Carrot' } },
      pea: { id: 'pea', data: { name: 'Pea' } },
    },
    relationships: {
      [ROOT_ID]: ['fruits', 'vegs'],
      fruits: ['apple', 'banana'],
      vegs: ['carrot', 'pea'],
    },
  })
  // Pre-expand groups so children are visible
  return {
    ...store,
    entities: {
      ...store.entities,
      [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: ['fruits', 'vegs'] },
    },
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderGrouped(data: NormalizedData) {
  return render(
    <Aria behavior={listboxGrouped} data={data} plugins={[]}>
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
// 1. ARIA Structure — heterogeneous childRole
// ---------------------------------------------------------------------------

describe('APG Listbox Grouped — ARIA Structure', () => {
  it('container has role="listbox"', () => {
    const { container } = renderGrouped(fixtureData())
    expect(container.querySelector('[role="listbox"]')).not.toBeNull()
  })

  it('group nodes have role="group"', () => {
    const { container } = renderGrouped(fixtureData())
    expect(getNode(container, 'fruits')?.getAttribute('role')).toBe('group')
    expect(getNode(container, 'vegs')?.getAttribute('role')).toBe('group')
  })

  it('leaf nodes have role="option"', () => {
    const { container } = renderGrouped(fixtureData())
    expect(getNode(container, 'apple')?.getAttribute('role')).toBe('option')
    expect(getNode(container, 'banana')?.getAttribute('role')).toBe('option')
    expect(getNode(container, 'carrot')?.getAttribute('role')).toBe('option')
    expect(getNode(container, 'pea')?.getAttribute('role')).toBe('option')
  })
})
