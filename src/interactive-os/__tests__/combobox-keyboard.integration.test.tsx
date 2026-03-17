/**
 * Integration test: Combobox keyboard interactions
 *
 * Tests the full user flow: render -> keyboard input -> visible result.
 * Combobox uses aria-activedescendant: keyboard events target the input,
 * options do NOT have tabIndex, and aria-activedescendant tracks focus.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox } from '../ui/Combobox'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core } from '../plugins/core'
import { combobox as comboboxPlugin } from '../plugins/combobox'
import type { NodeState } from '../behaviors/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      apple: { id: 'apple', data: { label: 'Apple' } },
      banana: { id: 'banana', data: { label: 'Banana' } },
      cherry: { id: 'cherry', data: { label: 'Cherry' } },
      date: { id: 'date', data: { label: 'Date' } },
    },
    relationships: {
      [ROOT_ID]: ['apple', 'banana', 'cherry', 'date'],
    },
  })
}

function renderCombobox(data: NormalizedData) {
  return render(
    <Combobox
      data={data}
      plugins={[core(), comboboxPlugin()]}
      placeholder="Pick a fruit..."
      renderItem={(item, state: NodeState) => (
        <span
          data-testid={`item-${item.id}`}
          data-focused={state.focused}
          data-selected={state.selected}
        >
          {(item.data as Record<string, unknown>)?.label as string}
        </span>
      )}
    />
  )
}

function getInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[role="combobox"]') as HTMLInputElement
}

function getListbox(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[role="listbox"]')
}

function getOptions(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('[role="option"]'))
}

describe('Combobox keyboard integration', () => {
  describe('ARIA roles', () => {
    it('input has role="combobox"', () => {
      const { container } = renderCombobox(fixtureData())
      const input = getInput(container)
      expect(input).toBeTruthy()
      expect(input.getAttribute('role')).toBe('combobox')
    })

    it('input has aria-haspopup="listbox"', () => {
      const { container } = renderCombobox(fixtureData())
      const input = getInput(container)
      expect(input.getAttribute('aria-haspopup')).toBe('listbox')
    })

    it('dropdown closed initially — no listbox rendered', () => {
      const { container } = renderCombobox(fixtureData())
      expect(getListbox(container)).toBeNull()
    })

    it('input shows placeholder when nothing selected', () => {
      const { container } = renderCombobox(fixtureData())
      const input = getInput(container)
      expect(input.getAttribute('placeholder')).toBe('Pick a fruit...')
    })

    it('aria-expanded is false when closed', () => {
      const { container } = renderCombobox(fixtureData())
      const input = getInput(container)
      expect(input.getAttribute('aria-expanded')).toBe('false')
    })
  })

  describe('open/close', () => {
    it('ArrowDown opens dropdown and focuses first option', async () => {
      const user = userEvent.setup()
      const { container } = renderCombobox(fixtureData())
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}')

      expect(input.getAttribute('aria-expanded')).toBe('true')
      expect(getListbox(container)).toBeTruthy()

      const options = getOptions(container)
      expect(options).toHaveLength(4)
      expect(options[0]!.getAttribute('role')).toBe('option')

      // aria-activedescendant points to first option
      const activeDesc = input.getAttribute('aria-activedescendant')
      expect(activeDesc).toBe('apple')
    })

    it('Enter opens dropdown when closed', async () => {
      const user = userEvent.setup()
      const { container } = renderCombobox(fixtureData())
      const input = getInput(container)

      input.focus()
      await user.keyboard('{Enter}')

      expect(input.getAttribute('aria-expanded')).toBe('true')
      expect(getListbox(container)).toBeTruthy()
    })

    it('Escape closes dropdown', async () => {
      const user = userEvent.setup()
      const { container } = renderCombobox(fixtureData())
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}')
      expect(getListbox(container)).toBeTruthy()

      await user.keyboard('{Escape}')
      expect(getListbox(container)).toBeNull()
      expect(input.getAttribute('aria-expanded')).toBe('false')
    })
  })

  describe('navigation (aria-activedescendant)', () => {
    it('ArrowDown navigates to next option', async () => {
      const user = userEvent.setup()
      const { container } = renderCombobox(fixtureData())
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open + focus first
      await user.keyboard('{ArrowDown}') // move to second

      expect(input.getAttribute('aria-activedescendant')).toBe('banana')
    })

    it('ArrowUp navigates to previous option', async () => {
      const user = userEvent.setup()
      const { container } = renderCombobox(fixtureData())
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open + focus first
      await user.keyboard('{ArrowDown}') // banana
      await user.keyboard('{ArrowUp}')   // back to apple

      expect(input.getAttribute('aria-activedescendant')).toBe('apple')
    })

    it('Home moves to first option', async () => {
      const user = userEvent.setup()
      const { container } = renderCombobox(fixtureData())
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open
      await user.keyboard('{ArrowDown}') // banana
      await user.keyboard('{ArrowDown}') // cherry
      await user.keyboard('{Home}')

      expect(input.getAttribute('aria-activedescendant')).toBe('apple')
    })

    it('End moves to last option', async () => {
      const user = userEvent.setup()
      const { container } = renderCombobox(fixtureData())
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open
      await user.keyboard('{End}')

      expect(input.getAttribute('aria-activedescendant')).toBe('date')
    })

    it('options do NOT have tabIndex', async () => {
      const user = userEvent.setup()
      const { container } = renderCombobox(fixtureData())
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}')

      const options = getOptions(container)
      for (const option of options) {
        expect(option.hasAttribute('tabindex')).toBe(false)
      }
    })
  })

  describe('selection', () => {
    it('Enter selects focused option and closes dropdown', async () => {
      const user = userEvent.setup()
      const { container } = renderCombobox(fixtureData())
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open + focus apple
      await user.keyboard('{ArrowDown}') // banana
      await user.keyboard('{Enter}')     // select banana + close

      // Dropdown closed
      expect(getListbox(container)).toBeNull()
      expect(input.getAttribute('aria-expanded')).toBe('false')

      // Input shows selected value
      expect(input.value).toBe('Banana')
    })

    it('Escape closes without changing selection', async () => {
      const user = userEvent.setup()
      const { container } = renderCombobox(fixtureData())
      const input = getInput(container)

      // First select banana
      input.focus()
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')
      expect(input.value).toBe('Banana')

      // Open again, navigate to cherry, then escape
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}') // cherry
      await user.keyboard('{Escape}')

      // Selection unchanged
      expect(input.value).toBe('Banana')
    })
  })
})
