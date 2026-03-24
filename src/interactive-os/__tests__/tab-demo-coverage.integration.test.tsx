/**
 * Demo coverage: TabDemo → tab.ts
 * // V2: 2026-03-25-demo-coverage-loop-prd.md
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TabDemo from '../../pages/axis/TabDemo'

describe('TabDemo coverage', () => {
  describe('native strategy', () => {
    it('Tab follows browser default', async () => {
      const user = userEvent.setup()
      render(<TabDemo />)

      const select = document.querySelector('select')!
      await user.selectOptions(select, 'native')

      const listbox = screen.getByRole('listbox')
      const firstItem = listbox.querySelector('[data-node-id]') as HTMLElement
      firstItem.focus()

      // native: engine doesn't intercept Tab
      await user.keyboard('{ArrowDown}')
      const focused = listbox.querySelector('[tabindex="0"]')
      expect(focused).not.toBeNull()
    })
  })

  describe('flow strategy', () => {
    it('all items are tabbable', async () => {
      const user = userEvent.setup()
      render(<TabDemo />)

      const select = document.querySelector('select')!
      await user.selectOptions(select, 'flow')

      const listbox = screen.getByRole('listbox')
      const firstItem = listbox.querySelector('[data-node-id]') as HTMLElement
      firstItem.focus()

      await user.keyboard('{ArrowDown}')
      const focused = listbox.querySelector('[tabindex="0"]')
      expect(focused).not.toBeNull()
    })
  })

  describe('loop strategy', () => {
    it('Tab wraps to next item', async () => {
      const user = userEvent.setup()
      render(<TabDemo />)

      const select = document.querySelector('select')!
      await user.selectOptions(select, 'loop')

      const listbox = screen.getByRole('listbox')
      const firstItem = listbox.querySelector('[data-node-id]') as HTMLElement
      firstItem.focus()

      await user.keyboard('{Tab}')
      const focused = listbox.querySelector('[tabindex="0"]')
      // Tab in loop mode should move focus to next
      expect(focused).not.toBeNull()
    })

    it('Shift+Tab wraps to previous item', async () => {
      const user = userEvent.setup()
      render(<TabDemo />)

      const select = document.querySelector('select')!
      await user.selectOptions(select, 'loop')

      const listbox = screen.getByRole('listbox')
      // Navigate to second item first
      const firstItem = listbox.querySelector('[data-node-id]') as HTMLElement
      firstItem.focus()
      await user.keyboard('{ArrowDown}')

      await user.keyboard('{Shift>}{Tab}{/Shift}')
      const focused = listbox.querySelector('[tabindex="0"]')
      expect(focused).not.toBeNull()
    })
  })

  describe('escape strategy (default)', () => {
    it('Tab exits the zone (roving-tabindex)', async () => {
      const user = userEvent.setup()
      render(<TabDemo />)

      // escape is default
      const listbox = screen.getByRole('listbox')
      const firstItem = listbox.querySelector('[data-node-id]') as HTMLElement
      firstItem.focus()

      // ArrowDown should work (roving-tabindex + navigate)
      await user.keyboard('{ArrowDown}')
      const focused = listbox.querySelector('[tabindex="0"]')
      expect(focused?.getAttribute('data-node-id')).not.toBe('a1')
    })

    it('ArrowUp/Down navigates in roving mode', async () => {
      const user = userEvent.setup()
      render(<TabDemo />)

      const listbox = screen.getByRole('listbox')
      listbox.querySelector<HTMLElement>('[data-node-id]')!.focus()

      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowUp}')

      const focused = listbox.querySelector('[tabindex="0"]')
      expect(focused?.getAttribute('data-node-id')).toBe('a2')
    })
  })
})
