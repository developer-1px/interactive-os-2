/**
 * ⑧ /do screen tests — /ax-principles
 *
 * Integration test: user input (click/keyboard/type) → DOM state.
 * No mock assertions (toHaveBeenCalled). Every assertion checks a real
 * visible DOM change driven by Agent 1+2 store commands + selectors.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PageAxPrinciples from './PageAxPrinciples'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Query all ListBox options (principle rows in the Master pane). */
function getPrincipleOptions(): HTMLElement[] {
  return screen.queryAllByRole('option')
}

/** Query a filter-group toggle button by its visible label (Exposed, P1, quantitative, …). */
function getFilterButton(name: string): HTMLElement {
  return screen.getByRole('button', { name })
}

/** Text inside the Detail pane's PanelHeader — identifies the currently displayed principle. */
function getDetailHeadingText(): string {
  // PrincipleDetail renders PanelHeader with a `ts-section` span containing `${id} ${name}`.
  const el = document.querySelector<HTMLElement>('.ts-section')
  return el?.textContent ?? ''
}

/** Find a principle option element by its P-id prefix. */
function findOptionByPrincipleId(id: string): HTMLElement | undefined {
  return getPrincipleOptions().find((el) => el.textContent?.startsWith(id))
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe('/ax-principles — screen integration', () => {
  it('smoke — 20 principles listed + first principle detail shown', () => {
    render(<PageAxPrinciples />)

    const options = getPrincipleOptions()
    expect(options.length).toBe(20)

    // First option is P-01
    expect(options[0].textContent).toContain('P-01')
    expect(options[0].textContent).toContain('Role')

    // Detail pane heading shows P-01 (default selection)
    expect(getDetailHeadingText()).toContain('P-01')
    expect(getDetailHeadingText()).toContain('Role')

    // Header count label: "20 principles"
    expect(screen.getByText('20 principles')).toBeTruthy()
  })

  it('selection changes when a different option is clicked', async () => {
    const user = userEvent.setup()
    render(<PageAxPrinciples />)

    const p02 = findOptionByPrincipleId('P-02')
    expect(p02).toBeTruthy()

    await user.click(p02!)

    // Detail pane heading now shows P-02 (Size Ladder SSOT)
    expect(getDetailHeadingText()).toContain('P-02')
    expect(getDetailHeadingText()).toContain('Size Ladder')
  })

  it('Status filter "Exposed" reduces list to 5 principles', async () => {
    const user = userEvent.setup()
    render(<PageAxPrinciples />)

    expect(getPrincipleOptions().length).toBe(20)

    await user.click(getFilterButton('Exposed'))

    const remaining = getPrincipleOptions()
    expect(remaining.length).toBe(5)

    const ids = remaining.map((el) => el.textContent ?? '')
    for (const id of ['P-02', 'P-08', 'P-14', 'P-19', 'P-20']) {
      expect(ids.some((t) => t.includes(id))).toBe(true)
    }

    // Header count reflects filter
    expect(screen.getByText('5 principles')).toBeTruthy()
  })

  it('Tag filter "quantitative" reduces list to 9 principles', async () => {
    const user = userEvent.setup()
    render(<PageAxPrinciples />)

    await user.click(getFilterButton('quantitative'))

    // Fixtures contain 9 principles tagged "quantitative":
    // P-02, P-03, P-06, P-08, P-09, P-10, P-15, P-16, P-19
    const remaining = getPrincipleOptions()
    expect(remaining.length).toBe(9)

    const text = remaining.map((el) => el.textContent ?? '').join('|')
    for (const id of ['P-02', 'P-03', 'P-06', 'P-08', 'P-09', 'P-10', 'P-15', 'P-16', 'P-19']) {
      expect(text).toContain(id)
    }
  })

  it('Priority filter "P1" reduces list to 3 principles', async () => {
    const user = userEvent.setup()
    render(<PageAxPrinciples />)

    await user.click(getFilterButton('P1'))

    const remaining = getPrincipleOptions()
    expect(remaining.length).toBe(3)

    const text = remaining.map((el) => el.textContent ?? '').join('|')
    expect(text).toContain('P-02')
    expect(text).toContain('P-03')
    expect(text).toContain('P-08')
  })

  it('Search "OKLCH" narrows list to color-related principles', async () => {
    const user = userEvent.setup()
    render(<PageAxPrinciples />)

    const searchInput = screen.getByRole('textbox', { name: 'Search principles' })
    await user.click(searchInput)
    await user.keyboard('OKLCH')

    const remaining = getPrincipleOptions()
    // P-05 (mentions OKLCH in definition) + P-15 (Perceptual Color Space (OKLCH))
    expect(remaining.length).toBe(2)
    const text = remaining.map((el) => el.textContent ?? '').join('|')
    expect(text).toContain('P-05')
    expect(text).toContain('P-15')
  })

  it('Clear all restores the full 20-principle list after filters are applied', async () => {
    const user = userEvent.setup()
    render(<PageAxPrinciples />)

    // Apply two filters — Status + Priority. Intersection = {P-02, P-08} (both Exposed & P1).
    await user.click(getFilterButton('Exposed'))
    await user.click(getFilterButton('P1'))

    expect(getPrincipleOptions().length).toBeLessThan(20)

    // Clear-all button is rendered because at least one filter is active
    const clearBtn = screen.getByRole('button', { name: 'Clear all' })
    await user.click(clearBtn)

    // Full set restored
    expect(getPrincipleOptions().length).toBe(20)
    expect(screen.getByText('20 principles')).toBeTruthy()
  })

  it('keyboard ArrowDown moves focus to P-02 and updates the Detail pane', async () => {
    const user = userEvent.setup()
    render(<PageAxPrinciples />)

    const first = getPrincipleOptions()[0]
    act(() => { first.focus() })

    await user.keyboard('{ArrowDown}')

    // P-02 is now focused (roving-tabindex)
    const focused = document.querySelector<HTMLElement>('[role="option"][tabindex="0"]')
    expect(focused?.textContent).toContain('P-02')

    // Detail pane heading updates (onFocusChange dispatches select)
    expect(getDetailHeadingText()).toContain('P-02')
  })
})
