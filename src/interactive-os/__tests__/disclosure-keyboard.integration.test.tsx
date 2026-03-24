/**
 * Integration test: DisclosureGroup keyboard interactions
 *
 * Tests the full user flow: render → keyboard/click input → visible result.
 * No arrow key navigation — only Enter/Space/Click to toggle expand.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DisclosureGroup } from '../ui/DisclosureGroup'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import { core } from '../plugins/core'
import type { NodeState } from '../pattern/types'

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

function renderDisclosure(data: NormalizedData) {
  return render(
    <DisclosureGroup
      data={data}
      plugins={[core()]}
      renderItem={(props, item, state: NodeState) => (
        <span {...props} data-testid={`trigger-${item.id}`} data-focused={state.focused} data-expanded={state.expanded}>
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

describe('DisclosureGroup keyboard integration', () => {
  describe('keyboard toggle', () => {
    it('Enter expands disclosure trigger', async () => {
      const user = userEvent.setup()
      const { container } = renderDisclosure(fixtureData())

      expect(getAllVisibleNodeIds(container)).toEqual(['details1', 'details2'])

      getNodeElement(container, 'details1')!.focus()
      await user.keyboard('{Enter}')

      expect(getAllVisibleNodeIds(container)).toContain('content1')
    })

    it('Space expands disclosure trigger', async () => {
      const user = userEvent.setup()
      const { container } = renderDisclosure(fixtureData())

      getNodeElement(container, 'details2')!.focus()
      await user.keyboard('{ }')

      expect(getAllVisibleNodeIds(container)).toContain('content2')
    })

    it('Enter again collapses expanded disclosure', async () => {
      const user = userEvent.setup()
      const { container } = renderDisclosure(fixtureData())

      getNodeElement(container, 'details1')!.focus()
      await user.keyboard('{Enter}') // expand
      expect(getAllVisibleNodeIds(container)).toContain('content1')

      await user.keyboard('{Enter}') // collapse
      expect(getAllVisibleNodeIds(container)).not.toContain('content1')
    })
  })

  describe('click toggle', () => {
    it('clicking a disclosure trigger toggles expand', async () => {
      const user = userEvent.setup()
      const { container } = renderDisclosure(fixtureData())

      expect(getAllVisibleNodeIds(container)).toEqual(['details1', 'details2'])

      await user.click(getNodeElement(container, 'details1')!)

      expect(getAllVisibleNodeIds(container)).toContain('content1')
    })

    it('clicking again collapses', async () => {
      const user = userEvent.setup()
      const { container } = renderDisclosure(fixtureData())

      await user.click(getNodeElement(container, 'details1')!) // expand
      expect(getAllVisibleNodeIds(container)).toContain('content1')

      await user.click(getNodeElement(container, 'details1')!) // collapse
      expect(getAllVisibleNodeIds(container)).not.toContain('content1')
    })
  })

  describe('leaf nodes (no children, expandable)', () => {
    it('Enter toggles expanded state on leaf node', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <DisclosureGroup
          data={leafFixtureData()}
          plugins={[core()]}
          renderItem={(props, item, state: NodeState) => (
            <span {...props} data-testid={`leaf-${item.id}`} data-expanded={state.expanded}>
              {(item.data as Record<string, unknown>)?.name as string}
            </span>
          )}
        />
      )

      getNodeElement(container, 'info')!.focus()
      await user.keyboard('{Enter}')

      const trigger = container.querySelector('[data-testid="leaf-info"]')
      expect(trigger?.getAttribute('data-expanded')).toBe('true')
    })

    it('click toggles expanded state on leaf node', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <DisclosureGroup
          data={leafFixtureData()}
          plugins={[core()]}
          renderItem={(props, item, state: NodeState) => (
            <span {...props} data-testid={`leaf-${item.id}`} data-expanded={state.expanded}>
              {(item.data as Record<string, unknown>)?.name as string}
            </span>
          )}
        />
      )

      await user.click(getNodeElement(container, 'info')!)

      const trigger = container.querySelector('[data-testid="leaf-info"]')
      expect(trigger?.getAttribute('data-expanded')).toBe('true')
    })
  })

  describe('Tab navigation (natural-tab-order)', () => {
    it('all triggers have tabIndex=0 (native Tab can reach them)', () => {
      const { container } = renderDisclosure(fixtureData())

      const nodes = container.querySelectorAll('[data-node-id]')
      nodes.forEach((node) => {
        expect(node.getAttribute('tabindex')).toBe('0')
      })
    })
  })

  describe('no arrow navigation', () => {
    it('ArrowDown does not move focus', async () => {
      const user = userEvent.setup()
      const { container } = renderDisclosure(fixtureData())

      getNodeElement(container, 'details1')!.focus()
      await user.keyboard('{ArrowDown}')

      expect(getFocusedNodeId(container)).toBe('details1')
    })

    it('ArrowRight does not expand', async () => {
      const user = userEvent.setup()
      const { container } = renderDisclosure(fixtureData())

      getNodeElement(container, 'details1')!.focus()
      await user.keyboard('{ArrowRight}')

      expect(getAllVisibleNodeIds(container)).toEqual(['details1', 'details2'])
    })
  })
})
