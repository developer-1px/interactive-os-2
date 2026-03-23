/**
 * Integration test: Accordion keyboard interactions
 *
 * Tests the full user flow: render → keyboard/click input → visible result.
 * Vertical navigation with expand/collapse via Enter/Space/Click.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Accordion } from '../ui/Accordion'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core } from '../plugins/core'
import type { NodeState } from '../behaviors/types'

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

function renderAccordion(data: NormalizedData) {
  return render(
    <Accordion
      data={data}
      plugins={[core()]}
      renderItem={(props, item, state: NodeState) => (
        <span {...props} data-testid={`section-${item.id}`} data-focused={state.focused} data-expanded={state.expanded}>
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )}
    />
  )
}

function getFocusedNodeId(container: HTMLElement): string | null {
  const focused = container.querySelector('[tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

function getNodeElement(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getAllVisibleNodeIds(container: HTMLElement): string[] {
  const nodes = container.querySelectorAll('[data-node-id]')
  return Array.from(nodes).map((n) => n.getAttribute('data-node-id')!).filter((id) => id)
}

describe('Accordion keyboard integration', () => {
  describe('navigation (vertical)', () => {
    it('ArrowDown moves focus to next section', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      expect(getFocusedNodeId(container)).toBe('section1')

      // Use .focus() to avoid click-toggle behavior
      getNodeElement(container, 'section1')!.focus()
      await user.keyboard('{ArrowDown}')

      expect(getFocusedNodeId(container)).toBe('section2')
    })

    it('ArrowUp moves focus to previous section', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNodeElement(container, 'section2')!.focus()
      await user.keyboard('{ArrowUp}')

      expect(getFocusedNodeId(container)).toBe('section1')
    })

    it('Home moves focus to first section', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNodeElement(container, 'section3')!.focus()
      await user.keyboard('{Home}')

      expect(getFocusedNodeId(container)).toBe('section1')
    })

    it('End moves focus to last section', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNodeElement(container, 'section1')!.focus()
      await user.keyboard('{End}')

      expect(getFocusedNodeId(container)).toBe('section3')
    })
  })

  describe('keyboard expand/collapse', () => {
    it('Enter toggles expand on section with children', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      expect(getAllVisibleNodeIds(container)).toEqual(['section1', 'section2', 'section3'])

      getNodeElement(container, 'section1')!.focus()
      await user.keyboard('{Enter}')

      expect(getAllVisibleNodeIds(container)).toContain('content1')
    })

    it('Space toggles expand on section with children', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNodeElement(container, 'section2')!.focus()
      await user.keyboard('{ }')

      expect(getAllVisibleNodeIds(container)).toContain('content2')
    })

    it('Enter again collapses the expanded section', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNodeElement(container, 'section1')!.focus()
      await user.keyboard('{Enter}') // expand
      expect(getAllVisibleNodeIds(container)).toContain('content1')

      await user.keyboard('{Enter}') // collapse
      expect(getAllVisibleNodeIds(container)).not.toContain('content1')
    })

    it('navigation works through expanded content', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNodeElement(container, 'section1')!.focus()
      await user.keyboard('{Enter}') // expand

      await user.keyboard('{ArrowDown}')
      expect(getFocusedNodeId(container)).toBe('content1')

      await user.keyboard('{ArrowDown}')
      expect(getFocusedNodeId(container)).toBe('section2')
    })
  })

  describe('click expand/collapse', () => {
    it('clicking a section toggles expand', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      expect(getAllVisibleNodeIds(container)).toEqual(['section1', 'section2', 'section3'])

      await user.click(getNodeElement(container, 'section1')!)

      expect(getAllVisibleNodeIds(container)).toContain('content1')
    })

    it('clicking an expanded section collapses it', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      await user.click(getNodeElement(container, 'section1')!) // expand
      expect(getAllVisibleNodeIds(container)).toContain('content1')

      await user.click(getNodeElement(container, 'section1')!) // collapse
      expect(getAllVisibleNodeIds(container)).not.toContain('content1')
    })
  })

  describe('leaf nodes (no children, expandable)', () => {
    it('Enter toggles expanded state on leaf node', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <Accordion
          data={leafFixtureData()}
          plugins={[core()]}
          renderItem={(props, item, state: NodeState) => (
            <span {...props} data-testid={`leaf-${item.id}`} data-expanded={state.expanded}>
              {(item.data as Record<string, unknown>)?.name as string}
            </span>
          )}
        />
      )

      getNodeElement(container, 'getting')!.focus()
      await user.keyboard('{Enter}')

      const header = container.querySelector('[data-testid="leaf-getting"]')
      expect(header?.getAttribute('data-expanded')).toBe('true')
    })

    it('click toggles expanded state on leaf node', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <Accordion
          data={leafFixtureData()}
          plugins={[core()]}
          renderItem={(props, item, state: NodeState) => (
            <span {...props} data-testid={`leaf-${item.id}`} data-expanded={state.expanded}>
              {(item.data as Record<string, unknown>)?.name as string}
            </span>
          )}
        />
      )

      await user.click(getNodeElement(container, 'getting')!)

      const header = container.querySelector('[data-testid="leaf-getting"]')
      expect(header?.getAttribute('data-expanded')).toBe('true')
    })
  })
})
