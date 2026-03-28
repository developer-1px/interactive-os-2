// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Switch Variants (Button, Checkbox)
 * https://www.w3.org/WAI/ARIA/apg/patterns/switch/examples/switch-button/
 * https://www.w3.org/WAI/ARIA/apg/patterns/switch/examples/switch-checkbox/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { switchPattern } from '../pattern/roles/switch'
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
      notifications: { id: 'notifications', data: { name: 'Notifications' } },
      darkMode:      { id: 'darkMode',      data: { name: 'Dark Mode'      } },
    },
    relationships: {
      [ROOT_ID]: ['notifications', 'darkMode'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderSwitch(data: NormalizedData) {
  return render(
    <Aria pattern={switchPattern} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <span {...props} data-testid={`sw-${item.id}`}>
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
// 1. ARIA Structure (common to both #55 and #56)
// ---------------------------------------------------------------------------

describe('APG Switch Variants — ARIA Structure', () => {
  it('items have role="switch"', () => {
    const { container } = renderSwitch(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('switch')
  })

  it('aria-checked=false initially', () => {
    const { container } = renderSwitch(fixtureData())
    expect(isChecked(container, 'notifications')).toBe(false)
    expect(isChecked(container, 'darkMode')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard: Toggle (Space/Enter — APG switch button example #55)
// ---------------------------------------------------------------------------

describe('APG Switch Button (#55) — Keyboard', () => {
  it('Space toggles aria-checked', async () => {
    const user = userEvent.setup()
    const { container } = renderSwitch(fixtureData())

    getNode(container, 'notifications')!.focus()
    await user.keyboard('{ }')

    expect(isChecked(container, 'notifications')).toBe(true)
  })

  it('Enter toggles aria-checked', async () => {
    const user = userEvent.setup()
    const { container } = renderSwitch(fixtureData())

    getNode(container, 'darkMode')!.focus()
    await user.keyboard('{Enter}')

    expect(isChecked(container, 'darkMode')).toBe(true)
  })

  it('toggle back to false', async () => {
    const user = userEvent.setup()
    const { container } = renderSwitch(fixtureData())

    getNode(container, 'notifications')!.focus()
    await user.keyboard('{ }')
    await user.keyboard('{ }')

    expect(isChecked(container, 'notifications')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 3. Click Interaction (APG switch checkbox example #56)
// ---------------------------------------------------------------------------

describe('APG Switch Checkbox (#56) — Click', () => {
  it('click toggles aria-checked', async () => {
    const user = userEvent.setup()
    const { container } = renderSwitch(fixtureData())

    await user.click(getNode(container, 'notifications')!)

    expect(isChecked(container, 'notifications')).toBe(true)
  })

  it('each switch toggles independently', async () => {
    const user = userEvent.setup()
    const { container } = renderSwitch(fixtureData())

    await user.click(getNode(container, 'notifications')!)

    expect(isChecked(container, 'notifications')).toBe(true)
    expect(isChecked(container, 'darkMode')).toBe(false)
  })
})
