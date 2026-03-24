/**
 * Demo coverage: ExpandDemo → expand.ts
 * // V2: 2026-03-25-demo-coverage-loop-prd.md
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExpandDemo from '../../pages/axis/ExpandDemo'

describe('ExpandDemo coverage', () => {
  describe('arrow mode (default)', () => {
    it('ArrowRight expands a folder', async () => {
      const user = userEvent.setup()
      render(<ExpandDemo />)

      const tree = screen.getByRole('tree')
      const firstItem = tree.querySelector('[data-node-id]')!
      await user.click(firstItem)

      // ArrowRight → expand
      await user.keyboard('{ArrowRight}')
      const expanded = tree.querySelector('[aria-expanded="true"]')
      expect(expanded).not.toBeNull()
    })

    it('ArrowRight on expanded node focuses child', async () => {
      const user = userEvent.setup()
      render(<ExpandDemo />)

      const tree = screen.getByRole('tree')
      await user.click(tree.querySelector('[data-node-id]')!)

      // Expand first
      await user.keyboard('{ArrowRight}')
      // Enter child
      await user.keyboard('{ArrowRight}')

      const focused = tree.querySelector('[tabindex="0"]')
      expect(focused?.getAttribute('data-node-id')).not.toBe('folder1')
    })

    it('ArrowLeft collapses expanded node', async () => {
      const user = userEvent.setup()
      render(<ExpandDemo />)

      const tree = screen.getByRole('tree')
      await user.click(tree.querySelector('[data-node-id]')!)

      await user.keyboard('{ArrowRight}') // expand
      await user.keyboard('{ArrowLeft}') // collapse

      const collapsed = tree.querySelector('[data-node-id="folder1"]')
      expect(collapsed?.getAttribute('aria-expanded')).toBe('false')
    })

    it('ArrowLeft on collapsed node focuses parent', async () => {
      const user = userEvent.setup()
      render(<ExpandDemo />)

      const tree = screen.getByRole('tree')
      await user.click(tree.querySelector('[data-node-id]')!)

      // Expand, enter child, then ArrowLeft should go to parent
      await user.keyboard('{ArrowRight}') // expand
      await user.keyboard('{ArrowRight}') // focus child
      await user.keyboard('{ArrowLeft}') // focus parent

      const focused = tree.querySelector('[tabindex="0"]')
      expect(focused?.getAttribute('data-node-id')).toBe('folder1')
    })

    it('ArrowDown/Up navigates between visible items', async () => {
      const user = userEvent.setup()
      render(<ExpandDemo />)

      const tree = screen.getByRole('tree')
      await user.click(tree.querySelector('[data-node-id]')!)

      await user.keyboard('{ArrowDown}')
      const focused = tree.querySelector('[tabindex="0"]')
      expect(focused?.getAttribute('data-node-id')).toBe('folder2')
    })
  })

  describe('enter-esc mode', () => {
    it('Enter enters child scope', async () => {
      const user = userEvent.setup()
      render(<ExpandDemo />)

      // Switch to enter-esc mode
      const select = document.querySelector('select')!
      await user.selectOptions(select, 'enter-esc')

      const container = screen.getByLabelText('expand demo')
      const firstItem = container.querySelector('[data-node-id]')!
      await user.click(firstItem)

      await user.keyboard('{Enter}')

      // Should have entered child scope — focus moved to a child
      const focused = container.querySelector('[tabindex="0"]')
      expect(focused).not.toBeNull()
    })

    it('Escape exits to parent scope', async () => {
      const user = userEvent.setup()
      render(<ExpandDemo />)

      const select = document.querySelector('select')!
      await user.selectOptions(select, 'enter-esc')

      const container = screen.getByLabelText('expand demo')
      await user.click(container.querySelector('[data-node-id]')!)

      // Enter then escape
      await user.keyboard('{Enter}')
      await user.keyboard('{Escape}')

      const focused = container.querySelector('[tabindex="0"]')
      expect(focused).not.toBeNull()
    })
  })
})
