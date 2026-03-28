// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Switch
 * https://www.w3.org/WAI/ARIA/apg/patterns/switch/examples/switch/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SwitchGroup } from '../ui/SwitchGroup'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { captureAriaTree } from './helpers/ariaTreeSnapshot'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      'dark-mode': { id: 'dark-mode', data: { label: 'Dark Mode' } },
      'notifications': { id: 'notifications', data: { label: 'Notifications' } },
      'auto-save': { id: 'auto-save', data: { label: 'Auto-save' } },
    },
    relationships: {
      [ROOT_ID]: ['dark-mode', 'notifications', 'auto-save'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderSwitch(data: NormalizedData) {
  return render(
    <SwitchGroup
      data={data}
      plugins={[]}
      renderItem={(props, item, state: NodeState) => (
        <span
          {...props}
          data-testid={`switch-${item.id}`}
          data-focused={state.focused}
          data-checked={state.checked}
        >
          {(item.data as Record<string, unknown>)?.label as string}
        </span>
      )}
    />,
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

describe('APG Switch — ARIA Structure', () => {
  it('each switch has role="switch"', () => {
    const { container } = renderSwitch(fixtureData())
    const nodes = container.querySelectorAll('[data-node-id]')
    nodes.forEach((node) => {
      expect(node.getAttribute('role')).toBe('switch')
    })
  })

  it('initial aria-checked is false', () => {
    const { container } = renderSwitch(fixtureData())
    expect(getAriaChecked(container, 'dark-mode')).toBe('false')
    expect(getAriaChecked(container, 'notifications')).toBe('false')
    expect(getAriaChecked(container, 'auto-save')).toBe('false')
  })

  it('captureAriaTree snapshot includes aria-checked attribute', () => {
    const { container } = renderSwitch(fixtureData())
    const tree = captureAriaTree(container)
    expect(tree).toContain('checked=false')
  })

  it('all switches have tabindex=0 (natural-tab-order)', () => {
    const { container } = renderSwitch(fixtureData())
    const nodes = container.querySelectorAll('[data-node-id]')
    nodes.forEach((node) => {
      expect(node.getAttribute('tabindex')).toBe('0')
    })
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard Interaction
// ---------------------------------------------------------------------------

describe('APG Switch — Keyboard Interaction', () => {
  describe('Space key', () => {
    it('Space toggles aria-checked from false to true', async () => {
      const user = userEvent.setup()
      const { container } = renderSwitch(fixtureData())

      expect(getAriaChecked(container, 'dark-mode')).toBe('false')

      getNode(container, 'dark-mode')!.focus()
      await user.keyboard('{ }')

      expect(getAriaChecked(container, 'dark-mode')).toBe('true')
    })

    it('Space toggles aria-checked back from true to false', async () => {
      const user = userEvent.setup()
      const { container } = renderSwitch(fixtureData())

      getNode(container, 'dark-mode')!.focus()
      await user.keyboard('{ }') // on
      expect(getAriaChecked(container, 'dark-mode')).toBe('true')

      await user.keyboard('{ }') // off
      expect(getAriaChecked(container, 'dark-mode')).toBe('false')
    })
  })

  describe('Enter key', () => {
    it('Enter toggles aria-checked', async () => {
      const user = userEvent.setup()
      const { container } = renderSwitch(fixtureData())

      expect(getAriaChecked(container, 'notifications')).toBe('false')

      getNode(container, 'notifications')!.focus()
      await user.keyboard('{Enter}')

      expect(getAriaChecked(container, 'notifications')).toBe('true')
    })

    it('Enter toggles back to false', async () => {
      const user = userEvent.setup()
      const { container } = renderSwitch(fixtureData())

      getNode(container, 'notifications')!.focus()
      await user.keyboard('{Enter}') // on
      await user.keyboard('{Enter}') // off

      expect(getAriaChecked(container, 'notifications')).toBe('false')
    })
  })
})

// ---------------------------------------------------------------------------
// 3. Click Interaction
// ---------------------------------------------------------------------------

describe('APG Switch — Click Interaction', () => {
  it('click toggles aria-checked', async () => {
    const user = userEvent.setup()
    const { container } = renderSwitch(fixtureData())

    expect(getAriaChecked(container, 'auto-save')).toBe('false')

    await user.click(getNode(container, 'auto-save')!)

    expect(getAriaChecked(container, 'auto-save')).toBe('true')
  })

  it('clicking again toggles back to false', async () => {
    const user = userEvent.setup()
    const { container } = renderSwitch(fixtureData())

    await user.click(getNode(container, 'auto-save')!) // on
    await user.click(getNode(container, 'auto-save')!) // off

    expect(getAriaChecked(container, 'auto-save')).toBe('false')
  })
})

// ---------------------------------------------------------------------------
// 4. Independence
// ---------------------------------------------------------------------------

describe('APG Switch — Independent Toggle', () => {
  it('toggling one switch does not affect others', async () => {
    const user = userEvent.setup()
    const { container } = renderSwitch(fixtureData())

    getNode(container, 'dark-mode')!.focus()
    await user.keyboard('{ }')

    expect(getAriaChecked(container, 'dark-mode')).toBe('true')
    expect(getAriaChecked(container, 'notifications')).toBe('false')
    expect(getAriaChecked(container, 'auto-save')).toBe('false')
  })

  it('multiple switches can be on simultaneously', async () => {
    const user = userEvent.setup()
    const { container } = renderSwitch(fixtureData())

    getNode(container, 'dark-mode')!.focus()
    await user.keyboard('{ }')

    getNode(container, 'notifications')!.focus()
    await user.keyboard('{ }')

    expect(getAriaChecked(container, 'dark-mode')).toBe('true')
    expect(getAriaChecked(container, 'notifications')).toBe('true')
    expect(getAriaChecked(container, 'auto-save')).toBe('false')
  })
})
