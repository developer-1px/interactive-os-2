import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavList } from '../ui/NavList'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'

/**
 * Route: /ui/*  (PageUiShowcase)
 *
 * Regression tests for bugs found via /fix on this route.
 * Each test documents the original bug and the repro scenario.
 */

// --- Helpers ---

/** Grouped NavList data matching PageUiShowcase sidebar structure */
function makeGroupedNavData(): NormalizedData {
  return createStore({
    entities: {
      nav: { id: 'nav', data: { label: 'Navigation', type: 'group' } },
      sel: { id: 'sel', data: { label: 'Selection', type: 'group' } },
      a: { id: 'a', data: { label: 'Alpha' } },
      b: { id: 'b', data: { label: 'Beta' } },
      c: { id: 'c', data: { label: 'Charlie' } },
      d: { id: 'd', data: { label: 'Delta' } },
      e: { id: 'e', data: { label: 'Echo' } },
    },
    relationships: {
      [ROOT_ID]: ['nav', 'sel'],
      nav: ['a', 'b', 'c'],
      sel: ['d', 'e'],
    },
  })
}

function getNodeEl(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getFocusedNodeId(container: HTMLElement): string | null {
  const focused = container.querySelector('[tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

describe('Route /ui/* — PageUiShowcase sidebar', () => {
  /**
   * Bug: Grouped NavList ArrowDown loops within first group
   * Date: 2026-03-25
   *
   * Root cause: getVisibleNodes included group container entities in visible list.
   * When focusNext moved to the group entity, activationFollowsSelection fired onActivate with
   * the group label (not a valid slug), causing URL fallback to reset focus to
   * the first item — appearing as a loop.
   *
   * Fix: getVisibleNodes skips container nodes (nodes with children) when
   * expand pattern is not active.
   */
  it('ArrowDown navigates across group boundaries without looping', async () => {
    const user = userEvent.setup()
    const activated: string[] = []
    const { container } = render(
      <NavList
        data={makeGroupedNavData()}
        onActivate={(id) => activated.push(id)}
        aria-label="UI Components"
      />,
    )

    // Focus first item — act() needed because initial engine focus may target group entity
    await act(() => { getNodeEl(container, 'a')!.focus() })

    // ArrowDown through first group (a → b → c)
    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('b')

    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('c')

    // ArrowDown should cross into second group (c → d), NOT loop to 'a'
    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('d')

    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('e')

    // No group entity IDs should have been activated
    expect(activated).not.toContain('nav')
    expect(activated).not.toContain('sel')
  })

  it('ArrowUp navigates back across group boundaries', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <NavList
        data={makeGroupedNavData()}
        aria-label="UI Components"
      />,
    )

    // Focus first item of second group
    await act(() => { getNodeEl(container, 'd')!.focus() })

    // ArrowUp should cross back into first group (d → c)
    await user.keyboard('{ArrowUp}')
    expect(getFocusedNodeId(container)).toBe('c')
  })
})
