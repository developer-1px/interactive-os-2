// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Tabs with Automatic Activation
 * https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-automatic/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TabList } from '../ui/TabList'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { captureAriaTree, extractRoleHierarchy } from './helpers/ariaTreeSnapshot'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      general:  { id: 'general',  data: { name: 'General'  } },
      security: { id: 'security', data: { name: 'Security' } },
      advanced: { id: 'advanced', data: { name: 'Advanced' } },
    },
    relationships: {
      [ROOT_ID]: ['general', 'security', 'advanced'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderTabList(data: NormalizedData) {
  return render(
    <TabList
      data={data}
      plugins={[]}
      renderItem={(props, tab, state: NodeState) => (
        <span
          {...props}
          data-testid={`tab-${tab.id}`}
          data-focused={state.focused}
          data-selected={state.selected}
        >
          {(tab.data as Record<string, unknown>)?.name as string}
        </span>
      )}
    />,
  )
}

function getFocusedNodeId(container: HTMLElement): string | null {
  const focused = container.querySelector('[tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getSelectedNodeIds(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[aria-selected="true"]'))
    .map(el => el.getAttribute('data-node-id'))
    .filter(Boolean) as string[]
}

// ---------------------------------------------------------------------------
// 1. ARIA Tree Structure
// ---------------------------------------------------------------------------

describe('APG Tabs — ARIA Tree Structure', () => {
  it('role hierarchy: tablist > tab items', () => {
    const { container } = renderTabList(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('tablist')
    expect(hierarchy).toContain('tab')
  })

  it('initial focus lands on first tab (tabindex=0)', () => {
    const { container } = renderTabList(fixtureData())
    expect(getFocusedNodeId(container)).toBe('general')
  })

  it('only one tab has tabindex=0 (roving tabindex)', () => {
    const { container } = renderTabList(fixtureData())
    const allTabindex0 = container.querySelectorAll('[tabindex="0"]')
    expect(allTabindex0).toHaveLength(1)
  })

  it('unfocused tabs have tabindex=-1', () => {
    const { container } = renderTabList(fixtureData())
    const neg1 = container.querySelectorAll('[tabindex="-1"]')
    expect(neg1.length).toBeGreaterThanOrEqual(2)
  })

  it('aria-selected=false on non-selected tab', () => {
    const { container } = renderTabList(fixtureData())
    expect(getNode(container, 'security')?.getAttribute('aria-selected')).toBe('false')
  })

  it('captureAriaTree includes aria-selected', () => {
    const { container } = renderTabList(fixtureData())
    const tree = captureAriaTree(container)
    expect(tree).toContain('selected=false')
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard Interaction (Automatic Activation: ArrowKey moves + selects)
// ---------------------------------------------------------------------------

describe('APG Tabs — Keyboard Interaction', () => {
  describe('ArrowRight', () => {
    it('ArrowRight moves focus to next tab', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      getNode(container, 'general')!.focus()
      await user.keyboard('{ArrowRight}')

      expect(getFocusedNodeId(container)).toBe('security')
    })

    // NOTE: APG Automatic Activation requires ArrowRight to auto-select (followFocus).
    // This impl wires followFocus only via external onActivate callback; without it,
    // arrow keys move focus but do not auto-select (gap vs APG tabs-automatic).
    it('ArrowRight moves focus without auto-selecting (impl gap vs APG automatic tabs)', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      getNode(container, 'general')!.focus()
      await user.keyboard('{ArrowRight}')

      // Focus moved
      expect(getFocusedNodeId(container)).toBe('security')
      // But aria-selected stays false without explicit activation
      expect(getNode(container, 'security')?.getAttribute('aria-selected')).toBe('false')
    })

    it('ArrowRight at last tab does not wrap (no wrap)', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      getNode(container, 'advanced')!.focus()
      await user.keyboard('{ArrowRight}')

      // stays on advanced (no wrap configured)
      expect(getFocusedNodeId(container)).toBe('advanced')
    })
  })

  describe('ArrowLeft', () => {
    it('ArrowLeft moves focus to previous tab', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      getNode(container, 'security')!.focus()
      await user.keyboard('{ArrowLeft}')

      expect(getFocusedNodeId(container)).toBe('general')
    })

    it('ArrowLeft moves focus without auto-selecting (same gap)', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      getNode(container, 'security')!.focus()
      await user.keyboard('{ArrowLeft}')

      expect(getFocusedNodeId(container)).toBe('general')
      expect(getNode(container, 'general')?.getAttribute('aria-selected')).toBe('false')
    })
  })

  describe('Home / End', () => {
    it('Home moves focus to first tab', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      getNode(container, 'advanced')!.focus()
      await user.keyboard('{Home}')

      expect(getFocusedNodeId(container)).toBe('general')
    })

    it('End moves focus to last tab', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      getNode(container, 'general')!.focus()
      await user.keyboard('{End}')

      expect(getFocusedNodeId(container)).toBe('advanced')
    })
  })

  describe('Vertical keys (no-op)', () => {
    it('ArrowDown does nothing (horizontal orientation)', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      getNode(container, 'general')!.focus()
      await user.keyboard('{ArrowDown}')

      expect(getFocusedNodeId(container)).toBe('general')
    })
  })

  describe('Activation via Enter/Space', () => {
    it('Enter selects focused tab', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      getNode(container, 'security')!.focus()
      await user.keyboard('{Enter}')

      expect(getNode(container, 'security')?.getAttribute('aria-selected')).toBe('true')
    })

    it('Space selects focused tab', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      getNode(container, 'advanced')!.focus()
      await user.keyboard('{ }')

      expect(getNode(container, 'advanced')?.getAttribute('aria-selected')).toBe('true')
    })

    it('only one tab is selected at a time (single mode)', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      getNode(container, 'general')!.focus()
      await user.keyboard('{Enter}')

      getNode(container, 'security')!.focus()
      await user.keyboard('{Enter}')

      const selected = getSelectedNodeIds(container)
      expect(selected).toHaveLength(1)
      expect(selected[0]).toBe('security')
    })
  })
})

// ---------------------------------------------------------------------------
// 3. Click Interaction
// ---------------------------------------------------------------------------

describe('APG Tabs — Click Interaction', () => {
  it('clicking a tab selects it', async () => {
    const user = userEvent.setup()
    const { container } = renderTabList(fixtureData())

    await user.click(getNode(container, 'security')!)

    expect(getNode(container, 'security')?.getAttribute('aria-selected')).toBe('true')
  })

  it('clicking another tab deselects the previous', async () => {
    const user = userEvent.setup()
    const { container } = renderTabList(fixtureData())

    await user.click(getNode(container, 'security')!)
    await user.click(getNode(container, 'advanced')!)

    expect(getNode(container, 'security')?.getAttribute('aria-selected')).toBe('false')
    expect(getNode(container, 'advanced')?.getAttribute('aria-selected')).toBe('true')
  })
})
