// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Tabs with Manual Activation
 * https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-manual/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { tabsManual } from '../pattern/examples/tabsManual'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { extractRoleHierarchy } from './helpers/ariaTreeSnapshot'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      nils:  { id: 'nils',  data: { name: 'Nils Frahm'  } },
      agnes: { id: 'agnes', data: { name: 'Agnes Obel'  } },
      joke:  { id: 'joke',  data: { name: 'Joke Lanz'   } },
    },
    relationships: {
      [ROOT_ID]: ['nils', 'agnes', 'joke'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderTabs(data: NormalizedData) {
  return render(
    <Aria behavior={tabsManual} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <span {...props} data-testid={`tab-${item.id}`}>
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )} />
    </Aria>,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getFocusedNodeId(container: HTMLElement): string | null {
  return container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id') ?? null
}

function getSelectedNodeIds(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[aria-selected="true"]'))
    .map(el => el.getAttribute('data-node-id'))
    .filter(Boolean) as string[]
}

// ---------------------------------------------------------------------------
// 1. ARIA Structure
// ---------------------------------------------------------------------------

describe('APG Tabs Manual — ARIA Structure', () => {
  it('role hierarchy: tablist > tab', () => {
    const { container } = renderTabs(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('tablist')
    expect(hierarchy).toContain('tab')
  })

  it('initial focus on first tab (tabindex=0)', () => {
    const { container } = renderTabs(fixtureData())
    expect(getFocusedNodeId(container)).toBe('nils')
  })

  it('only one tab has tabindex=0', () => {
    const { container } = renderTabs(fixtureData())
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
  })

  it('tabs have aria-selected', () => {
    const { container } = renderTabs(fixtureData())
    const tab = getNode(container, 'agnes')
    expect(tab?.getAttribute('aria-selected')).toBe('false')
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard: Focus Movement (NO auto-selection — manual activation)
// ---------------------------------------------------------------------------

describe('APG Tabs Manual — Keyboard: Focus Movement', () => {
  it('ArrowRight moves focus to next tab', async () => {
    const user = userEvent.setup()
    const { container } = renderTabs(fixtureData())

    getNode(container, 'nils')!.focus()
    await user.keyboard('{ArrowRight}')

    expect(getFocusedNodeId(container)).toBe('agnes')
  })

  it('ArrowRight does NOT change selection (manual activation)', async () => {
    const user = userEvent.setup()
    const { container } = renderTabs(fixtureData())

    getNode(container, 'nils')!.focus()
    await user.keyboard('{ArrowRight}')

    // Focus moved but selection did NOT follow
    expect(getFocusedNodeId(container)).toBe('agnes')
    expect(getNode(container, 'agnes')?.getAttribute('aria-selected')).toBe('false')
  })

  it('ArrowLeft moves focus to previous tab', async () => {
    const user = userEvent.setup()
    const { container } = renderTabs(fixtureData())

    getNode(container, 'agnes')!.focus()
    await user.keyboard('{ArrowLeft}')

    expect(getFocusedNodeId(container)).toBe('nils')
  })

  it('Home moves focus to first tab', async () => {
    const user = userEvent.setup()
    const { container } = renderTabs(fixtureData())

    getNode(container, 'joke')!.focus()
    await user.keyboard('{Home}')

    expect(getFocusedNodeId(container)).toBe('nils')
  })

  it('End moves focus to last tab', async () => {
    const user = userEvent.setup()
    const { container } = renderTabs(fixtureData())

    getNode(container, 'nils')!.focus()
    await user.keyboard('{End}')

    expect(getFocusedNodeId(container)).toBe('joke')
  })
})

// ---------------------------------------------------------------------------
// 3. Keyboard: Manual Activation (Enter / Space selects)
// ---------------------------------------------------------------------------

describe('APG Tabs Manual — Keyboard: Activation', () => {
  it('Enter selects focused tab', async () => {
    const user = userEvent.setup()
    const { container } = renderTabs(fixtureData())

    getNode(container, 'agnes')!.focus()
    await user.keyboard('{Enter}')

    expect(getNode(container, 'agnes')?.getAttribute('aria-selected')).toBe('true')
  })

  it('Space selects focused tab', async () => {
    const user = userEvent.setup()
    const { container } = renderTabs(fixtureData())

    getNode(container, 'joke')!.focus()
    await user.keyboard('{ }')

    expect(getNode(container, 'joke')?.getAttribute('aria-selected')).toBe('true')
  })

  it('only one tab selected at a time', async () => {
    const user = userEvent.setup()
    const { container } = renderTabs(fixtureData())

    getNode(container, 'nils')!.focus()
    await user.keyboard('{Enter}')
    getNode(container, 'agnes')!.focus()
    await user.keyboard('{Enter}')

    expect(getSelectedNodeIds(container)).toEqual(['agnes'])
  })
})

// ---------------------------------------------------------------------------
// 4. Click Interaction
// ---------------------------------------------------------------------------

describe('APG Tabs Manual — Click Interaction', () => {
  it('clicking a tab selects it', async () => {
    const user = userEvent.setup()
    const { container } = renderTabs(fixtureData())

    await user.click(getNode(container, 'agnes')!)

    expect(getNode(container, 'agnes')?.getAttribute('aria-selected')).toBe('true')
  })
})
