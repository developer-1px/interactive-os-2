/**
 * Integration test: Toolbar keyboard interactions
 *
 * Tests the full user flow: render → keyboard input → visible result.
 * Horizontal navigation with ArrowRight/ArrowLeft. Click activates.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../components/aria'
import { toolbar } from '../behaviors/toolbar'
import { createStore } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core } from '../plugins/core'
import type { NodeState } from '../behaviors/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      bold: { id: 'bold', data: { name: 'Bold' } },
      italic: { id: 'italic', data: { name: 'Italic' } },
      underline: { id: 'underline', data: { name: 'Underline' } },
    },
    relationships: {
      [ROOT_ID]: ['bold', 'italic', 'underline'],
    },
  })
}

function renderToolbar(data: NormalizedData) {
  return render(
    <Aria behavior={toolbar} data={data} plugins={[core()]}>
      <Aria.Node
        render={(node, state: NodeState) => (
          <span data-testid={`btn-${node.id}`} data-focused={state.focused} data-selected={state.selected}>
            {(node.data as Record<string, unknown>)?.name as string}
          </span>
        )}
      />
    </Aria>
  )
}

function getFocusedNodeId(container: HTMLElement): string | null {
  const focused = container.querySelector('[tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

function getNodeElement(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

describe('Toolbar keyboard integration', () => {
  describe('navigation (horizontal)', () => {
    it('ArrowRight moves focus to next button', async () => {
      const user = userEvent.setup()
      const { container } = renderToolbar(fixtureData())

      expect(getFocusedNodeId(container)).toBe('bold')

      getNodeElement(container, 'bold')!.focus()
      await user.keyboard('{ArrowRight}')

      expect(getFocusedNodeId(container)).toBe('italic')
    })

    it('ArrowLeft moves focus to previous button', async () => {
      const user = userEvent.setup()
      const { container } = renderToolbar(fixtureData())

      getNodeElement(container, 'italic')!.focus()
      await user.keyboard('{ArrowLeft}')

      expect(getFocusedNodeId(container)).toBe('bold')
    })

    it('Home moves focus to first button', async () => {
      const user = userEvent.setup()
      const { container } = renderToolbar(fixtureData())

      getNodeElement(container, 'underline')!.focus()
      await user.keyboard('{Home}')

      expect(getFocusedNodeId(container)).toBe('bold')
    })

    it('End moves focus to last button', async () => {
      const user = userEvent.setup()
      const { container } = renderToolbar(fixtureData())

      getNodeElement(container, 'bold')!.focus()
      await user.keyboard('{End}')

      expect(getFocusedNodeId(container)).toBe('underline')
    })
  })

  describe('activation', () => {
    it('Enter activates (selects) focused button', async () => {
      const user = userEvent.setup()
      const { container } = renderToolbar(fixtureData())

      getNodeElement(container, 'bold')!.focus()
      await user.keyboard('{Enter}')

      const testNode = container.querySelector('[data-testid="btn-bold"]')
      expect(testNode?.getAttribute('data-selected')).toBe('true')
    })

    it('Space activates (selects) focused button', async () => {
      const user = userEvent.setup()
      const { container } = renderToolbar(fixtureData())

      getNodeElement(container, 'italic')!.focus()
      await user.keyboard('{ }')

      const testNode = container.querySelector('[data-testid="btn-italic"]')
      expect(testNode?.getAttribute('data-selected')).toBe('true')
    })
  })

  describe('click', () => {
    it('clicking a button selects it', async () => {
      const user = userEvent.setup()
      const { container } = renderToolbar(fixtureData())

      await user.click(getNodeElement(container, 'italic')!)

      const testNode = container.querySelector('[data-testid="btn-italic"]')
      expect(testNode?.getAttribute('data-selected')).toBe('true')
    })
  })
})
