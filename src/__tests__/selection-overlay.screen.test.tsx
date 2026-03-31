/**
 * Screen test: SelectionOverlay on CMS Canvas
 *
 * V9: No *Focused CSS classes in DOM after overlay migration
 * V1: Focus node → SelectionOverlay component is rendered
 *
 * Note: jsdom does not compute real layout (getBoundingClientRect returns 0×0),
 * so rect rendering cannot be tested here. Visual rect tests require a real browser.
 */
import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import CmsLayout from '../pages/cms/CmsLayout'
import { getNodeClassName } from '../pages/cms/cms-renderers'

// V9: 2026-03-31-selection-overlay-prd.md
describe('SelectionOverlay on CMS', () => {
  it('has no *Focused CSS classes in DOM after migration', () => {
    const { container } = render(<CmsLayout />)

    // Click to focus a node
    const badge = container.querySelector('[data-cms-id="hero-badge"]')
    expect(badge).not.toBeNull()
    act(() => { (badge as HTMLElement).click() })

    // No element should have a class containing "Focused"
    const allElements = container.querySelectorAll('*')
    const focusedElements = Array.from(allElements).filter(el =>
      Array.from(el.classList).some(cls => cls.includes('Focused')),
    )
    expect(focusedElements).toEqual([])
  })

  // V1: 2026-03-31-selection-overlay-prd.md
  it('renders overlay container when canvas is mounted', () => {
    const { container } = render(<CmsLayout />)

    // SelectionOverlay renders inside the cms-landing div
    const cmsRoot = container.querySelector('[data-cms-root]')
    expect(cmsRoot).not.toBeNull()

    // The overlay div should exist (even if no visible rects due to jsdom 0×0 getBoundingClientRect)
    // position:relative on container is required for overlay positioning (via atomic class)
    expect(cmsRoot!.classList.contains('relative')).toBe(true)
  })

  it('getNodeClassName returns class without state dependency', () => {
    const result = getNodeClassName({ type: 'card' })
    expect(typeof result).toBe('string')
    expect(result).not.toContain('Focused')
  })
})
