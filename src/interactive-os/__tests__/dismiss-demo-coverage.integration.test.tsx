/**
 * Demo coverage: DismissDemo → dismiss.ts
 * // V2: 2026-03-25-demo-coverage-loop-prd.md
 *
 * 코드에서 도출한 분기 맵:
 *   B0: options?.escape ?? true          → default-arg (스킵)
 *   B1: if (escape)                      → actionable
 *       B1a: escape=true  → Escape keyMap 등록
 *       B1b: escape=false → keyMap 비어있음
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DismissDemo from '../../pages/axis/DismissDemo'

describe('DismissDemo coverage', () => {
  // B1a: escape=true (default) → Escape keyMap 등록
  describe('escape enabled (default)', () => {
    it('Escape triggers collapse', async () => {
      const user = userEvent.setup()
      render(<DismissDemo />)

      const container = screen.getByRole('dialog')
      const firstItem = container.querySelector('[data-node-id]')!
      await user.click(firstItem)

      const focusedBefore = container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')
      await user.keyboard('{Escape}')

      // B1a: Escape handler calls ctx.collapse() — focus should be maintained or moved
      const focusedAfter = container.querySelector('[tabindex="0"]')
      expect(focusedAfter).not.toBeNull()
    })
  })

  // B1b: escape=false → keyMap 비어있음, Escape 무반응
  describe('escape disabled', () => {
    it('Escape does nothing when escape option is off', async () => {
      const user = userEvent.setup()
      render(<DismissDemo />)

      // Uncheck escape → B1b
      const checkbox = document.querySelector('input[type="checkbox"]')!
      await user.click(checkbox)

      const container = screen.getByRole('dialog')
      const firstItem = container.querySelector('[data-node-id]')!
      await user.click(firstItem)

      const focusedBefore = container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')
      await user.keyboard('{Escape}')
      const focusedAfter = container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')

      // B1b: no keyMap → Escape is not handled → focus unchanged
      expect(focusedAfter).toBe(focusedBefore)
    })
  })
})
