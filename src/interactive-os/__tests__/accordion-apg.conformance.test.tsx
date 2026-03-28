// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Accordion
 * https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Accordion } from '../ui/Accordion'
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
      section1: { id: 'section1', data: { name: 'Getting Started' } },
      content1: { id: 'content1', data: { name: 'Welcome content' } },
      section2: { id: 'section2', data: { name: 'Configuration' } },
      content2: { id: 'content2', data: { name: 'Config content' } },
      section3: { id: 'section3', data: { name: 'Advanced' } },
      content3: { id: 'content3', data: { name: 'Advanced content' } },
    },
    relationships: {
      [ROOT_ID]: ['section1', 'section2', 'section3'],
      section1: ['content1'],
      section2: ['content2'],
      section3: ['content3'],
    },
  })
}

function leafFixtureData(): NormalizedData {
  return createStore({
    entities: {
      getting: { id: 'getting', data: { name: 'Getting Started', content: 'Install guide...' } },
      api: { id: 'api', data: { name: 'API Reference', content: 'Core APIs...' } },
      faq: { id: 'faq', data: { name: 'FAQ', content: 'Q&A...' } },
    },
    relationships: {
      [ROOT_ID]: ['getting', 'api', 'faq'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderAccordion(data: NormalizedData) {
  return render(
    <Accordion
      data={data}
      plugins={[]}
      renderItem={(props, item, state: NodeState) => (
        <span
          {...props}
          data-testid={`section-${item.id}`}
          data-focused={state.focused}
          data-expanded={state.expanded}
        >
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )}
    />,
  )
}

function renderLeafAccordion(data: NormalizedData) {
  return render(
    <Accordion
      data={data}
      plugins={[]}
      renderItem={(props, item, state: NodeState) => (
        <span {...props} data-testid={`leaf-${item.id}`} data-expanded={state.expanded}>
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )}
    />,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getFocusedNodeId(_container: HTMLElement): string | null {
  const focused = document.activeElement
  return focused?.getAttribute('data-node-id') ?? null
}

function getVisibleNodeIds(container: HTMLElement): string[] {
  const nodes = container.querySelectorAll('[data-node-id]')
  return Array.from(nodes)
    .map((n) => n.getAttribute('data-node-id')!)
    .filter((id) => id)
}

// ---------------------------------------------------------------------------
// 1. Aria Tree Structure
// ---------------------------------------------------------------------------

describe('APG Accordion — Aria Tree Structure', () => {
  it('role hierarchy: region > heading items', () => {
    const { container } = renderAccordion(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    // Top container should be region, items should be heading
    expect(hierarchy).toContain('region')
    expect(hierarchy).toContain('heading')
  })

  it('collapsed sections have no visible children', () => {
    const { container } = renderAccordion(fixtureData())
    // Initially all sections collapsed — only headings visible
    expect(getVisibleNodeIds(container)).toEqual(['section1', 'section2', 'section3'])
  })

  it('aria-expanded is false on collapsed heading', () => {
    const { container } = renderAccordion(fixtureData())
    const section1 = getNode(container, 'section1')
    expect(section1?.getAttribute('aria-expanded')).toBe('false')
  })

  it('aria-expanded is true on expanded heading', async () => {
    const user = userEvent.setup()
    const { container } = renderAccordion(fixtureData())

    getNode(container, 'section1')!.focus()
    await user.keyboard('{Enter}')

    const section1 = getNode(container, 'section1')
    expect(section1?.getAttribute('aria-expanded')).toBe('true')
  })

  it('initial focus lands on first heading (tabindex=0)', () => {
    const { container } = renderAccordion(fixtureData())
    expect(getFocusedNodeId(container)).toBe('section1')
  })

  it('all headings have tabindex=0 (natural tab order — APG accordion)', () => {
    const { container } = renderAccordion(fixtureData())

    const headings = container.querySelectorAll('[data-node-id]')
    for (const heading of headings) {
      expect(heading.getAttribute('tabindex')).toBe('0')
    }
  })

  it('captureAriaTree snapshot includes aria-expanded attribute', () => {
    const { container } = renderAccordion(fixtureData())
    const tree = captureAriaTree(container)
    expect(tree).toContain('expanded=false')
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard Interaction
// ---------------------------------------------------------------------------

describe('APG Accordion — Keyboard Interaction', () => {
  describe('Enter key', () => {
    it('Enter expands a collapsed section', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      expect(getVisibleNodeIds(container)).toEqual(['section1', 'section2', 'section3'])

      getNode(container, 'section1')!.focus()
      await user.keyboard('{Enter}')

      expect(getVisibleNodeIds(container)).toContain('content1')
    })

    it('Enter collapses an expanded section', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNode(container, 'section1')!.focus()
      await user.keyboard('{Enter}') // expand
      expect(getVisibleNodeIds(container)).toContain('content1')

      await user.keyboard('{Enter}') // collapse
      expect(getVisibleNodeIds(container)).not.toContain('content1')
    })
  })

  describe('Space key', () => {
    it('Space expands a collapsed section', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNode(container, 'section2')!.focus()
      await user.keyboard('{ }')

      expect(getVisibleNodeIds(container)).toContain('content2')
    })
  })

  describe('ArrowDown key', () => {
    it('ArrowDown moves focus to next section', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      expect(getFocusedNodeId(container)).toBe('section1')

      getNode(container, 'section1')!.focus()
      await user.keyboard('{ArrowDown}')

      expect(getFocusedNodeId(container)).toBe('section2')
    })

    it('ArrowDown traverses into expanded content', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNode(container, 'section1')!.focus()
      await user.keyboard('{Enter}') // expand

      await user.keyboard('{ArrowDown}')
      expect(getFocusedNodeId(container)).toBe('content1')

      await user.keyboard('{ArrowDown}')
      expect(getFocusedNodeId(container)).toBe('section2')
    })
  })

  describe('ArrowUp key', () => {
    it('ArrowUp moves focus to previous section', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNode(container, 'section2')!.focus()
      await user.keyboard('{ArrowUp}')

      expect(getFocusedNodeId(container)).toBe('section1')
    })
  })

  describe('Home key', () => {
    it('Home moves focus to first section', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNode(container, 'section3')!.focus()
      await user.keyboard('{Home}')

      expect(getFocusedNodeId(container)).toBe('section1')
    })
  })

  describe('End key', () => {
    it('End moves focus to last section', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNode(container, 'section1')!.focus()
      await user.keyboard('{End}')

      expect(getFocusedNodeId(container)).toBe('section3')
    })
  })
})

// ---------------------------------------------------------------------------
// 3. Click Interaction
// ---------------------------------------------------------------------------

describe('APG Accordion — Click Interaction', () => {
  it('clicking a section expands it', async () => {
    const user = userEvent.setup()
    const { container } = renderAccordion(fixtureData())

    expect(getVisibleNodeIds(container)).toEqual(['section1', 'section2', 'section3'])

    await user.click(getNode(container, 'section1')!)

    expect(getVisibleNodeIds(container)).toContain('content1')
  })

  it('clicking an expanded section collapses it', async () => {
    const user = userEvent.setup()
    const { container } = renderAccordion(fixtureData())

    await user.click(getNode(container, 'section1')!) // expand
    expect(getVisibleNodeIds(container)).toContain('content1')

    await user.click(getNode(container, 'section1')!) // collapse
    expect(getVisibleNodeIds(container)).not.toContain('content1')
  })
})

// ---------------------------------------------------------------------------
// 4. Leaf Nodes (no children — expandable via data state only)
// ---------------------------------------------------------------------------

describe('APG Accordion — Leaf Nodes', () => {
  it('Enter toggles expanded state on leaf node', async () => {
    const user = userEvent.setup()
    const { container } = renderLeafAccordion(leafFixtureData())

    getNode(container, 'getting')!.focus()
    await user.keyboard('{Enter}')

    const header = container.querySelector('[data-testid="leaf-getting"]')
    expect(header?.getAttribute('data-expanded')).toBe('true')
  })

  it('click toggles expanded state on leaf node', async () => {
    const user = userEvent.setup()
    const { container } = renderLeafAccordion(leafFixtureData())

    await user.click(getNode(container, 'getting')!)

    const header = container.querySelector('[data-testid="leaf-getting"]')
    expect(header?.getAttribute('data-expanded')).toBe('true')
  })
})
