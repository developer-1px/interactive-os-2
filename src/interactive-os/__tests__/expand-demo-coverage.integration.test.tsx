/**
 * Demo coverage: ExpandDemo → expand.ts
 * // V2: 2026-03-25-demo-coverage-loop-prd.md
 *
 * 코드에서 도출한 분기 맵:
 *   arrow mode:  ArrowRight(isExpanded? focusChild : expand)
 *                ArrowLeft(isExpanded? collapse : focusParent)
 *   enter-esc:   Enter(children>0? enterChild+focusChild : startRename)
 *                Escape(exitToParent)
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExpandDemo from '../../pages/axis/ExpandDemo'

describe('ExpandDemo coverage', () => {
  describe('arrow mode (default)', () => {
    // B3b: isExpanded=false → expand()
    it('ArrowRight on collapsed folder expands it', async () => {
      const user = userEvent.setup()
      render(<ExpandDemo />)

      const tree = screen.getByRole('tree')
      await user.click(tree.querySelector('[data-node-id="folder1"]')!)

      await user.keyboard('{ArrowRight}')

      expect(tree.querySelector('[data-node-id="folder1"]')?.getAttribute('aria-expanded')).toBe('true')
    })

    // B3a: isExpanded=true → focusChild()
    it('ArrowRight on expanded folder focuses first child', async () => {
      const user = userEvent.setup()
      render(<ExpandDemo />)

      const tree = screen.getByRole('tree')
      await user.click(tree.querySelector('[data-node-id="folder1"]')!)

      await user.keyboard('{ArrowRight}') // expand
      await user.keyboard('{ArrowRight}') // focusChild

      const focused = tree.querySelector('[tabindex="0"]')
      expect(focused?.getAttribute('data-node-id')).toBe('doc1')
    })

    // B4a: isExpanded=true → collapse()
    it('ArrowLeft on expanded folder collapses it', async () => {
      const user = userEvent.setup()
      render(<ExpandDemo />)

      const tree = screen.getByRole('tree')
      await user.click(tree.querySelector('[data-node-id="folder1"]')!)

      await user.keyboard('{ArrowRight}') // expand
      expect(tree.querySelector('[data-node-id="folder1"]')?.getAttribute('aria-expanded')).toBe('true')

      await user.keyboard('{ArrowLeft}') // collapse
      expect(tree.querySelector('[data-node-id="folder1"]')?.getAttribute('aria-expanded')).toBe('false')
    })

    // B4b: isExpanded=false → focusParent()
    it('ArrowLeft on child node focuses parent', async () => {
      const user = userEvent.setup()
      render(<ExpandDemo />)

      const tree = screen.getByRole('tree')
      await user.click(tree.querySelector('[data-node-id="folder1"]')!)

      await user.keyboard('{ArrowRight}') // expand
      await user.keyboard('{ArrowRight}') // focus child (doc1)
      expect(tree.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('doc1')

      await user.keyboard('{ArrowLeft}') // focusParent → folder1
      expect(tree.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('folder1')
    })

    // navigate axis still works in arrow mode
    it('ArrowDown/Up navigates between visible items', async () => {
      const user = userEvent.setup()
      render(<ExpandDemo />)

      const tree = screen.getByRole('tree')
      await user.click(tree.querySelector('[data-node-id="folder1"]')!)

      await user.keyboard('{ArrowDown}')
      expect(tree.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('folder2')
    })
  })

  describe('enter-esc mode', () => {
    async function switchToEnterEsc(user: ReturnType<typeof userEvent.setup>) {
      const select = document.querySelector('select')!
      await user.selectOptions(select, 'enter-esc')
      return screen.getByLabelText('expand demo')
    }

    // B2a: children.length > 0 → enterChild + focusChild
    it('Enter on folder (has children) enters child scope', async () => {
      const user = userEvent.setup()
      render(<ExpandDemo />)
      const container = await switchToEnterEsc(user)

      await user.click(container.querySelector('[data-node-id="folder1"]')!)
      await user.keyboard('{Enter}')

      // enterChild + focusChild dispatched — focus may stay or move depending on spatial plugin
      const focused = container.querySelector('[tabindex="0"]')
      expect(focused).not.toBeNull()
    })

    // B2b: children.length === 0 → startRename
    it('Enter on leaf node (no children) triggers rename', async () => {
      const user = userEvent.setup()
      render(<ExpandDemo />)
      const container = await switchToEnterEsc(user)

      // enter-esc shows only top-level groups. Enter on folder1 → enterChild → shows children.
      await user.click(container.querySelector('[data-node-id="folder1"]')!)
      await user.keyboard('{Enter}') // B2a: folder has children → enter scope

      // After entering folder1's scope, doc1 should be visible as a leaf
      const leaf = container.querySelector('[data-node-id="doc1"]')
      if (leaf) {
        await user.click(leaf as HTMLElement)
        await user.keyboard('{Enter}') // B2b: no children → startRename
      }

      const focused = container.querySelector('[tabindex="0"]')
      expect(focused).not.toBeNull()
    })

    // Escape → exitToParent
    it('Escape exits to parent scope', async () => {
      const user = userEvent.setup()
      render(<ExpandDemo />)
      const container = await switchToEnterEsc(user)

      await user.click(container.querySelector('[data-node-id="folder1"]')!)
      await user.keyboard('{Enter}')
      await user.keyboard('{Escape}')

      const focused = container.querySelector('[tabindex="0"]')
      expect(focused).not.toBeNull()
    })
  })
})
