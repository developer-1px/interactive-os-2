/**
 * Demo coverage: SelectDemo → select.ts
 * // V2: 2026-03-25-demo-coverage-loop-prd.md
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SelectDemo from '../../pages/axis/SelectDemo'

describe('SelectDemo coverage', () => {
  describe('multiple mode (default)', () => {
    it('Space toggles selection', async () => {
      const user = userEvent.setup()
      render(<SelectDemo />)

      const listbox = screen.getByRole('listbox')
      const firstItem = listbox.querySelector('[data-node-id]') as HTMLElement
      firstItem.focus()

      await user.keyboard('{ }') // toggle → selected

      const selected = listbox.querySelector('[aria-selected="true"]')
      expect(selected).not.toBeNull()
    })

    it('multiple items can be selected', async () => {
      const user = userEvent.setup()
      render(<SelectDemo />)

      const listbox = screen.getByRole('listbox')
      const firstItem = listbox.querySelector('[data-node-id]') as HTMLElement
      firstItem.focus()

      await user.keyboard('{ }')        // select first
      await user.keyboard('{ArrowDown}') // move to second
      await user.keyboard('{ }')        // select second

      const selected = listbox.querySelectorAll('[aria-selected="true"]')
      expect(selected.length).toBe(2)
    })
  })

  describe('single mode', () => {
    it('only one item selected at a time', async () => {
      const user = userEvent.setup()
      render(<SelectDemo />)

      // Switch to single mode
      const modeSelect = document.querySelector('select')!
      await user.selectOptions(modeSelect, 'single')

      const listbox = screen.getByRole('listbox')
      await user.click(listbox.querySelector('[data-node-id]')!)

      await user.keyboard('{ }')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ }')

      const selected = listbox.querySelectorAll('[aria-selected="true"]')
      expect(selected.length).toBe(1)
    })
  })

  describe('extended selection', () => {
    it('Shift+ArrowDown extends selection range', async () => {
      const user = userEvent.setup()
      render(<SelectDemo />)

      // Enable extended
      const checkbox = document.querySelector('input[type="checkbox"]')!
      await user.click(checkbox)

      const listbox = screen.getByRole('listbox')
      await user.click(listbox.querySelector('[data-node-id]')!)
      await user.keyboard('{ }') // select first

      await user.keyboard('{Shift>}{ArrowDown}{/Shift}')

      const selected = listbox.querySelectorAll('[aria-selected="true"]')
      expect(selected.length).toBeGreaterThanOrEqual(2)
    })

    it('Shift+ArrowUp extends selection upward', async () => {
      const user = userEvent.setup()
      render(<SelectDemo />)

      const checkbox = document.querySelector('input[type="checkbox"]')!
      await user.click(checkbox)

      const listbox = screen.getByRole('listbox')
      await user.click(listbox.querySelector('[data-node-id]')!)

      // Navigate down first, then extend up
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ }')
      await user.keyboard('{Shift>}{ArrowUp}{/Shift}')

      const selected = listbox.querySelectorAll('[aria-selected="true"]')
      expect(selected.length).toBeGreaterThanOrEqual(2)
    })

    it('Shift+Home extends to first item', async () => {
      const user = userEvent.setup()
      render(<SelectDemo />)

      const checkbox = document.querySelector('input[type="checkbox"]')!
      await user.click(checkbox)

      const listbox = screen.getByRole('listbox')
      await user.click(listbox.querySelector('[data-node-id]')!)

      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ }')
      await user.keyboard('{Shift>}{Home}{/Shift}')

      const selected = listbox.querySelectorAll('[aria-selected="true"]')
      expect(selected.length).toBeGreaterThanOrEqual(2)
    })

    it('Shift+End extends to last item', async () => {
      const user = userEvent.setup()
      render(<SelectDemo />)

      const checkbox = document.querySelector('input[type="checkbox"]')!
      await user.click(checkbox)

      const listbox = screen.getByRole('listbox')
      await user.click(listbox.querySelector('[data-node-id]')!)
      await user.keyboard('{ }')

      await user.keyboard('{Shift>}{End}{/Shift}')

      const selected = listbox.querySelectorAll('[aria-selected="true"]')
      expect(selected.length).toBeGreaterThanOrEqual(2)
    })

    it('extended disabled in single mode', async () => {
      const user = userEvent.setup()
      render(<SelectDemo />)

      // Switch to single — extended checkbox should be disabled
      const modeSelect = document.querySelector('select')!
      await user.selectOptions(modeSelect, 'single')

      const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement
      expect(checkbox.disabled).toBe(true)
    })
  })
})
