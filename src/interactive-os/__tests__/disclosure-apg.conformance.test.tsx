// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Disclosure (Show/Hide) Card
 * https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-card/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DisclosureGroup } from '../ui/DisclosureGroup'
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
      details1: { id: 'details1', data: { name: 'Show more info' } },
      content1: { id: 'content1', data: { name: 'Additional information here' } },
      details2: { id: 'details2', data: { name: 'Show advanced' } },
      content2: { id: 'content2', data: { name: 'Advanced settings' } },
    },
    relationships: {
      [ROOT_ID]: ['details1', 'details2'],
      details1: ['content1'],
      details2: ['content2'],
    },
  })
}

function leafFixtureData(): NormalizedData {
  return createStore({
    entities: {
      info: { id: 'info', data: { name: 'More Info', content: 'Details here...' } },
      opts: { id: 'opts', data: { name: 'Options', content: 'Advanced options...' } },
    },
    relationships: {
      [ROOT_ID]: ['info', 'opts'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderDisclosure(data: NormalizedData) {
  return render(
    <DisclosureGroup
      data={data}
      plugins={[]}
      renderItem={(props, item, state: NodeState) => (
        <span
          {...props}
          data-testid={`trigger-${item.id}`}
          data-focused={state.focused}
          data-expanded={state.expanded}
        >
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )}
    />,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getFocusedNodeId(container: HTMLElement): string | null {
  const focused = container.querySelector('[tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

function getAllVisibleNodeIds(container: HTMLElement): string[] {
  const nodes = container.querySelectorAll('[data-node-id]')
  return Array.from(nodes).map((n) => n.getAttribute('data-node-id')!).filter((id) => id)
}

// ---------------------------------------------------------------------------
// 1. ARIA Structure
// ---------------------------------------------------------------------------

describe('APG Disclosure — ARIA Structure', () => {
  it('role hierarchy: group > button items', () => {
    const { container } = renderDisclosure(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('group')
    expect(hierarchy).toContain('button')
  })

  it('collapsed triggers have no visible children', () => {
    const { container } = renderDisclosure(fixtureData())
    expect(getAllVisibleNodeIds(container)).toEqual(['details1', 'details2'])
  })

  it('aria-expanded is false on collapsed trigger', () => {
    const { container } = renderDisclosure(fixtureData())
    expect(getNode(container, 'details1')?.getAttribute('aria-expanded')).toBe('false')
  })

  it('aria-expanded is true after expand', async () => {
    const user = userEvent.setup()
    const { container } = renderDisclosure(fixtureData())

    getNode(container, 'details1')!.focus()
    await user.keyboard('{Enter}')

    expect(getNode(container, 'details1')?.getAttribute('aria-expanded')).toBe('true')
  })

  it('captureAriaTree snapshot includes aria-expanded attribute', () => {
    const { container } = renderDisclosure(fixtureData())
    const tree = captureAriaTree(container)
    expect(tree).toContain('expanded=false')
  })

  it('all triggers have tabindex=0 (natural-tab-order)', () => {
    const { container } = renderDisclosure(fixtureData())
    const nodes = container.querySelectorAll('[data-node-id]')
    nodes.forEach((node) => {
      expect(node.getAttribute('tabindex')).toBe('0')
    })
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard Interaction
// ---------------------------------------------------------------------------

describe('APG Disclosure — Keyboard Interaction', () => {
  describe('Enter key', () => {
    it('Enter expands a collapsed disclosure trigger', async () => {
      const user = userEvent.setup()
      const { container } = renderDisclosure(fixtureData())

      expect(getAllVisibleNodeIds(container)).toEqual(['details1', 'details2'])

      getNode(container, 'details1')!.focus()
      await user.keyboard('{Enter}')

      expect(getAllVisibleNodeIds(container)).toContain('content1')
    })

    it('Enter again collapses the expanded trigger', async () => {
      const user = userEvent.setup()
      const { container } = renderDisclosure(fixtureData())

      getNode(container, 'details1')!.focus()
      await user.keyboard('{Enter}') // expand
      expect(getAllVisibleNodeIds(container)).toContain('content1')

      await user.keyboard('{Enter}') // collapse
      expect(getAllVisibleNodeIds(container)).not.toContain('content1')
    })
  })

  describe('Space key', () => {
    it('Space expands a collapsed disclosure trigger', async () => {
      const user = userEvent.setup()
      const { container } = renderDisclosure(fixtureData())

      getNode(container, 'details2')!.focus()
      await user.keyboard('{ }')

      expect(getAllVisibleNodeIds(container)).toContain('content2')
    })
  })

  describe('No arrow navigation (APG spec: disclosure uses Tab only)', () => {
    it('ArrowDown does not move focus', async () => {
      const user = userEvent.setup()
      const { container } = renderDisclosure(fixtureData())

      getNode(container, 'details1')!.focus()
      await user.keyboard('{ArrowDown}')

      expect(getFocusedNodeId(container)).toBe('details1')
    })

    it('ArrowRight does not expand', async () => {
      const user = userEvent.setup()
      const { container } = renderDisclosure(fixtureData())

      getNode(container, 'details1')!.focus()
      await user.keyboard('{ArrowRight}')

      expect(getAllVisibleNodeIds(container)).toEqual(['details1', 'details2'])
    })
  })
})

// ---------------------------------------------------------------------------
// 3. Click Interaction
// ---------------------------------------------------------------------------

describe('APG Disclosure — Click Interaction', () => {
  it('clicking a trigger expands it', async () => {
    const user = userEvent.setup()
    const { container } = renderDisclosure(fixtureData())

    expect(getAllVisibleNodeIds(container)).toEqual(['details1', 'details2'])

    await user.click(getNode(container, 'details1')!)

    expect(getAllVisibleNodeIds(container)).toContain('content1')
  })

  it('clicking an expanded trigger collapses it', async () => {
    const user = userEvent.setup()
    const { container } = renderDisclosure(fixtureData())

    await user.click(getNode(container, 'details1')!) // expand
    expect(getAllVisibleNodeIds(container)).toContain('content1')

    await user.click(getNode(container, 'details1')!) // collapse
    expect(getAllVisibleNodeIds(container)).not.toContain('content1')
  })
})

// ---------------------------------------------------------------------------
// 4. Leaf Nodes
// ---------------------------------------------------------------------------

describe('APG Disclosure — Leaf Nodes', () => {
  it('Enter toggles expanded state on leaf node', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <DisclosureGroup
        data={leafFixtureData()}
        plugins={[]}
        renderItem={(props, item, state: NodeState) => (
          <span {...props} data-testid={`leaf-${item.id}`} data-expanded={state.expanded}>
            {(item.data as Record<string, unknown>)?.name as string}
          </span>
        )}
      />,
    )

    getNode(container, 'info')!.focus()
    await user.keyboard('{Enter}')

    const trigger = container.querySelector('[data-testid="leaf-info"]')
    expect(trigger?.getAttribute('data-expanded')).toBe('true')
  })

  it('click toggles expanded state on leaf node', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <DisclosureGroup
        data={leafFixtureData()}
        plugins={[]}
        renderItem={(props, item, state: NodeState) => (
          <span {...props} data-testid={`leaf-${item.id}`} data-expanded={state.expanded}>
            {(item.data as Record<string, unknown>)?.name as string}
          </span>
        )}
      />,
    )

    await user.click(getNode(container, 'info')!)

    const trigger = container.querySelector('[data-testid="leaf-info"]')
    expect(trigger?.getAttribute('data-expanded')).toBe('true')
  })
})
