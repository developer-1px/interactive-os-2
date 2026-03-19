/**
 * Unit tests: Combobox multi-select mode
 *
 * Tests the combobox behavior factory for single and multi selection modes.
 * Uses the Combobox UI component with controlled state via onChange.
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
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
    },
    relationships: {
      [ROOT_ID]: ['apple', 'banana', 'cherry'],
    },
  })
}

function renderItem(item: Record<string, unknown>, state: NodeState) {
  return (
    <span
      data-testid={`item-${item.id}`}
      data-selected={state.selected}
      data-focused={state.focused}
    >
      {(item.data as Record<string, unknown>)?.label as string}
    </span>
  )
}

function getInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[role="combobox"]') as HTMLInputElement
}

function getListbox(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[role="listbox"]')
}

function ControlledCombobox({
  selectionMode,
}: {
  selectionMode?: 'single' | 'multiple'
}) {
  const [data, setData] = useState(fixtureData)
  return (
    <Combobox
      data={data}
      plugins={[core(), comboboxPlugin()]}
      onChange={setData}
      placeholder="Pick..."
      selectionMode={selectionMode}
      renderItem={renderItem}
    />
  )
}

describe('Combobox behavior factory', () => {
  describe('single select mode (default)', () => {
    it('Enter selects focused option and closes dropdown', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox />)
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

    it('Enter when closed opens dropdown (existing behavior preserved)', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox selectionMode="single" />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{Enter}')

      expect(input.getAttribute('aria-expanded')).toBe('true')
      expect(getListbox(container)).toBeTruthy()
    })
  })

  describe('multi select mode', () => {
    it('Enter toggles selection and keeps dropdown open', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox selectionMode="multiple" />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open + focus apple
      await user.keyboard('{Enter}')     // toggle apple

      // Dropdown stays open
      expect(getListbox(container)).toBeTruthy()
      expect(input.getAttribute('aria-expanded')).toBe('true')

      // Apple is selected
      const appleItem = container.querySelector('[data-testid="item-apple"]')
      expect(appleItem?.getAttribute('data-selected')).toBe('true')
    })

    it('second Enter on same item deselects it', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox selectionMode="multiple" />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open + focus apple
      await user.keyboard('{Enter}')     // select apple

      const appleItem = container.querySelector('[data-testid="item-apple"]')
      expect(appleItem?.getAttribute('data-selected')).toBe('true')

      await user.keyboard('{Enter}')     // deselect apple (toggle again)

      expect(appleItem?.getAttribute('data-selected')).toBe('false')

      // Dropdown still open
      expect(getListbox(container)).toBeTruthy()
    })

    it('can select multiple items independently', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox selectionMode="multiple" />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open + focus apple
      await user.keyboard('{Enter}')     // select apple
      await user.keyboard('{ArrowDown}') // banana
      await user.keyboard('{Enter}')     // select banana

      // Both selected, dropdown still open
      expect(getListbox(container)).toBeTruthy()

      const appleItem = container.querySelector('[data-testid="item-apple"]')
      const bananaItem = container.querySelector('[data-testid="item-banana"]')
      expect(appleItem?.getAttribute('data-selected')).toBe('true')
      expect(bananaItem?.getAttribute('data-selected')).toBe('true')
    })

    it('Escape closes the dropdown in multi mode', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox selectionMode="multiple" />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open
      await user.keyboard('{Escape}')    // close

      expect(getListbox(container)).toBeNull()
      expect(input.getAttribute('aria-expanded')).toBe('false')
    })

    it('multi-select renders selected items as tokens', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox selectionMode="multiple" />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open + focus apple
      await user.keyboard('{Enter}')     // select apple
      await user.keyboard('{ArrowDown}') // banana
      await user.keyboard('{Enter}')     // select banana

      const tokens = container.querySelectorAll('[data-combobox-token]')
      expect(tokens).toHaveLength(2)
      expect(tokens[0].textContent).toContain('Apple')
      expect(tokens[1].textContent).toContain('Banana')
    })

    it('Backspace on empty input removes last token', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox selectionMode="multiple" />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open + focus apple
      await user.keyboard('{Enter}')     // select apple
      await user.keyboard('{ArrowDown}') // banana
      await user.keyboard('{Enter}')     // select banana
      await user.keyboard('{Escape}')    // close dropdown

      expect(container.querySelectorAll('[data-combobox-token]')).toHaveLength(2)

      input.focus()
      await user.keyboard('{Backspace}') // remove last token (banana)

      expect(container.querySelectorAll('[data-combobox-token]')).toHaveLength(1)
      expect(container.querySelector('[data-combobox-token]')?.textContent).toContain('Apple')
    })

    it('token × button removes that token without opening dropdown', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox selectionMode="multiple" />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open + focus apple
      await user.keyboard('{Enter}')     // select apple
      await user.keyboard('{ArrowDown}') // banana
      await user.keyboard('{Enter}')     // select banana
      await user.keyboard('{Escape}')    // close dropdown

      const removeButtons = container.querySelectorAll('[data-combobox-token] button')
      expect(removeButtons).toHaveLength(2)

      // Click × on first token (Apple)
      await user.click(removeButtons[0])

      const tokens = container.querySelectorAll('[data-combobox-token]')
      expect(tokens).toHaveLength(1)
      expect(tokens[0].textContent).toContain('Banana')

      // Dropdown should remain closed
      expect(getListbox(container)).toBeNull()
    })

    it('tokens do not appear in single-select mode', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox selectionMode="single" />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open + focus apple
      await user.keyboard('{Enter}')     // select apple

      expect(container.querySelectorAll('[data-combobox-token]')).toHaveLength(0)
    })
  })
})
