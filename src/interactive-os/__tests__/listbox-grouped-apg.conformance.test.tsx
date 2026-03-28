// V1: 2026-03-28-checked-axis-childrole-prd.md
/**
 * APG Conformance: Listbox with Grouped Options
 * https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-grouped/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Aria } from '../primitives/aria'
import { listboxGrouped } from '../pattern/roles/listboxGrouped'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'

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
  return store
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderGrouped(data: NormalizedData) {
  return render(
    <Aria pattern={listboxGrouped} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <span {...props} data-testid={`item-${item.id}`}>
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )} />
    </Aria>,
  )
}

// V1: 2026-03-28-aria-item-children-prd.md — APG-compliant render with children
function renderGroupedApg(data: NormalizedData) {
  return render(
    <Aria pattern={listboxGrouped} data={data} plugins={[]} aria-label="Test">
      <Aria.Item render={(props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, _state: NodeState, children?: ReactNode) => {
        const name = (item.data as Record<string, unknown>)?.name as string
        if (children) {
          const labelId = `group-label-${item.id}`
          return (
            <ul {...props} aria-labelledby={labelId}>
              <li role="presentation" id={labelId}>{name}</li>
              {children}
            </ul>
          )
        }
        return <li {...props}>{name}</li>
      }} />
    </Aria>,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

// ---------------------------------------------------------------------------
// 1. ARIA Structure — heterogeneous childRole (3-arg backward compat)
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

// ---------------------------------------------------------------------------
// 2. APG DOM Structure — 4-arg render with children (PRD V1, V4, V5, V6)
// ---------------------------------------------------------------------------

describe('APG Listbox Grouped — children render', () => {
  // V1: 2026-03-28-aria-item-children-prd.md
  it('container nodes pass children to render callback, producing ul[role="group"] > li structure', () => {
    const { container } = renderGroupedApg(fixtureData())
    const groups = container.querySelectorAll('ul[role="group"]')
    expect(groups.length).toBe(2)

    // First group: Fruits with apple + banana
    const fruitsGroup = groups[0]!
    expect(fruitsGroup.getAttribute('aria-labelledby')).toBe('group-label-fruits')
    const fruitsLabel = fruitsGroup.querySelector('[role="presentation"]')
    expect(fruitsLabel?.textContent).toBe('Fruits')
    expect(fruitsLabel?.id).toBe('group-label-fruits')

    const fruitsOptions = fruitsGroup.querySelectorAll('[role="option"]')
    expect(fruitsOptions.length).toBe(2)
    expect(fruitsOptions[0]?.textContent).toBe('Apple')
    expect(fruitsOptions[1]?.textContent).toBe('Banana')
  })

  // V3: 2026-03-28-aria-item-children-prd.md — backward compat
  it('3-arg render callback still works (flat rendering)', () => {
    const { container } = renderGrouped(fixtureData())
    // No ul wrappers — flat spans
    expect(container.querySelectorAll('ul[role="group"]').length).toBe(0)
    expect(getNode(container, 'apple')).not.toBeNull()
  })
})
