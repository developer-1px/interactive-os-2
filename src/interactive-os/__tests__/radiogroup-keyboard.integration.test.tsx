/**
 * Integration test: RadioGroup keyboard interactions
 *
 * Tests the full user flow: render → keyboard/click input → visible result.
 * No engine.dispatch() calls — only userEvent simulation.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RadioGroup } from '../ui/radiogroup'
import { createStore } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core } from '../plugins/core'
import type { NodeState } from '../behaviors/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      small: { id: 'small', data: { label: 'Small' } },
      medium: { id: 'medium', data: { label: 'Medium' } },
      large: { id: 'large', data: { label: 'Large' } },
    },
    relationships: {
      [ROOT_ID]: ['small', 'medium', 'large'],
    },
  })
}

function renderRadioGroup(data: NormalizedData) {
  return render(
    <RadioGroup
      data={data}
      plugins={[core()]}
      renderItem={(item, state: NodeState) => (
        <span
          data-testid={`item-${item.id}`}
          data-focused={state.focused}
          data-selected={state.selected}
        >
          {(item.data as Record<string, unknown>)?.label as string}
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

describe('RadioGroup keyboard integration', () => {
  describe('navigation (wrapping)', () => {
    it('ArrowDown from last item wraps to first', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNodeElement(container, 'large')!.focus()
      await user.keyboard('{ArrowDown}')

      expect(getFocusedNodeId(container)).toBe('small')
    })

    it('ArrowUp from first item wraps to last', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNodeElement(container, 'small')!.focus()
      await user.keyboard('{ArrowUp}')

      expect(getFocusedNodeId(container)).toBe('large')
    })

    it('ArrowRight moves to next (wrapping)', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNodeElement(container, 'small')!.focus()
      await user.keyboard('{ArrowRight}')

      expect(getFocusedNodeId(container)).toBe('medium')
    })

    it('ArrowRight from last item wraps to first', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNodeElement(container, 'large')!.focus()
      await user.keyboard('{ArrowRight}')

      expect(getFocusedNodeId(container)).toBe('small')
    })

    it('ArrowLeft moves to previous (wrapping)', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNodeElement(container, 'medium')!.focus()
      await user.keyboard('{ArrowLeft}')

      expect(getFocusedNodeId(container)).toBe('small')
    })

    it('ArrowLeft from first item wraps to last', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNodeElement(container, 'small')!.focus()
      await user.keyboard('{ArrowLeft}')

      expect(getFocusedNodeId(container)).toBe('large')
    })
  })

  describe('selection (single)', () => {
    it('Space selects focused radio', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNodeElement(container, 'medium')!.focus()
      await user.keyboard('{ }')

      const testNode = container.querySelector('[data-testid="item-medium"]')
      expect(testNode?.getAttribute('data-selected')).toBe('true')
    })

    it('selecting another radio deselects previous', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNodeElement(container, 'small')!.focus()
      await user.keyboard('{ }')
      expect(container.querySelector('[data-testid="item-small"]')?.getAttribute('data-selected')).toBe('true')

      getNodeElement(container, 'large')!.focus()
      await user.keyboard('{ }')

      expect(container.querySelector('[data-testid="item-small"]')?.getAttribute('data-selected')).toBe('false')
      expect(container.querySelector('[data-testid="item-large"]')?.getAttribute('data-selected')).toBe('true')
    })
  })

  describe('click', () => {
    it('clicking a radio selects it', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      await user.click(getNodeElement(container, 'medium')!)

      const testNode = container.querySelector('[data-testid="item-medium"]')
      expect(testNode?.getAttribute('data-selected')).toBe('true')
    })

    it('clicking another radio deselects previous', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      await user.click(getNodeElement(container, 'small')!)
      await user.click(getNodeElement(container, 'large')!)

      expect(container.querySelector('[data-testid="item-small"]')?.getAttribute('data-selected')).toBe('false')
      expect(container.querySelector('[data-testid="item-large"]')?.getAttribute('data-selected')).toBe('true')
    })
  })
})
