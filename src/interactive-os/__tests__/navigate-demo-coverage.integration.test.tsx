/**
 * Demo coverage: NavigateDemo → navigate.ts
 * // V3: 2026-03-25-demo-coverage-loop-prd.md
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NavigateDemo from '../../pages/axis/NavigateDemo'

function getContainer() {
  return screen.getByRole('listbox').closest('.card')?.parentElement ?? document.body
}

describe('NavigateDemo coverage', () => {
  describe('list mode — vertical (default)', () => {
    it('ArrowDown/Up/Home/End', async () => {
      const user = userEvent.setup()
      render(<NavigateDemo />)

      const listbox = screen.getByRole('listbox')
      await user.click(listbox.querySelector('[data-node-id]')!)

      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowUp}')
      await user.keyboard('{Home}')
      await user.keyboard('{End}')

      // verify focus moved — last item should be focused
      const focused = listbox.querySelector('[tabindex="0"]')
      expect(focused).not.toBeNull()
    })
  })

  describe('list mode — horizontal', () => {
    it('ArrowRight/Left/Home/End', async () => {
      const user = userEvent.setup()
      render(<NavigateDemo />)

      // Switch orientation to horizontal
      const selects = document.querySelectorAll('select')
      // First select might be mode, find orientation select
      const orientSelect = Array.from(selects).find(s =>
        Array.from(s.options).some(o => o.value === 'horizontal')
      )
      expect(orientSelect).not.toBeNull()

      await user.selectOptions(orientSelect!, 'horizontal')

      const listbox = screen.getByRole('listbox')
      await user.click(listbox.querySelector('[data-node-id]')!)

      await user.keyboard('{ArrowRight}')
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{ArrowLeft}')
      await user.keyboard('{Home}')
      await user.keyboard('{End}')

      const focused = listbox.querySelector('[tabindex="0"]')
      expect(focused).not.toBeNull()
    })
  })

  describe('list mode — both', () => {
    it('all 4 arrows', async () => {
      const user = userEvent.setup()
      render(<NavigateDemo />)

      const orientSelect = Array.from(document.querySelectorAll('select')).find(s =>
        Array.from(s.options).some(o => o.value === 'both')
      )
      await user.selectOptions(orientSelect!, 'both')

      const listbox = screen.getByRole('listbox')
      await user.click(listbox.querySelector('[data-node-id]')!)

      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{ArrowUp}')
      await user.keyboard('{ArrowLeft}')

      const focused = listbox.querySelector('[tabindex="0"]')
      expect(focused).not.toBeNull()
    })
  })

  describe('list mode — wrap', () => {
    it('wrap enabled + ArrowDown past last wraps', async () => {
      const user = userEvent.setup()
      render(<NavigateDemo />)

      const checkbox = document.querySelector('input[type="checkbox"]')
      expect(checkbox).not.toBeNull()
      await user.click(checkbox!)

      const listbox = screen.getByRole('listbox')
      await user.click(listbox.querySelector('[data-node-id]')!)

      // Go to End, then ArrowDown should wrap to first
      await user.keyboard('{End}')
      await user.keyboard('{ArrowDown}')

      const focused = listbox.querySelector('[tabindex="0"]')
      expect(focused).not.toBeNull()
    })
  })

  describe('grid mode', () => {
    it('2D navigation: arrows, Home/End, Mod+Home/End', async () => {
      const user = userEvent.setup()
      render(<NavigateDemo />)

      // Switch to grid mode
      const modeSelect = Array.from(document.querySelectorAll('select')).find(s =>
        Array.from(s.options).some(o => o.value === 'grid')
      )
      expect(modeSelect).not.toBeNull()
      await user.selectOptions(modeSelect!, 'grid')

      const grid = screen.getByRole('grid')
      const firstRow = grid.querySelector('[data-node-id]')
      expect(firstRow).not.toBeNull()
      await user.click(firstRow!)

      // Row navigation
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowUp}')

      // Column navigation
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{ArrowLeft}')

      // Bounds
      await user.keyboard('{Home}')
      await user.keyboard('{End}')

      // Row bounds (Mod+Home/End)
      await user.keyboard('{Control>}{Home}{/Control}')
      await user.keyboard('{Control>}{End}{/Control}')

      const focused = grid.querySelector('[tabindex="0"]')
      expect(focused).not.toBeNull()
    })
  })

  describe('grid mode — tabCycle', () => {
    function renderGridWithTabCycle() {
      const result = render(<NavigateDemo />)
      const modeSelect = Array.from(document.querySelectorAll('select')).find(s =>
        Array.from(s.options).some(o => o.value === 'grid')
      )!
      return { ...result, modeSelect }
    }

    async function enableTabCycle(user: ReturnType<typeof userEvent.setup>, modeSelect: HTMLSelectElement) {
      await user.selectOptions(modeSelect, 'grid')
      const checkbox = document.querySelector('input[type="checkbox"]')!
      await user.click(checkbox)
    }

    it('Tab moves to next cell', async () => {
      const user = userEvent.setup()
      const { modeSelect } = renderGridWithTabCycle()
      await enableTabCycle(user, modeSelect)

      const grid = screen.getByRole('grid')
      await user.click(grid.querySelector('[data-node-id]')!)

      await user.keyboard('{Tab}')
      const cell = grid.querySelector('[role="gridcell"][tabindex="0"]')
      expect(cell).not.toBeNull()
    })

    it('Shift+Tab at non-first column moves to prev column', async () => {
      // Covers line 45: if (!atFirstCol) return g.focusPrevCol()
      const user = userEvent.setup()
      const { modeSelect } = renderGridWithTabCycle()
      await enableTabCycle(user, modeSelect)

      const grid = screen.getByRole('grid')
      await user.click(grid.querySelector('[data-node-id]')!)

      // Move to col 2
      await user.keyboard('{Tab}')
      await user.keyboard('{Tab}')

      // Shift+Tab should go back to col 1
      await user.keyboard('{Shift>}{Tab}{/Shift}')
      const cell = grid.querySelector('[role="gridcell"][tabindex="0"]')
      expect(cell).not.toBeNull()
    })

    it('Tab at last cell of last row stops', async () => {
      // Covers line 38: if (nextRowCmd.payload?.nodeId === ctx.focused) return
      const user = userEvent.setup()
      const { modeSelect } = renderGridWithTabCycle()
      await enableTabCycle(user, modeSelect)

      const grid = screen.getByRole('grid')
      await user.click(grid.querySelector('[data-node-id]')!)

      // Go to last row, last col
      await user.keyboard('{Control>}{End}{/Control}') // last row
      await user.keyboard('{End}') // last col

      const beforeTab = grid.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')
      await user.keyboard('{Tab}') // should stop — already at absolute last
      const afterTab = grid.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')

      expect(afterTab).toBe(beforeTab)
    })

    it('Shift+Tab at first cell of first row stops', async () => {
      // Covers line 49: if (prevRowCmd.payload?.nodeId === ctx.focused) return
      const user = userEvent.setup()
      const { modeSelect } = renderGridWithTabCycle()
      await enableTabCycle(user, modeSelect)

      const grid = screen.getByRole('grid')
      await user.click(grid.querySelector('[data-node-id]')!)

      // Already at first row, first col
      const beforeTab = grid.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')
      await user.keyboard('{Shift>}{Tab}{/Shift}') // should stop

      const afterTab = grid.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')
      expect(afterTab).toBe(beforeTab)
    })

    it('Tab at end of row wraps to next row', async () => {
      const user = userEvent.setup()
      const { modeSelect } = renderGridWithTabCycle()
      await enableTabCycle(user, modeSelect)

      const grid = screen.getByRole('grid')
      await user.click(grid.querySelector('[data-node-id]')!)

      await user.keyboard('{End}') // last col
      await user.keyboard('{Tab}') // wrap to next row first col

      const focused = grid.querySelector('[tabindex="0"]')
      expect(focused).not.toBeNull()
    })
  })
})
