// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Checkbox (Two State)
 * https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/examples/checkbox/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { checkbox } from '../pattern/roles/checkbox'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { extractRoleHierarchy } from './helpers/ariaTreeSnapshot'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      lettuce:  { id: 'lettuce',  data: { name: 'Lettuce'  } },
      tomato:   { id: 'tomato',   data: { name: 'Tomato'   } },
      mustard:  { id: 'mustard',  data: { name: 'Mustard'  } },
    },
    relationships: {
      [ROOT_ID]: ['lettuce', 'tomato', 'mustard'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderCheckbox(data: NormalizedData) {
  return render(
    <Aria pattern={checkbox} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <span {...props} data-testid={`cb-${item.id}`}>
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )} />
    </Aria>,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function isChecked(container: HTMLElement, id: string): boolean {
  return getNode(container, id)?.getAttribute('aria-checked') === 'true'
}

// ---------------------------------------------------------------------------
// 1. ARIA Structure
// ---------------------------------------------------------------------------

describe('APG Checkbox — ARIA Structure', () => {
  it('role hierarchy: group > checkbox', () => {
    const { container } = renderCheckbox(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('group')
    expect(hierarchy).toContain('checkbox')
  })

  it('all checkboxes have aria-checked=false initially', () => {
    const { container } = renderCheckbox(fixtureData())
    expect(isChecked(container, 'lettuce')).toBe(false)
    expect(isChecked(container, 'tomato')).toBe(false)
    expect(isChecked(container, 'mustard')).toBe(false)
  })

  it('checkboxes have role="checkbox"', () => {
    const { container } = renderCheckbox(fixtureData())
    const items = container.querySelectorAll('[role="checkbox"]')
    expect(items.length).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard: Space toggles
// ---------------------------------------------------------------------------

describe('APG Checkbox — Keyboard Interaction', () => {
  it('Space toggles aria-checked to true', async () => {
    const user = userEvent.setup()
    const { container } = renderCheckbox(fixtureData())

    getNode(container, 'lettuce')!.focus()
    await user.keyboard('{ }')

    expect(isChecked(container, 'lettuce')).toBe(true)
  })

  it('Space toggles aria-checked back to false', async () => {
    const user = userEvent.setup()
    const { container } = renderCheckbox(fixtureData())

    getNode(container, 'lettuce')!.focus()
    await user.keyboard('{ }') // on
    await user.keyboard('{ }') // off

    expect(isChecked(container, 'lettuce')).toBe(false)
  })

  it('Enter toggles aria-checked', async () => {
    const user = userEvent.setup()
    const { container } = renderCheckbox(fixtureData())

    getNode(container, 'tomato')!.focus()
    await user.keyboard('{Enter}')

    expect(isChecked(container, 'tomato')).toBe(true)
  })

  it('each checkbox toggles independently', async () => {
    const user = userEvent.setup()
    const { container } = renderCheckbox(fixtureData())

    getNode(container, 'lettuce')!.focus()
    await user.keyboard('{ }')
    getNode(container, 'mustard')!.focus()
    await user.keyboard('{ }')

    expect(isChecked(container, 'lettuce')).toBe(true)
    expect(isChecked(container, 'tomato')).toBe(false)
    expect(isChecked(container, 'mustard')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 3. Click Interaction
// ---------------------------------------------------------------------------

describe('APG Checkbox — Click Interaction', () => {
  it('clicking toggles aria-checked', async () => {
    const user = userEvent.setup()
    const { container } = renderCheckbox(fixtureData())

    await user.click(getNode(container, 'tomato')!)

    expect(isChecked(container, 'tomato')).toBe(true)
  })
})
