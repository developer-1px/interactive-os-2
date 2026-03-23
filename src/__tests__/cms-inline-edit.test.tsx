import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CmsLayout from '../pages/cms/CmsLayout'

function getFocused(): string {
  return document.activeElement?.getAttribute('data-cms-id') ?? ''
}

describe('CMS inline edit', () => {
  it('Enter on leaf node starts inline editing', async () => {
    const user = userEvent.setup()
    const { container } = render(<CmsLayout />)

    // hero-badge is a leaf node with type 'badge' (has editable fields)
    // First drill into hero section
    const hero = container.querySelector('[data-cms-id="hero"]') as HTMLElement
    hero.focus()
    await user.keyboard('{Enter}')
    expect(getFocused()).toBe('hero-badge')

    // Now focus the badge and press Enter to start rename
    const badge = container.querySelector('[data-cms-id="hero-badge"]') as HTMLElement
    badge.focus()
    await user.keyboard('{Enter}')
    expect(container.querySelector('[contenteditable]')).not.toBeNull()
  })

  it('Enter on container node does NOT start inline editing', async () => {
    const user = userEvent.setup()
    const { container } = render(<CmsLayout />)

    // hero is a container node (has children) — Enter should drill in, not edit
    const hero = container.querySelector('[data-cms-id="hero"]') as HTMLElement
    hero.focus()
    await user.keyboard('{Enter}')

    // Should drill into hero, not start editing
    expect(container.querySelector('[contenteditable]')).toBeNull()
    expect(getFocused()).toBe('hero-badge')
  })

  it('inline edit → type → Enter confirms and updates text', async () => {
    const user = userEvent.setup()
    const { container } = render(<CmsLayout />)

    // Navigate to hero-badge
    const hero = container.querySelector('[data-cms-id="hero"]') as HTMLElement
    hero.focus()
    await user.keyboard('{Enter}')

    const badge = container.querySelector('[data-cms-id="hero-badge"]') as HTMLElement
    badge.focus()
    await user.keyboard('{Enter}')

    const editable = container.querySelector('[contenteditable]') as HTMLElement
    expect(editable).not.toBeNull()

    // Change text and confirm
    editable.textContent = 'New Badge Text'
    await user.keyboard('{Enter}')

    expect(container.querySelector('[contenteditable]')).toBeNull()
    expect(badge.textContent).toContain('New Badge Text')
  })

  it('inline edit → Escape cancels and restores original text', async () => {
    const user = userEvent.setup()
    const { container } = render(<CmsLayout />)

    // Navigate to hero-badge
    const hero = container.querySelector('[data-cms-id="hero"]') as HTMLElement
    hero.focus()
    await user.keyboard('{Enter}')

    const badge = container.querySelector('[data-cms-id="hero-badge"]') as HTMLElement
    const originalText = badge.textContent
    badge.focus()
    await user.keyboard('{Enter}')

    const editable = container.querySelector('[contenteditable]') as HTMLElement
    editable.textContent = 'Changed'
    await user.keyboard('{Escape}')

    expect(container.querySelector('[contenteditable]')).toBeNull()
    expect(badge.textContent).toBe(originalText)
  })

  it('Enter on icon node (leaf, no editable text fields) does nothing', async () => {
    const user = userEvent.setup()
    const { container } = render(<CmsLayout />)

    // Navigate: features → Enter → click card-store → Enter → card-store-icon
    const features = container.querySelector('[data-cms-id="features"]') as HTMLElement
    features.focus()
    await user.keyboard('{Enter}')

    const cardStore = container.querySelector('[data-cms-id="card-store"]') as HTMLElement
    act(() => { cardStore.click() })
    cardStore.focus()
    await user.keyboard('{Enter}')

    // Now at card-store-icon (type: 'icon', no editable fields)
    expect(getFocused()).toBe('card-store-icon')
    const icon = container.querySelector('[data-cms-id="card-store-icon"]') as HTMLElement
    icon.focus()
    await user.keyboard('{Enter}')

    // Should NOT start editing since icon has no editable fields
    expect(container.querySelector('[contenteditable]')).toBeNull()
  })
})
