import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CmsLayout from '/Users/user/Desktop/aria/src/pages/cms/CmsLayout'
import { resetCmsData } from '/Users/user/Desktop/aria/src/pages/cms/cms-state'

describe('debug sidebar', () => {
  beforeEach(() => { resetCmsData() })

  it('confirms order of sidebar options', async () => {
    const { container } = render(<CmsLayout />)
    const sidebar = container.querySelector('[role="listbox"]') as HTMLElement
    const allOptions = sidebar.querySelectorAll('[role="option"]')
    const ids = Array.from(allOptions).map(el => el.getAttribute('data-sidebar-id'))
    // Verify the full list includes tab-internal sections
    expect(ids[0]).toBe('hero')
    expect(ids[1]).toBe('stats')
    expect(ids[2]).toBe('features')
    expect(ids[3]).toBe('tab-1-section')
    expect(ids[4]).toBe('tab-2-section')
    expect(ids[5]).toBe('tab-3-section')
  })

  it('what has tabindex=0 after 3 ArrowDowns', async () => {
    const user = userEvent.setup()
    const { container } = render(<CmsLayout />)
    const sidebar = container.querySelector('[role="listbox"]') as HTMLElement

    const firstOption = sidebar.querySelector('[role="option"][tabindex="0"]') as HTMLElement
    firstOption.focus()

    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')

    // Check all options' tabindex after navigation
    const allOptions = sidebar.querySelectorAll('[role="option"]')
    const tabindexZeroItems = Array.from(allOptions)
      .filter(el => el.getAttribute('tabindex') === '0')
      .map(el => el.getAttribute('data-sidebar-id'))

    // There should be exactly one item with tabindex=0
    expect(tabindexZeroItems.length).toBe(1)
    expect(tabindexZeroItems[0]).toBe('tab-1-section')
  })
})
