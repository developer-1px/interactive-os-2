/**
 * Demo coverage: DismissDemo → dismiss.ts
 * // V2: 2026-03-25-demo-coverage-loop-prd.md
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DismissDemo from '../../pages/axis/DismissDemo'

describe('DismissDemo coverage', () => {
  describe('escape enabled (default)', () => {
    it('Escape triggers collapse', async () => {
      const user = userEvent.setup()
      render(<DismissDemo />)

      const container = screen.getByRole('dialog')
      const firstItem = container.querySelector('[data-node-id]')!
      await user.click(firstItem)
      await user.keyboard('{Escape}')

      const focused = container.querySelector('[tabindex="0"]')
      expect(focused).not.toBeNull()
    })
  })

  describe('escape disabled', () => {
    it('no keyMap when escape is off', async () => {
      const user = userEvent.setup()
      render(<DismissDemo />)

      // Uncheck escape
      const checkbox = document.querySelector('input[type="checkbox"]')!
      await user.click(checkbox)

      // Escape should do nothing
      const container = screen.getByRole('dialog')
      const firstItem = container.querySelector('[data-node-id]')!
      await user.click(firstItem)

      const focusedBefore = container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')
      await user.keyboard('{Escape}')
      const focusedAfter = container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')

      expect(focusedAfter).toBe(focusedBefore)
    })
  })
})
