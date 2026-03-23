/**
 * Integration test: ListBox keyboard interactions
 *
 * Tests the full user flow: render → keyboard/click input → visible result.
 * No engine.dispatch() calls — only userEvent simulation.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListBox } from '../ui/ListBox'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core } from '../plugins/core'
import type { NodeState } from '../behaviors/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      apple: { id: 'apple', data: { name: 'Apple' } },
      banana: { id: 'banana', data: { name: 'Banana' } },
      cherry: { id: 'cherry', data: { name: 'Cherry' } },
      date: { id: 'date', data: { name: 'Date' } },
    },
    relationships: {
      [ROOT_ID]: ['apple', 'banana', 'cherry', 'date'],
    },
  })
}

function renderListBox(data: NormalizedData) {
  return render(
    <ListBox
      data={data}
      plugins={[core()]}
      renderItem={(item, state: NodeState, props) => (
        <span {...props} data-testid={`item-${item.id}`} data-focused={state.focused} data-selected={state.selected}>
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

describe('ListBox keyboard integration', () => {
  describe('navigation (vertical)', () => {
    it('ArrowDown moves focus to next item', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      expect(getFocusedNodeId(container)).toBe('apple')

      getNodeElement(container, 'apple')!.focus()
      await user.keyboard('{ArrowDown}')

      expect(getFocusedNodeId(container)).toBe('banana')
    })

    it('ArrowUp moves focus to previous item', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNodeElement(container, 'banana')!.focus()
      await user.keyboard('{ArrowUp}')

      expect(getFocusedNodeId(container)).toBe('apple')
    })

    it('Home moves focus to first item', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNodeElement(container, 'cherry')!.focus()
      await user.keyboard('{Home}')

      expect(getFocusedNodeId(container)).toBe('apple')
    })

    it('End moves focus to last item', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNodeElement(container, 'apple')!.focus()
      await user.keyboard('{End}')

      expect(getFocusedNodeId(container)).toBe('date')
    })

    it('ArrowDown at last item stays on last item', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNodeElement(container, 'date')!.focus()
      await user.keyboard('{ArrowDown}')

      expect(getFocusedNodeId(container)).toBe('date')
    })

    it('ArrowUp at first item stays on first item', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNodeElement(container, 'apple')!.focus()
      await user.keyboard('{ArrowUp}')

      expect(getFocusedNodeId(container)).toBe('apple')
    })
  })

  describe('selection', () => {
    it('Space toggles selection on focused item', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNodeElement(container, 'apple')!.focus()
      await user.keyboard('{ }')

      const testNode = container.querySelector('[data-testid="item-apple"]')
      expect(testNode?.getAttribute('data-selected')).toBe('true')
    })

    it('Space again deselects the item', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNodeElement(container, 'apple')!.focus()
      await user.keyboard('{ }')
      await user.keyboard('{ }')

      const testNode = container.querySelector('[data-testid="item-apple"]')
      expect(testNode?.getAttribute('data-selected')).toBe('false')
    })
  })

  describe('click', () => {
    it('clicking an item selects it', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      await user.click(getNodeElement(container, 'banana')!)

      const testNode = container.querySelector('[data-testid="item-banana"]')
      expect(testNode?.getAttribute('data-selected')).toBe('true')
    })
  })
})
