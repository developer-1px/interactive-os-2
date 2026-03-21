import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CmsLayout from '../pages/cms/CmsLayout'

describe('CMS Detail Panel', () => {
  it('shows editable fields when a leaf node is focused', async () => {
    const { container } = render(<CmsLayout />)

    // Click on hero-badge to focus it
    const badge = container.querySelector('[data-cms-id="hero-badge"]')
    expect(badge).not.toBeNull()
    act(() => { (badge as HTMLElement).click() })

    const panel = container.querySelector('.cms-detail-panel')
    expect(panel).not.toBeNull()
    const inputs = panel!.querySelectorAll('input')
    expect(inputs.length).toBeGreaterThan(0)
  })

  it('shows grouped fields on initial render (section auto-focused by spatial)', () => {
    const { container } = render(<CmsLayout />)
    const panel = container.querySelector('.cms-detail-panel')
    expect(panel).not.toBeNull()
    // Spatial behavior auto-focuses first section (hero) which has child fields
    const inputs = panel!.querySelectorAll('input')
    expect(inputs.length).toBeGreaterThan(0)
  })

  it('form edit then blur updates canvas text', async () => {
    const user = userEvent.setup()
    const { container } = render(<CmsLayout />)

    const badge = container.querySelector('[data-cms-id="hero-badge"]')
    act(() => { (badge as HTMLElement).click() })

    const panel = container.querySelector('.cms-detail-panel')!
    const input = panel.querySelector('input')!

    await user.clear(input)
    await user.type(input, 'Updated Badge')
    await user.tab() // blur to commit

    expect(badge!.textContent).toContain('Updated Badge')
  })

  it('updates panel content when canvas focus changes', async () => {
    const { container } = render(<CmsLayout />)

    const badge = container.querySelector('[data-cms-id="hero-badge"]')
    act(() => { (badge as HTMLElement).click() })

    const panel = container.querySelector('.cms-detail-panel')!
    const firstInput = panel.querySelector('input')
    const firstValue = firstInput?.value

    const title = container.querySelector('[data-cms-id="hero-title"]')
    act(() => { (title as HTMLElement).click() })

    const updatedInput = panel.querySelector('input')
    expect(updatedInput?.value).not.toBe(firstValue)
  })

  // ── Container editing tests ──

  it('shows grouped fields when a card container is focused', async () => {
    const { container } = render(<CmsLayout />)

    // Focus features section first, then enter to card depth
    const features = container.querySelector('[data-cms-id="features"]') as HTMLElement
    act(() => { features.click() })

    // Navigate into features → card-store
    const cardStore = container.querySelector('[data-cms-id="card-store"]') as HTMLElement
    act(() => { cardStore.click() })

    const panel = container.querySelector('.cms-detail-panel')!
    // Card has children: icon (no fields), title (1 field), desc (1 field) → 2 inputs
    const inputs = panel.querySelectorAll('input')
    expect(inputs.length).toBe(2)

    // Should show group with label (card title text)
    const groupLabel = panel.querySelector('.cms-detail-group__label')
    expect(groupLabel).not.toBeNull()
    expect(groupLabel!.textContent).toContain('Normalized Store')
  })

  it('shows all grouped fields when a section is focused', async () => {
    const { container } = render(<CmsLayout />)

    // Focus on stats section (4 stat containers, each with value + label = 8 fields)
    const stats = container.querySelector('[data-cms-id="stats"]') as HTMLElement
    act(() => { stats.click() })

    const panel = container.querySelector('.cms-detail-panel')!
    const inputs = panel.querySelectorAll('input')
    // stats section: no section headers, 4 stats × (value + label) = 8 fields
    expect(inputs.length).toBe(8)

    // Should have 4 groups (one per stat container)
    const groups = panel.querySelectorAll('.cms-detail-group')
    expect(groups.length).toBe(4)
  })

  it('section focus shows section header fields + sub-container groups', async () => {
    const { container } = render(<CmsLayout />)

    const features = container.querySelector('[data-cms-id="features"]') as HTMLElement
    act(() => { features.click() })

    const panel = container.querySelector('.cms-detail-panel')!
    const inputs = panel.querySelectorAll('input')
    // features: header (label + title + desc = 3) + 4 cards × (title + desc = 2) = 11
    expect(inputs.length).toBe(11)

    // 5 groups: 1 header group + 4 card groups
    const groups = panel.querySelectorAll('.cms-detail-group')
    expect(groups.length).toBe(5)
  })

  it('container panel edit updates canvas text via rename', async () => {
    const user = userEvent.setup()
    const { container } = render(<CmsLayout />)

    // Focus card-store container
    const cardStore = container.querySelector('[data-cms-id="card-store"]') as HTMLElement
    act(() => { cardStore.click() })

    const panel = container.querySelector('.cms-detail-panel')!
    const inputs = panel.querySelectorAll('input')
    // First input should be the title field
    const titleInput = inputs[0]

    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Store Title')
    await user.tab()

    // Canvas text should reflect the change
    const titleNode = container.querySelector('[data-cms-id="card-store-title"]')
    expect(titleNode!.textContent).toContain('Updated Store Title')
  })

  it('narrows panel scope when entering card depth from section', async () => {
    const { container } = render(<CmsLayout />)

    // Focus section → see all 11 fields
    const features = container.querySelector('[data-cms-id="features"]') as HTMLElement
    act(() => { features.click() })

    const panel = container.querySelector('.cms-detail-panel')!
    expect(panel.querySelectorAll('input').length).toBe(11)

    // Click into a specific card → scope narrows
    const cardStore = container.querySelector('[data-cms-id="card-store"]') as HTMLElement
    act(() => { cardStore.click() })

    expect(panel.querySelectorAll('input').length).toBe(2)
  })

  // V4: Escape widens panel scope back to section
  it('widens panel scope when escaping from card to section', async () => {
    const user = userEvent.setup()
    const { container } = render(<CmsLayout />)

    // Enter features section
    const features = container.querySelector('[data-cms-id="features"]') as HTMLElement
    await user.click(features)

    // Enter card depth
    const cardStore = container.querySelector('[data-cms-id="card-store"]') as HTMLElement
    await user.click(cardStore)

    const panel = container.querySelector('.cms-detail-panel')!
    expect(panel.querySelectorAll('input').length).toBe(2)

    // Escape back to section
    await user.keyboard('{Escape}')

    // Panel should widen to section scope
    expect(panel.querySelectorAll('input').length).toBe(11)
  })

  // V6: undo via Mod+Z — skipped in jsdom (Cmd+Z keyboard dispatch limitation)
  // Verified via existing history plugin unit tests + manual browser testing

  // V8: patterns section → 17 fields scrollable
  it('shows all 17 fields for patterns section', async () => {
    const { container } = render(<CmsLayout />)

    const patterns = container.querySelector('[data-cms-id="patterns"]') as HTMLElement
    act(() => { patterns.click() })

    const panel = container.querySelector('.cms-detail-panel')!
    const inputs = panel.querySelectorAll('input')
    // patterns: header (label + title + desc = 3) + 14 patterns × name = 17
    expect(inputs.length).toBe(17)
  })

  // V9: edit in progress + focus change → commit
  it('commits edit on focus change via blur', async () => {
    const user = userEvent.setup()
    const { container } = render(<CmsLayout />)

    const badge = container.querySelector('[data-cms-id="hero-badge"]') as HTMLElement
    await user.click(badge)

    const panel = container.querySelector('.cms-detail-panel')!
    const input = panel.querySelector('input')!

    await user.clear(input)
    await user.type(input, 'Auto Committed')

    // Click a different node — causes blur → commit
    const title = container.querySelector('[data-cms-id="hero-title"]') as HTMLElement
    await user.click(title)

    expect(badge.textContent).toContain('Auto Committed')
  })

  // V10: stat container group label = text child localized value
  it('uses text label child value as stat group label', async () => {
    const { container } = render(<CmsLayout />)

    const stats = container.querySelector('[data-cms-id="stats"]') as HTMLElement
    act(() => { stats.click() })

    const panel = container.querySelector('.cms-detail-panel')!
    const legends = panel.querySelectorAll('.cms-detail-group__label')
    // First stat group should use the text(stat-label) child value
    const labels = Array.from(legends).map(l => l.textContent)
    expect(labels).toContain('APG Patterns')
    expect(labels).toContain('Tests')
  })

  // V12: footer-links container → link fields
  it('shows link fields for footer-links container', async () => {
    const { container } = render(<CmsLayout />)

    const footerLinks = container.querySelector('[data-cms-id="footer-links"]') as HTMLElement
    act(() => { footerLinks.click() })

    const panel = container.querySelector('.cms-detail-panel')!
    const inputs = panel.querySelectorAll('input')
    // 3 links × (label + href) = 6 fields
    expect(inputs.length).toBe(6)
  })
})
