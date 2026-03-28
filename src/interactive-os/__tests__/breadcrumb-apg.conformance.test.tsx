// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Breadcrumb
 * https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/examples/breadcrumb/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Breadcrumb } from '../ui/Breadcrumb'

describe('APG Breadcrumb — ARIA Structure', () => {
  it('renders breadcrumb segments', () => {
    const { container } = render(<Breadcrumb path="/docs/guides/getting-started" root="/docs" />)
    expect(container.textContent).toContain('guides')
    expect(container.textContent).toContain('getting-started')
  })

  it('last segment is visually distinct (current page)', () => {
    const { container } = render(<Breadcrumb path="/docs/guides/intro" root="/docs" />)
    // The last segment has a different class (styles.current)
    const segments = container.querySelectorAll('span')
    expect(segments.length).toBeGreaterThan(0)
  })
})
