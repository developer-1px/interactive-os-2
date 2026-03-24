/**
 * Integration test: Menu keyboard interactions
 *
 * Tests the full user flow: render → keyboard input → visible result.
 * Vertical navigation with submenu expand/collapse via ArrowRight/ArrowLeft.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MenuList } from '../ui/MenuList'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import { core } from '../plugins/core'
import type { NodeState } from '../pattern/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      file: { id: 'file', data: { name: 'File' } },
      newFile: { id: 'newFile', data: { name: 'New File' } },
      open: { id: 'open', data: { name: 'Open' } },
      edit: { id: 'edit', data: { name: 'Edit' } },
      copy: { id: 'copy', data: { name: 'Copy' } },
      paste: { id: 'paste', data: { name: 'Paste' } },
      help: { id: 'help', data: { name: 'Help' } },
    },
    relationships: {
      [ROOT_ID]: ['file', 'edit', 'help'],
      file: ['newFile', 'open'],
      edit: ['copy', 'paste'],
    },
  })
}

function renderMenu(data: NormalizedData) {
  return render(
    <MenuList
      data={data}
      plugins={[core()]}
      renderItem={(props, item, state: NodeState) => (
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

function getAllVisibleNodeIds(container: HTMLElement): string[] {
  const nodes = container.querySelectorAll('[data-node-id]')
  return Array.from(nodes).map((n) => n.getAttribute('data-node-id')!).filter((id) => id)
}

describe('Menu keyboard integration', () => {
  describe('navigation (vertical)', () => {
    it('ArrowDown moves focus to next item', async () => {
      const user = userEvent.setup()
      const { container } = renderMenu(fixtureData())

      expect(getFocusedNodeId(container)).toBe('file')

      getNodeElement(container, 'file')!.focus()
      await user.keyboard('{ArrowDown}')

      expect(getFocusedNodeId(container)).toBe('edit')
    })

    it('ArrowUp moves focus to previous item', async () => {
      const user = userEvent.setup()
      const { container } = renderMenu(fixtureData())

      getNodeElement(container, 'edit')!.focus()
      await user.keyboard('{ArrowUp}')

      expect(getFocusedNodeId(container)).toBe('file')
    })

    it('Home moves focus to first item', async () => {
      const user = userEvent.setup()
      const { container } = renderMenu(fixtureData())

      getNodeElement(container, 'help')!.focus()
      await user.keyboard('{Home}')

      expect(getFocusedNodeId(container)).toBe('file')
    })

    it('End moves focus to last item', async () => {
      const user = userEvent.setup()
      const { container } = renderMenu(fixtureData())

      getNodeElement(container, 'file')!.focus()
      await user.keyboard('{End}')

      expect(getFocusedNodeId(container)).toBe('help')
    })
  })

  describe('submenu expand/collapse', () => {
    it('ArrowRight expands submenu on item with children', async () => {
      const user = userEvent.setup()
      const { container } = renderMenu(fixtureData())

      // Initially only top-level items visible
      expect(getAllVisibleNodeIds(container)).toEqual(['file', 'edit', 'help'])

      getNodeElement(container, 'file')!.focus()
      await user.keyboard('{ArrowRight}')

      // After expand, submenu items visible
      expect(getAllVisibleNodeIds(container)).toContain('newFile')
      expect(getAllVisibleNodeIds(container)).toContain('open')
    })

    it('ArrowRight on expanded item focuses first child', async () => {
      const user = userEvent.setup()
      const { container } = renderMenu(fixtureData())

      getNodeElement(container, 'file')!.focus()
      await user.keyboard('{ArrowRight}') // expand
      await user.keyboard('{ArrowRight}') // focus first child

      expect(getFocusedNodeId(container)).toBe('newFile')
    })

    it('ArrowLeft collapses expanded submenu', async () => {
      const user = userEvent.setup()
      const { container } = renderMenu(fixtureData())

      // Expand file submenu
      getNodeElement(container, 'file')!.focus()
      await user.keyboard('{ArrowRight}')
      expect(getAllVisibleNodeIds(container)).toContain('newFile')

      // Collapse
      await user.keyboard('{ArrowLeft}')
      expect(getAllVisibleNodeIds(container)).not.toContain('newFile')
    })

    it('ArrowLeft on child focuses parent', async () => {
      const user = userEvent.setup()
      const { container } = renderMenu(fixtureData())

      // Expand and navigate to child
      getNodeElement(container, 'file')!.focus()
      await user.keyboard('{ArrowRight}') // expand
      await user.keyboard('{ArrowRight}') // focus newFile

      expect(getFocusedNodeId(container)).toBe('newFile')

      // ArrowLeft on leaf → focus parent
      await user.keyboard('{ArrowLeft}')
      expect(getFocusedNodeId(container)).toBe('file')
    })
  })

  describe('activation', () => {
    it('Enter on leaf item selects it', async () => {
      const user = userEvent.setup()
      const { container } = renderMenu(fixtureData())

      getNodeElement(container, 'help')!.focus()
      await user.keyboard('{Enter}')

      const testNode = container.querySelector('[data-testid="item-help"]')
      expect(testNode?.getAttribute('data-selected')).toBe('true')
    })

    it('Enter on parent item toggles expand', async () => {
      const user = userEvent.setup()
      const { container } = renderMenu(fixtureData())

      getNodeElement(container, 'edit')!.focus()
      await user.keyboard('{Enter}')

      expect(getAllVisibleNodeIds(container)).toContain('copy')
      expect(getAllVisibleNodeIds(container)).toContain('paste')
    })
  })

  describe('click', () => {
    it('clicking a parent item expands submenu', async () => {
      const user = userEvent.setup()
      const { container } = renderMenu(fixtureData())

      expect(getAllVisibleNodeIds(container)).toEqual(['file', 'edit', 'help'])

      await user.click(getNodeElement(container, 'file')!)

      expect(getAllVisibleNodeIds(container)).toContain('newFile')
      expect(getAllVisibleNodeIds(container)).toContain('open')
    })

    it('clicking a leaf item selects it', async () => {
      const user = userEvent.setup()
      const { container } = renderMenu(fixtureData())

      await user.click(getNodeElement(container, 'help')!)

      const testNode = container.querySelector('[data-testid="item-help"]')
      expect(testNode?.getAttribute('data-selected')).toBe('true')
    })
  })
})
