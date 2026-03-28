// V1: 2026-03-28-checked-axis-childrole-prd.md
/**
 * APG Conformance: Checkbox (Mixed-State)
 * https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/examples/checkbox-mixed/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { checkboxMixed } from '../pattern/examples/checkboxMixed'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { EXPANDED_ID } from '../axis/expand'

// ---------------------------------------------------------------------------
// Fixtures — parent "Condiments" with children (pre-expanded)
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  const store = createStore({
    entities: {
      condiments: { id: 'condiments', data: { name: 'All condiments' } },
      lettuce: { id: 'lettuce', data: { name: 'Lettuce' } },
      tomato: { id: 'tomato', data: { name: 'Tomato' } },
      mustard: { id: 'mustard', data: { name: 'Mustard' } },
    },
    relationships: {
      [ROOT_ID]: ['condiments'],
      condiments: ['lettuce', 'tomato', 'mustard'],
    },
  })
  // Pre-expand condiments so children are visible in Aria.Item renderer
  return {
    ...store,
    entities: {
      ...store.entities,
      [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: ['condiments'] },
    },
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderMixed(data: NormalizedData) {
  return render(
    <Aria behavior={checkboxMixed} data={data} plugins={[]}>
      <Aria.Item render={(props, item, state: NodeState) => (
        <span
          {...props}
          data-testid={`cb-${item.id}`}
          data-checked={state.checked}
        >
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )} />
    </Aria>,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getAriaChecked(container: HTMLElement, id: string): string | null {
  return getNode(container, id)?.getAttribute('aria-checked') ?? null
}

// ---------------------------------------------------------------------------
// 1. ARIA Structure
// ---------------------------------------------------------------------------

describe('APG Checkbox Mixed — ARIA Structure', () => {
  it('all items have role="checkbox"', () => {
    const { container } = renderMixed(fixtureData())
    const checkboxes = container.querySelectorAll('[role="checkbox"]')
    expect(checkboxes.length).toBe(4)
  })

  it('initial state: all unchecked', () => {
    const { container } = renderMixed(fixtureData())
    expect(getAriaChecked(container, 'condiments')).toBe('false')
    expect(getAriaChecked(container, 'lettuce')).toBe('false')
    expect(getAriaChecked(container, 'tomato')).toBe('false')
    expect(getAriaChecked(container, 'mustard')).toBe('false')
  })
})

// ---------------------------------------------------------------------------
// 2. Mixed state derivation
// ---------------------------------------------------------------------------

describe('APG Checkbox Mixed — Mixed State', () => {
  it('parent shows mixed when some children checked', async () => {
    const user = userEvent.setup()
    const { container } = renderMixed(fixtureData())

    getNode(container, 'lettuce')!.focus()
    await user.keyboard('{ }')

    expect(getAriaChecked(container, 'lettuce')).toBe('true')
    expect(getAriaChecked(container, 'tomato')).toBe('false')
    expect(getAriaChecked(container, 'condiments')).toBe('mixed')
  })

  it('parent shows true when all children checked', async () => {
    const user = userEvent.setup()
    const { container } = renderMixed(fixtureData())

    getNode(container, 'lettuce')!.focus()
    await user.keyboard('{ }')
    getNode(container, 'tomato')!.focus()
    await user.keyboard('{ }')
    getNode(container, 'mustard')!.focus()
    await user.keyboard('{ }')

    expect(getAriaChecked(container, 'condiments')).toBe('true')
  })

  it('parent shows false when no children checked', () => {
    const { container } = renderMixed(fixtureData())
    expect(getAriaChecked(container, 'condiments')).toBe('false')
  })
})
