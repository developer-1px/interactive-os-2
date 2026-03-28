// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Button (Toggle)
 * https://www.w3.org/WAI/ARIA/apg/patterns/button/examples/button/
 * https://www.w3.org/WAI/ARIA/apg/patterns/button/examples/button_idl/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { buttonToggle } from '../pattern/roles/buttonToggle'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      mute: { id: 'mute', data: { name: 'Mute' } },
    },
    relationships: {
      [ROOT_ID]: ['mute'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderButton(data: NormalizedData) {
  return render(
    <Aria behavior={buttonToggle} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <span {...props} data-testid={`btn-${item.id}`}>
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )} />
    </Aria>,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function isPressed(container: HTMLElement, id: string): boolean {
  return getNode(container, id)?.getAttribute('aria-pressed') === 'true'
}

// ---------------------------------------------------------------------------
// 1. ARIA Structure
// ---------------------------------------------------------------------------

describe('APG Button — ARIA Structure', () => {
  it('items have role="button"', () => {
    const { container } = renderButton(fixtureData())
    expect(container.querySelector('[role="button"]')).not.toBeNull()
  })

  it('aria-pressed=false initially', () => {
    const { container } = renderButton(fixtureData())
    expect(isPressed(container, 'mute')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard: Toggle
// ---------------------------------------------------------------------------

describe('APG Button — Keyboard Interaction', () => {
  it('Enter toggles aria-pressed to true', async () => {
    const user = userEvent.setup()
    const { container } = renderButton(fixtureData())

    getNode(container, 'mute')!.focus()
    await user.keyboard('{Enter}')

    expect(isPressed(container, 'mute')).toBe(true)
  })

  it('Enter toggles aria-pressed back to false', async () => {
    const user = userEvent.setup()
    const { container } = renderButton(fixtureData())

    getNode(container, 'mute')!.focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}')

    expect(isPressed(container, 'mute')).toBe(false)
  })

  it('Space toggles aria-pressed', async () => {
    const user = userEvent.setup()
    const { container } = renderButton(fixtureData())

    getNode(container, 'mute')!.focus()
    await user.keyboard('{ }')

    expect(isPressed(container, 'mute')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 3. Click Interaction
// ---------------------------------------------------------------------------

describe('APG Button — Click Interaction', () => {
  it('click toggles aria-pressed', async () => {
    const user = userEvent.setup()
    const { container } = renderButton(fixtureData())

    await user.click(getNode(container, 'mute')!)

    expect(isPressed(container, 'mute')).toBe(true)
  })
})
