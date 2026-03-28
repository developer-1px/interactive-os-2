/**
 * APG Conformance: Navigation Menubar
 * https://www.w3.org/WAI/ARIA/apg/patterns/menubar/examples/menubar-navigation/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { Aria } from '../primitives/aria'
import { menubar } from '../pattern/roles/menubar'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import { EXPANDED_ID } from '../axis/expand'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'

// ---------------------------------------------------------------------------
// Fixtures — University navigation menubar
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      about: { id: 'about', data: { label: 'About' } },
      overview: { id: 'overview', data: { label: 'Overview' } },
      admin: { id: 'admin', data: { label: 'Administration' } },
      facts: { id: 'facts', data: { label: 'Facts' } },
      history: { id: 'history', data: { label: 'History' } },
      stats: { id: 'stats', data: { label: 'Current Statistics' } },

      admissions: { id: 'admissions', data: { label: 'Admissions' } },
      apply: { id: 'apply', data: { label: 'Apply' } },
      tuition: { id: 'tuition', data: { label: 'Tuition' } },

      academics: { id: 'academics', data: { label: 'Academics' } },
      courses: { id: 'courses', data: { label: 'Courses' } },
      [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: [] },
    },
    relationships: {
      [ROOT_ID]: ['about', 'admissions', 'academics'],
      about: ['overview', 'admin', 'facts'],
      facts: ['history', 'stats'],
      admissions: ['apply', 'tuition'],
      academics: ['courses'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderMenubar(data: NormalizedData) {
  return render(
    <Aria pattern={menubar} data={data} plugins={[]} aria-label="University">
      <Aria.Item render={(props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, _state: NodeState, children?: ReactNode) => {
        const label = (item.data as Record<string, unknown>)?.label as string
        if (children) {
          return (
            <div>
              <a {...props} href="#">{label}</a>
              <ul role="menu" aria-label={label}>{children}</ul>
            </div>
          )
        }
        return <a {...props} href="#">{label}</a>
      }} />
    </Aria>,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement {
  return container.querySelector(`[data-node-id="${id}"]`)!
}

function focused(): string {
  return document.activeElement?.getAttribute('data-node-id') ?? ''
}

// ---------------------------------------------------------------------------
// 1. ARIA Structure
// ---------------------------------------------------------------------------

describe('APG Menubar — ARIA Structure', () => {
  it('container has role="menubar"', () => {
    const { container } = renderMenubar(fixtureData())
    expect(container.querySelector('[role="menubar"]')).not.toBeNull()
  })

  it('all items have role="menuitem"', () => {
    const { container } = renderMenubar(fixtureData())
    // Only root items visible initially (submenus collapsed)
    const items = container.querySelectorAll('[role="menuitem"]')
    expect(items.length).toBe(3) // about, admissions, academics
  })

  it('items with children get aria-expanded="false"', () => {
    const { container } = renderMenubar(fixtureData())
    expect(getNode(container, 'about').getAttribute('aria-expanded')).toBe('false')
    expect(getNode(container, 'admissions').getAttribute('aria-expanded')).toBe('false')
    expect(getNode(container, 'academics').getAttribute('aria-expanded')).toBe('false')
  })

  it('uses roving tabindex (first item tabindex=0, rest -1)', () => {
    const { container } = renderMenubar(fixtureData())
    expect(getNode(container, 'about').getAttribute('tabindex')).toBe('0')
    expect(getNode(container, 'admissions').getAttribute('tabindex')).toBe('-1')
    expect(getNode(container, 'academics').getAttribute('tabindex')).toBe('-1')
  })
})

// ---------------------------------------------------------------------------
// 2. Menubar Navigation (horizontal)
// ---------------------------------------------------------------------------

describe('APG Menubar — Menubar Navigation', () => {
  it('ArrowRight moves to next menubar item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{ArrowRight}')
    expect(focused()).toBe('admissions')
  })

  it('ArrowRight wraps from last to first', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'academics').focus()
    await user.keyboard('{ArrowRight}')
    expect(focused()).toBe('about')
  })

  it('ArrowLeft moves to previous menubar item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'admissions').focus()
    await user.keyboard('{ArrowLeft}')
    expect(focused()).toBe('about')
  })

  it('ArrowLeft wraps from first to last', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{ArrowLeft}')
    expect(focused()).toBe('academics')
  })

  it('Home moves to first menubar item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'academics').focus()
    await user.keyboard('{Home}')
    expect(focused()).toBe('about')
  })

  it('End moves to last menubar item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{End}')
    expect(focused()).toBe('academics')
  })
})

// ---------------------------------------------------------------------------
// 3. Submenu Open/Close
// ---------------------------------------------------------------------------

describe('APG Menubar — Submenu Open/Close', () => {
  it('ArrowDown opens submenu and focuses first item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{ArrowDown}')
    expect(focused()).toBe('overview')
    expect(getNode(container, 'about').getAttribute('aria-expanded')).toBe('true')
  })

  it('ArrowUp opens submenu and focuses last item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{ArrowUp}')
    expect(focused()).toBe('facts')
    expect(getNode(container, 'about').getAttribute('aria-expanded')).toBe('true')
  })

  it('Enter opens submenu and focuses first item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{Enter}')
    expect(focused()).toBe('overview')
  })

  it('Escape closes submenu and focuses parent menubar item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{ArrowDown}') // open + focus overview
    await user.keyboard('{Escape}')
    expect(focused()).toBe('about')
    expect(getNode(container, 'about').getAttribute('aria-expanded')).toBe('false')
  })
})

// ---------------------------------------------------------------------------
// 4. Submenu Navigation (vertical)
// ---------------------------------------------------------------------------

describe('APG Menubar — Submenu Navigation', () => {
  it('ArrowDown moves to next submenu item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{ArrowDown}') // → overview
    await user.keyboard('{ArrowDown}') // → admin
    expect(focused()).toBe('admin')
  })

  it('ArrowDown wraps within submenu', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{ArrowDown}') // → overview
    await user.keyboard('{ArrowDown}') // → admin
    await user.keyboard('{ArrowDown}') // → facts
    await user.keyboard('{ArrowDown}') // → wrap to overview
    expect(focused()).toBe('overview')
  })

  it('ArrowUp moves to previous submenu item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{ArrowDown}') // → overview
    await user.keyboard('{ArrowDown}') // → admin
    await user.keyboard('{ArrowUp}')   // → overview
    expect(focused()).toBe('overview')
  })

  it('ArrowUp wraps within submenu', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{ArrowDown}') // → overview
    await user.keyboard('{ArrowUp}')   // → wrap to facts
    expect(focused()).toBe('facts')
  })

  it('Home focuses first item in submenu', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{ArrowDown}') // → overview
    await user.keyboard('{ArrowDown}') // → admin
    await user.keyboard('{Home}')
    expect(focused()).toBe('overview')
  })

  it('End focuses last item in submenu', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{ArrowDown}') // → overview
    await user.keyboard('{End}')
    expect(focused()).toBe('facts')
  })
})

// ---------------------------------------------------------------------------
// 5. Cross-submenu Navigation (the hard part)
// ---------------------------------------------------------------------------

describe('APG Menubar — Cross-submenu Navigation', () => {
  it('ArrowRight in submenu closes current and opens next menubar submenu', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{ArrowDown}') // open about → overview
    await user.keyboard('{ArrowRight}') // close about, open admissions → apply
    expect(focused()).toBe('apply')
    expect(getNode(container, 'about').getAttribute('aria-expanded')).toBe('false')
    expect(getNode(container, 'admissions').getAttribute('aria-expanded')).toBe('true')
  })

  it('ArrowLeft in submenu closes current and opens previous menubar submenu', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'admissions').focus()
    await user.keyboard('{ArrowDown}') // open admissions → apply
    await user.keyboard('{ArrowLeft}') // close admissions, open about → last item (facts)
    expect(focused()).toBe('facts')
    expect(getNode(container, 'admissions').getAttribute('aria-expanded')).toBe('false')
    expect(getNode(container, 'about').getAttribute('aria-expanded')).toBe('true')
  })

  it('ArrowRight wraps: from last menubar submenu to first', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'academics').focus()
    await user.keyboard('{ArrowDown}') // open academics → courses
    await user.keyboard('{ArrowRight}') // close academics, open about → overview
    expect(focused()).toBe('overview')
    expect(getNode(container, 'academics').getAttribute('aria-expanded')).toBe('false')
    expect(getNode(container, 'about').getAttribute('aria-expanded')).toBe('true')
  })

  it('ArrowRight/Left on menubar with open submenu moves and opens new submenu', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{ArrowDown}') // open about submenu
    await user.keyboard('{Escape}')    // close, focus about
    // Now about is on menubar level but submenu was just closed
    // Re-open with ArrowDown
    await user.keyboard('{ArrowDown}') // open about → overview
    // ArrowRight on menubar with submenu open → advance + open
    await user.keyboard('{Escape}')
    expect(focused()).toBe('about')
    await user.keyboard('{ArrowDown}') // re-open about
    // We're in submenu now, ArrowRight should advance
    await user.keyboard('{ArrowRight}')
    expect(focused()).toBe('apply')
  })
})

// ---------------------------------------------------------------------------
// 6. Nested Submenus
// ---------------------------------------------------------------------------

describe('APG Menubar — Nested Submenus', () => {
  it('ArrowRight on submenu item with children opens nested submenu', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{ArrowDown}') // → overview
    await user.keyboard('{ArrowDown}') // → admin
    await user.keyboard('{ArrowDown}') // → facts (has children: history, stats)
    await user.keyboard('{ArrowRight}') // open facts submenu → history
    expect(focused()).toBe('history')
    expect(getNode(container, 'facts').getAttribute('aria-expanded')).toBe('true')
  })

  it('ArrowLeft in nested submenu closes it and focuses parent', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{ArrowDown}')  // → overview
    await user.keyboard('{ArrowDown}')  // → admin
    await user.keyboard('{ArrowDown}')  // → facts
    await user.keyboard('{ArrowRight}') // → history (nested)
    await user.keyboard('{ArrowLeft}')  // close nested → facts
    expect(focused()).toBe('facts')
    expect(getNode(container, 'facts').getAttribute('aria-expanded')).toBe('false')
  })

  it('Escape in nested submenu closes it and focuses parent', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{ArrowDown}')  // → overview
    await user.keyboard('{ArrowDown}')  // → admin
    await user.keyboard('{ArrowDown}')  // → facts
    await user.keyboard('{ArrowRight}') // → history
    await user.keyboard('{Escape}')     // close nested → facts
    expect(focused()).toBe('facts')
  })

  it('ArrowDown/Up navigate within nested submenu', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{ArrowDown}')  // → overview
    await user.keyboard('{ArrowDown}')  // → admin
    await user.keyboard('{ArrowDown}')  // → facts
    await user.keyboard('{ArrowRight}') // → history
    await user.keyboard('{ArrowDown}')  // → stats
    expect(focused()).toBe('stats')
    await user.keyboard('{ArrowDown}')  // wrap → history
    expect(focused()).toBe('history')
  })

  it('ArrowRight in nested submenu leaf advances to next menubar item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenubar(fixtureData())
    getNode(container, 'about').focus()
    await user.keyboard('{ArrowDown}')  // → overview
    await user.keyboard('{ArrowDown}')  // → admin
    await user.keyboard('{ArrowDown}')  // → facts
    await user.keyboard('{ArrowRight}') // → history (nested)
    await user.keyboard('{ArrowRight}') // history has no children → advance to admissions
    expect(focused()).toBe('apply')
    expect(getNode(container, 'about').getAttribute('aria-expanded')).toBe('false')
    expect(getNode(container, 'admissions').getAttribute('aria-expanded')).toBe('true')
  })
})
