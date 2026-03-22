import { describe, it, expect, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CmsLayout from '../pages/cms/CmsLayout'
import { resetCmsData } from '../pages/cms/cms-state'

function getFocused(container: HTMLElement): string {
  return container.querySelector('[tabindex="0"][data-cms-id]')?.getAttribute('data-cms-id') ?? ''
}

describe('CMS Tab Container', () => {
  beforeEach(() => { resetCmsData() })

  describe('navigation', () => {
    it('Enter on tab-group focuses first tab-item', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')

      expect(getFocused(container)).toBe('tab-1')
    })

    it('Arrow Right moves to next tab and switches panel', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')
      expect(getFocused(container)).toBe('tab-1')

      await user.keyboard('{ArrowRight}')
      expect(getFocused(container)).toBe('tab-2')

      // Tab 2's panel should now be visible
      const visiblePanel = container.querySelector('[role="tabpanel"]') as HTMLElement
      expect(visiblePanel).not.toBeNull()
      expect(visiblePanel.querySelector('[data-cms-id="tab-2-section"]')).not.toBeNull()
    })

    it('Arrow Left moves to previous tab', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')
      await user.keyboard('{ArrowRight}')
      expect(getFocused(container)).toBe('tab-2')

      await user.keyboard('{ArrowLeft}')
      expect(getFocused(container)).toBe('tab-1')
    })

    it('Enter on tab-item enters its panel first section', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')  // → tab-1
      await user.keyboard('{Enter}')  // → tab-1-section

      expect(getFocused(container)).toBe('tab-1-section')
    })

    it('Escape from panel section returns to tab-item', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')  // → tab-1
      await user.keyboard('{Enter}')  // → tab-1-section

      await user.keyboard('{Escape}') // → back to tab-1
      expect(getFocused(container)).toBe('tab-1')
    })

    it('Escape from tab-item returns to tab-group', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')
      expect(getFocused(container)).toBe('tab-1')

      await user.keyboard('{Escape}')
      expect(getFocused(container)).toBe('tab-group-1')
    })
  })

  describe('tab selection', () => {
    it('only active tab panel content is rendered', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')

      // Tab 1 active by default — its section visible
      expect(container.querySelector('[data-cms-id="tab-1-section"]')).not.toBeNull()
      // Tab 2 section NOT rendered
      expect(container.querySelector('[data-cms-id="tab-2-section"]')).toBeNull()
    })

    it('clicking tab switches panel', async () => {
      const { container } = render(<CmsLayout />)

      const tab2 = container.querySelector('[data-cms-id="tab-2"]') as HTMLElement
      act(() => { tab2.click() })

      // Tab 2 panel now visible
      expect(container.querySelector('[data-cms-id="tab-2-section"]')).not.toBeNull()
      // Tab 1 panel hidden
      expect(container.querySelector('[data-cms-id="tab-1-section"]')).toBeNull()
    })

    it('aria-selected reflects active tab', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')

      const tab1 = container.querySelector('[data-cms-id="tab-1"]') as HTMLElement
      const tab2 = container.querySelector('[data-cms-id="tab-2"]') as HTMLElement
      expect(tab1.getAttribute('aria-selected')).toBe('true')
      expect(tab2.getAttribute('aria-selected')).toBe('false')

      await user.keyboard('{ArrowRight}')
      expect(tab1.getAttribute('aria-selected')).toBe('false')
      expect(tab2.getAttribute('aria-selected')).toBe('true')
    })
  })

  describe('CRUD', () => {
    it('Delete on tab-item removes tab (min 1 guard)', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')

      // 3 tabs initially
      expect(container.querySelectorAll('[role="tab"]').length).toBe(3)

      // Delete tab-1
      await user.keyboard('{Delete}')
      expect(container.querySelectorAll('[role="tab"]').length).toBe(2)

      // Delete again
      await user.keyboard('{Delete}')
      expect(container.querySelectorAll('[role="tab"]').length).toBe(1)

      // Last tab — Delete ignored
      await user.keyboard('{Delete}')
      expect(container.querySelectorAll('[role="tab"]').length).toBe(1)
    })
  })

  describe('inline edit', () => {
    it('F2 on tab-item starts label inline editing', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')
      expect(getFocused(container)).toBe('tab-1')

      await user.keyboard('{F2}')
      expect(container.querySelector('[contenteditable]')).not.toBeNull()
    })
  })

  describe('sidebar tab integration', () => {
    it('sidebar lists tab-internal sections as focusable items', () => {
      const { container } = render(<CmsLayout />)
      const sidebar = container.querySelector('[role="listbox"]') as HTMLElement
      const items = sidebar.querySelectorAll('[role="option"]')
      const ids = Array.from(items).map(el => el.getAttribute('data-sidebar-id'))
      expect(ids).toContain('tab-1-section')
      expect(ids).toContain('tab-2-section')
      expect(ids).toContain('tab-3-section')
      expect(ids).not.toContain('tab-group-1')
    })

    it('sidebar ↑↓ navigates through tab-internal sections', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)
      const sidebar = container.querySelector('[role="listbox"]') as HTMLElement

      // Focus the first option (roving tabindex — one option has tabIndex=0)
      const firstOption = sidebar.querySelector('[role="option"][tabindex="0"]') as HTMLElement
      firstOption.focus()

      // Navigate down to reach tab sections (hero → stats → features → tab-1-section)
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
      const focused = sidebar.querySelector('[data-focused]')
      expect(focused?.getAttribute('data-sidebar-id')).toBe('tab-1-section')
    })
  })
})
