/**
 * Integration test: TreeGrid keyboard interactions
 *
 * Tests the full user flow: render → keyboard input → visible result.
 * No engine.dispatch() calls — only userEvent keyboard simulation.
 * This is the pattern for all behavior integration tests.
 */
import { useState } from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TreeGrid } from '../ui/tree-grid'
import { createStore } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core } from '../plugins/core'
import { crud } from '../plugins/crud'
import { clipboard, resetClipboard } from '../plugins/clipboard'
import { history } from '../plugins/history'
import { focusRecovery } from '../plugins/focus-recovery'
import { dnd } from '../plugins/dnd'
import type { NodeState } from '../behaviors/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      src: { id: 'src', name: 'src', type: 'folder' },
      app: { id: 'app', name: 'App.tsx', type: 'file' },
      main: { id: 'main', name: 'main.tsx', type: 'file' },
      lib: { id: 'lib', name: 'lib', type: 'folder' },
      utils: { id: 'utils', name: 'utils.ts', type: 'file' },
    },
    relationships: {
      [ROOT_ID]: ['src', 'lib'],
      src: ['app', 'main'],
      lib: ['utils'],
    },
  })
}

const plugins = [core(), crud(), clipboard(), dnd(), history(), focusRecovery()]

function renderTree(data: NormalizedData, onChange?: (d: NormalizedData) => void) {
  return render(
    <TreeGrid
      data={data}
      plugins={plugins}
      enableEditing
      onChange={onChange}
      renderItem={(node, state: NodeState) => (
        <span data-testid={`node-${node.id}`} data-focused={state.focused} data-selected={state.selected}>
          {node.name as string}
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

describe('TreeGrid keyboard integration', () => {
  beforeEach(() => {
    resetClipboard()
  })

  describe('navigation', () => {
    it('ArrowDown moves focus to next node', async () => {
      const user = userEvent.setup()
      const { container } = renderTree(fixtureData())

      // First node should be focused
      expect(getFocusedNodeId(container)).toBe('src')

      // Focus the element and press ArrowDown
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowDown}')

      expect(getFocusedNodeId(container)).toBe('lib')
    })

    it('ArrowUp moves focus to previous node', async () => {
      const user = userEvent.setup()
      const { container } = renderTree(fixtureData())

      getNodeElement(container, 'lib')!.focus()
      await user.keyboard('{ArrowUp}')

      expect(getFocusedNodeId(container)).toBe('src')
    })

    it('ArrowRight expands a collapsed folder', async () => {
      const user = userEvent.setup()
      const { container } = renderTree(fixtureData())

      // src is collapsed initially — only src and lib visible
      expect(getAllVisibleNodeIds(container)).toEqual(['src', 'lib'])

      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowRight}')

      // After expand, children should be visible
      expect(getAllVisibleNodeIds(container)).toContain('app')
      expect(getAllVisibleNodeIds(container)).toContain('main')
    })

    it('ArrowLeft collapses an expanded folder', async () => {
      const user = userEvent.setup()
      const { container } = renderTree(fixtureData())

      // Expand src first
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowRight}')
      expect(getAllVisibleNodeIds(container)).toContain('app')

      // Collapse src
      await user.keyboard('{ArrowLeft}')
      expect(getAllVisibleNodeIds(container)).not.toContain('app')
    })

    it('Home moves focus to first node', async () => {
      const user = userEvent.setup()
      const { container } = renderTree(fixtureData())

      act(() => { getNodeElement(container, 'lib')!.focus() })
      expect(getFocusedNodeId(container)).toBe('lib')

      await user.keyboard('{Home}')
      expect(getFocusedNodeId(container)).toBe('src')
    })

    it('End moves focus to last node', async () => {
      const user = userEvent.setup()
      const { container } = renderTree(fixtureData())

      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{End}')

      expect(getFocusedNodeId(container)).toBe('lib')
    })
  })

  describe('selection', () => {
    it('Space toggles selection on focused node', async () => {
      const user = userEvent.setup()
      const { container } = renderTree(fixtureData())

      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ }')

      // Check that the node's rendered content shows selected
      const testNode = container.querySelector('[data-testid="node-src"]')
      expect(testNode?.getAttribute('data-selected')).toBe('true')
    })
  })

  describe('expand + navigate into children', () => {
    it('ArrowRight on expanded folder moves focus to first child', async () => {
      const user = userEvent.setup()
      const { container } = renderTree(fixtureData())

      getNodeElement(container, 'src')!.focus()

      // First ArrowRight: expand
      await user.keyboard('{ArrowRight}')
      expect(getAllVisibleNodeIds(container)).toContain('app')

      // Second ArrowRight: focus first child
      await user.keyboard('{ArrowRight}')
      expect(getFocusedNodeId(container)).toBe('app')
    })

    it('ArrowLeft on child moves focus to parent', async () => {
      const user = userEvent.setup()
      const { container } = renderTree(fixtureData())

      // Expand src and navigate to app
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowRight}') // expand
      await user.keyboard('{ArrowRight}') // focus app

      expect(getFocusedNodeId(container)).toBe('app')

      // ArrowLeft on leaf: go to parent
      await user.keyboard('{ArrowLeft}')
      expect(getFocusedNodeId(container)).toBe('src')
    })
  })

  describe('delete + focus recovery', () => {
    it('Delete removes focused node, focus moves to next sibling', async () => {
      const user = userEvent.setup()

      // Use a stateful wrapper to handle onChange → rerender
      function StatefulTree() {
        const [data, setData] = useState(fixtureData())
        return (
          <TreeGrid
            data={data}
            plugins={plugins}
            enableEditing
            onChange={setData}
            renderItem={(node, state: NodeState) => (
              <span data-testid={`node-${node.id}`} data-focused={state.focused} data-selected={state.selected}>
                {node.name as string}
              </span>
            )}
          />
        )
      }

      const { container } = render(<StatefulTree />)

      // Expand src, navigate to app
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowRight}') // expand
      await user.keyboard('{ArrowRight}') // focus app

      expect(getFocusedNodeId(container)).toBe('app')

      // Delete app
      await user.keyboard('{Delete}')

      // app should be gone, focus on main (next sibling)
      expect(getNodeElement(container, 'app')).toBeNull()
      expect(getFocusedNodeId(container)).toBe('main')
    })
  })
})
