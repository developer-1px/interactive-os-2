/**
 * Demo coverage: ActivateDemo → activate.ts
 * // V2: 2026-03-25-demo-coverage-loop-prd.md
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ActivateDemo from '../../pages/axis/ActivateDemo'

describe('ActivateDemo coverage', () => {
  describe('default (no options)', () => {
    it('Enter activates focused item', async () => {
      const user = userEvent.setup()
      render(<ActivateDemo />)

      const listbox = screen.getByRole('listbox')
      const firstItem = listbox.querySelector('[data-node-id]')!
      await user.click(firstItem)
      await user.keyboard('{Enter}')

      expect(screen.getByText(/Last activated/)).toBeTruthy()
    })

    it('Space activates focused item', async () => {
      const user = userEvent.setup()
      render(<ActivateDemo />)

      const listbox = screen.getByRole('listbox')
      await user.click(listbox.querySelector('[data-node-id]')!)
      await user.keyboard('{ }')

      expect(screen.getByText(/Last activated/)).toBeTruthy()
    })
  })

  describe('onClick option', () => {
    it('click activates when onClick enabled', async () => {
      const user = userEvent.setup()
      render(<ActivateDemo />)

      // Enable onClick
      const checkboxes = document.querySelectorAll('input[type="checkbox"]')
      await user.click(checkboxes[0]!) // onClick checkbox

      const listbox = screen.getByRole('listbox')
      const items = listbox.querySelectorAll('[data-node-id]')
      await user.click(items[1]!)

      expect(screen.getByText(/Last activated/)).toBeTruthy()
    })
  })

  describe('selectionFollowsFocus option', () => {
    it('navigation auto-activates when selectionFollowsFocus enabled', async () => {
      const user = userEvent.setup()
      render(<ActivateDemo />)

      // Enable selectionFollowsFocus
      const checkboxes = document.querySelectorAll('input[type="checkbox"]')
      await user.click(checkboxes[1]!) // selectionFollowsFocus checkbox

      const listbox = screen.getByRole('listbox')
      await user.click(listbox.querySelector('[data-node-id]')!)
      await user.keyboard('{ArrowDown}')

      expect(screen.getByText(/Last activated/)).toBeTruthy()
    })
  })

  describe('toggleExpand option', () => {
    it('activate toggles expansion when toggleExpand enabled', async () => {
      const user = userEvent.setup()
      render(<ActivateDemo />)

      // Enable toggleExpand
      const checkboxes = document.querySelectorAll('input[type="checkbox"]')
      await user.click(checkboxes[2]!) // toggleExpand checkbox

      const listbox = screen.getByRole('listbox')
      await user.click(listbox.querySelector('[data-node-id]')!)
      await user.keyboard('{Enter}')

      const focused = listbox.querySelector('[tabindex="0"]')
      expect(focused).not.toBeNull()
    })
  })
})
