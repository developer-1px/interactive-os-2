/**
 * Integration test: SwitchGroup keyboard interactions
 *
 * Tests the full user flow: render → keyboard/click input → aria-checked result.
 * Switch reuses expanded state for checked/unchecked toggle via expandable: true.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SwitchGroup } from '../ui/SwitchGroup'
import { createStore } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core } from '../plugins/core'
import type { NodeState } from '../behaviors/types'

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

function renderSwitch(data: NormalizedData) {
  return render(
    <SwitchGroup
      data={data}
      plugins={[core()]}
      renderItem={(item, state: NodeState) => (
        <span
          data-testid={`switch-${item.id}`}
          data-focused={state.focused}
          data-checked={state.expanded}
        >
          {(item.data as Record<string, unknown>)?.label as string}
        </span>
      )}
    />
  )
}

function getNodeElement(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getAriaChecked(container: HTMLElement, id: string): string | null {
  return getNodeElement(container, id)?.getAttribute('aria-checked') ?? null
}

describe('SwitchGroup keyboard integration', () => {
  describe('Space toggle', () => {
    it('Space toggles aria-checked from false to true', async () => {
      const user = userEvent.setup()
      const { container } = renderSwitch(fixtureData())

      expect(getAriaChecked(container, 'dark-mode')).toBe('false')

      getNodeElement(container, 'dark-mode')!.focus()
      await user.keyboard('{ }')

      expect(getAriaChecked(container, 'dark-mode')).toBe('true')
    })

    it('Space toggles aria-checked back from true to false', async () => {
      const user = userEvent.setup()
      const { container } = renderSwitch(fixtureData())

      getNodeElement(container, 'dark-mode')!.focus()
      await user.keyboard('{ }') // on
      expect(getAriaChecked(container, 'dark-mode')).toBe('true')

      await user.keyboard('{ }') // off
      expect(getAriaChecked(container, 'dark-mode')).toBe('false')
    })
  })

  describe('Enter toggle', () => {
    it('Enter toggles aria-checked', async () => {
      const user = userEvent.setup()
      const { container } = renderSwitch(fixtureData())

      expect(getAriaChecked(container, 'notifications')).toBe('false')

      getNodeElement(container, 'notifications')!.focus()
      await user.keyboard('{Enter}')

      expect(getAriaChecked(container, 'notifications')).toBe('true')
    })

    it('Enter toggles back', async () => {
      const user = userEvent.setup()
      const { container } = renderSwitch(fixtureData())

      getNodeElement(container, 'notifications')!.focus()
      await user.keyboard('{Enter}') // on
      await user.keyboard('{Enter}') // off

      expect(getAriaChecked(container, 'notifications')).toBe('false')
    })
  })

  describe('click toggle', () => {
    it('click toggles aria-checked', async () => {
      const user = userEvent.setup()
      const { container } = renderSwitch(fixtureData())

      expect(getAriaChecked(container, 'auto-save')).toBe('false')

      await user.click(getNodeElement(container, 'auto-save')!)

      expect(getAriaChecked(container, 'auto-save')).toBe('true')
    })

    it('clicking again toggles back', async () => {
      const user = userEvent.setup()
      const { container } = renderSwitch(fixtureData())

      await user.click(getNodeElement(container, 'auto-save')!) // on
      await user.click(getNodeElement(container, 'auto-save')!) // off

      expect(getAriaChecked(container, 'auto-save')).toBe('false')
    })
  })

  describe('Tab navigation (natural-tab-order)', () => {
    it('all switches have tabIndex=0', () => {
      const { container } = renderSwitch(fixtureData())

      const nodes = container.querySelectorAll('[data-node-id]')
      nodes.forEach((node) => {
        expect(node.getAttribute('tabindex')).toBe('0')
      })
    })
  })

  describe('independent toggle', () => {
    it('toggling one switch does not affect others', async () => {
      const user = userEvent.setup()
      const { container } = renderSwitch(fixtureData())

      getNodeElement(container, 'dark-mode')!.focus()
      await user.keyboard('{ }') // toggle dark-mode on

      expect(getAriaChecked(container, 'dark-mode')).toBe('true')
      expect(getAriaChecked(container, 'notifications')).toBe('false')
      expect(getAriaChecked(container, 'auto-save')).toBe('false')
    })

    it('multiple switches can be on simultaneously', async () => {
      const user = userEvent.setup()
      const { container } = renderSwitch(fixtureData())

      getNodeElement(container, 'dark-mode')!.focus()
      await user.keyboard('{ }')

      getNodeElement(container, 'notifications')!.focus()
      await user.keyboard('{ }')

      expect(getAriaChecked(container, 'dark-mode')).toBe('true')
      expect(getAriaChecked(container, 'notifications')).toBe('true')
      expect(getAriaChecked(container, 'auto-save')).toBe('false')
    })
  })
})
