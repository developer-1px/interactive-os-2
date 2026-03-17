/**
 * Integration test: TabList keyboard interactions
 *
 * Tests the full user flow: render → keyboard input → visible result.
 * Horizontal navigation with ArrowRight/ArrowLeft. Click activates.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TabList } from '../ui/TabList'
import { createStore } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core } from '../plugins/core'
import type { NodeState } from '../behaviors/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      general: { id: 'general', data: { name: 'General' } },
      security: { id: 'security', data: { name: 'Security' } },
      advanced: { id: 'advanced', data: { name: 'Advanced' } },
    },
    relationships: {
      [ROOT_ID]: ['general', 'security', 'advanced'],
    },
  })
}

function renderTabList(data: NormalizedData) {
  return render(
    <TabList
      data={data}
      plugins={[core()]}
      renderItem={(tab, state: NodeState) => (
        <span data-testid={`tab-${tab.id}`} data-focused={state.focused} data-selected={state.selected}>
          {(tab.data as Record<string, unknown>)?.name as string}
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

describe('TabList keyboard integration', () => {
  describe('navigation (horizontal)', () => {
    it('ArrowRight moves focus to next tab', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      expect(getFocusedNodeId(container)).toBe('general')

      getNodeElement(container, 'general')!.focus()
      await user.keyboard('{ArrowRight}')

      expect(getFocusedNodeId(container)).toBe('security')
    })

    it('ArrowLeft moves focus to previous tab', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      getNodeElement(container, 'security')!.focus()
      await user.keyboard('{ArrowLeft}')

      expect(getFocusedNodeId(container)).toBe('general')
    })

    it('Home moves focus to first tab', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      getNodeElement(container, 'advanced')!.focus()
      await user.keyboard('{Home}')

      expect(getFocusedNodeId(container)).toBe('general')
    })

    it('End moves focus to last tab', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      getNodeElement(container, 'general')!.focus()
      await user.keyboard('{End}')

      expect(getFocusedNodeId(container)).toBe('advanced')
    })

    it('ArrowDown does nothing (horizontal orientation)', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      getNodeElement(container, 'general')!.focus()
      await user.keyboard('{ArrowDown}')

      expect(getFocusedNodeId(container)).toBe('general')
    })
  })

  describe('activation', () => {
    it('Enter activates (selects) focused tab', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      getNodeElement(container, 'security')!.focus()
      await user.keyboard('{Enter}')

      const testNode = container.querySelector('[data-testid="tab-security"]')
      expect(testNode?.getAttribute('data-selected')).toBe('true')
    })

    it('Space activates (selects) focused tab', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      getNodeElement(container, 'advanced')!.focus()
      await user.keyboard('{ }')

      const testNode = container.querySelector('[data-testid="tab-advanced"]')
      expect(testNode?.getAttribute('data-selected')).toBe('true')
    })
  })

  describe('click', () => {
    it('clicking a tab selects it', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      await user.click(getNodeElement(container, 'security')!)

      const testNode = container.querySelector('[data-testid="tab-security"]')
      expect(testNode?.getAttribute('data-selected')).toBe('true')
    })
  })
})
