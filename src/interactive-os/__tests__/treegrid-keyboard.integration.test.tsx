/**
 * Integration test: TreeGrid keyboard interactions
 *
 * Tests the full user flow: render → keyboard input → visible result.
 * No engine.dispatch() calls — only userEvent keyboard simulation.
 * This is the pattern for all behavior integration tests.
 */
import { useState } from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TreeGrid } from '../ui/TreeGrid'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core } from '../plugins/core'
import { crud } from '../plugins/crud'
import { clipboard, resetClipboard } from '../plugins/clipboard'
import { history } from '../plugins/history'
import { focusRecovery } from '../plugins/focusRecovery'
import { dnd } from '../plugins/dnd'
import type { NodeState } from '../behaviors/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      src: { id: 'src', data: { name: 'src', type: 'folder' } },
      app: { id: 'app', data: { name: 'App.tsx', type: 'file' } },
      main: { id: 'main', data: { name: 'main.tsx', type: 'file' } },
      lib: { id: 'lib', data: { name: 'lib', type: 'folder' } },
      utils: { id: 'utils', data: { name: 'utils.ts', type: 'file' } },
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
          {(node.data as Record<string, unknown>)?.name as string}
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
          {(node.data as Record<string, unknown>)?.name as string}
        </span>
      )}
    />
  )
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

  describe('dnd', () => {
    it('Alt+ArrowUp moves node up among siblings', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulTree />)

      // Expand src to see children
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowRight}') // expand
      await user.keyboard('{ArrowRight}') // focus app
      await user.keyboard('{ArrowDown}') // focus main

      expect(getFocusedNodeId(container)).toBe('main')

      // Move main up (swap with app)
      await user.keyboard('{Alt>}{ArrowUp}{/Alt}')
      const visible = getAllVisibleNodeIds(container)
      const mainIdx = visible.indexOf('main')
      const appIdx = visible.indexOf('app')
      expect(mainIdx).toBeLessThan(appIdx)
    })

    it('Alt+ArrowDown moves node down among siblings', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulTree />)

      // Expand src, focus app
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowRight}') // expand
      await user.keyboard('{ArrowRight}') // focus app

      expect(getFocusedNodeId(container)).toBe('app')

      // Move app down (swap with main)
      await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
      const visible = getAllVisibleNodeIds(container)
      const appIdx = visible.indexOf('app')
      const mainIdx = visible.indexOf('main')
      expect(appIdx).toBeGreaterThan(mainIdx)
    })

    it('Alt+ArrowLeft moves node out to parent level', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulTree />)

      // Expand src, focus app
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowRight}') // expand
      await user.keyboard('{ArrowRight}') // focus app

      expect(getFocusedNodeId(container)).toBe('app')

      // Move app out to root level (after src)
      await user.keyboard('{Alt>}{ArrowLeft}{/Alt}')
      const visible = getAllVisibleNodeIds(container)
      // app should now be a root-level sibling, appearing between src and lib
      expect(visible.indexOf('app')).toBeGreaterThan(visible.indexOf('src'))
    })

    it('Alt+ArrowRight moves node into previous sibling', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulTree />)

      // lib is 2nd root child. Move it into src (previous sibling)
      getNodeElement(container, 'lib')!.focus()
      await user.keyboard('{Alt>}{ArrowRight}{/Alt}')

      // Expand src to see lib as its child
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowRight}') // expand
      const visible = getAllVisibleNodeIds(container)
      expect(visible).toContain('lib')
      // lib should be under src now
      expect(visible.indexOf('lib')).toBeGreaterThan(visible.indexOf('src'))
    })

    it('Alt+ArrowDown then Mod+Z undoes reorder', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulTree />)

      // Expand src, focus app
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowRight}') // expand
      await user.keyboard('{ArrowRight}') // focus app

      const visibleBefore = getAllVisibleNodeIds(container)

      // Move app down
      await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
      const visibleAfter = getAllVisibleNodeIds(container)
      expect(visibleAfter).not.toEqual(visibleBefore)

      // Undo
      await user.keyboard('{Control>}z{/Control}')
      expect(getAllVisibleNodeIds(container)).toEqual(visibleBefore)
    })

    it('Alt+ArrowLeft then Mod+Z undoes move-out', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulTree />)

      // Expand src, focus app
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowRight}') // expand
      await user.keyboard('{ArrowRight}') // focus app

      const visibleBefore = getAllVisibleNodeIds(container)

      // Move app out to root
      await user.keyboard('{Alt>}{ArrowLeft}{/Alt}')

      // Undo — should restore app under src
      await user.keyboard('{Control>}z{/Control}')
      // Re-expand src to see children
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowRight}') // expand
      expect(getAllVisibleNodeIds(container)).toEqual(visibleBefore)
    })

    it('Alt+ArrowUp at first position is no-op', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulTree />)

      const visibleBefore = getAllVisibleNodeIds(container)
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{Alt>}{ArrowUp}{/Alt}')
      expect(getAllVisibleNodeIds(container)).toEqual(visibleBefore)
    })

    it('Alt+ArrowDown at last position is no-op', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulTree />)

      const visibleBefore = getAllVisibleNodeIds(container)
      getNodeElement(container, 'lib')!.focus()
      await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
      expect(getAllVisibleNodeIds(container)).toEqual(visibleBefore)
    })

    it('Alt+ArrowLeft at root level is no-op', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulTree />)

      const visibleBefore = getAllVisibleNodeIds(container)
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{Alt>}{ArrowLeft}{/Alt}')
      expect(getAllVisibleNodeIds(container)).toEqual(visibleBefore)
    })

    it('Alt+ArrowRight at first position is no-op (no prev sibling)', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulTree />)

      // Expand src and focus first child (app)
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowRight}') // expand
      await user.keyboard('{ArrowRight}') // focus app

      const visibleBefore = getAllVisibleNodeIds(container)
      // app is first child — moveIn needs a previous sibling
      await user.keyboard('{Alt>}{ArrowRight}{/Alt}')
      expect(getAllVisibleNodeIds(container)).toEqual(visibleBefore)
    })
  })

  describe('clipboard cut and paste', () => {
    it('cut then paste moves node to new location', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulTree />)

      // Expand src, focus app, cut it
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowRight}') // expand
      await user.keyboard('{ArrowRight}') // focus app
      fireEvent.cut(getNodeElement(container, 'app')!) // cut (native event)

      // Navigate to lib and paste
      act(() => { getNodeElement(container, 'lib')!.focus() })
      fireEvent.paste(getNodeElement(container, 'lib')!) // paste (native event)

      // app should be removed from src's children and moved to lib's children
      // Expand lib to verify
      await user.keyboard('{ArrowRight}') // expand lib
      const visible = getAllVisibleNodeIds(container)
      expect(visible).toContain('app')
      // app should be after lib (inside lib's children)
      expect(visible.indexOf('app')).toBeGreaterThan(visible.indexOf('lib'))
    })

    it('copy then paste copies node with new ID', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulTree />)

      // Expand src, copy app
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowRight}') // expand
      await user.keyboard('{ArrowRight}') // focus app
      fireEvent.copy(getNodeElement(container, 'app')!) // copy (native event)

      // Navigate to lib and paste
      act(() => { getNodeElement(container, 'lib')!.focus() })
      fireEvent.paste(getNodeElement(container, 'lib')!) // paste (native event)

      // Original app should still exist under src
      const visible = getAllVisibleNodeIds(container)
      expect(visible).toContain('app')

      // Expand lib to see the copy
      act(() => { getNodeElement(container, 'lib')!.focus() })
      await user.keyboard('{ArrowRight}') // expand lib
      const visibleAfter = getAllVisibleNodeIds(container)
      // There should be a new node (copy of app) — total visible count increased
      expect(visibleAfter.length).toBeGreaterThan(visible.length)
    })
  })

  describe('undo scenarios', () => {
    it('Mod+Z undoes delete and restores node', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulTree />)

      // Delete src (top-level folder with children)
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{Delete}')
      expect(getNodeElement(container, 'src')).toBeNull()

      // Undo
      getNodeElement(container, 'lib')!.focus()
      await user.keyboard('{Control>}z{/Control}')
      expect(getNodeElement(container, 'src')).not.toBeNull()
    })

    it('Mod+Z does not undo expand (expand is view state, not content)', async () => {
      const user = userEvent.setup()
      const { container } = renderTree(fixtureData())

      expect(getAllVisibleNodeIds(container)).toEqual(['src', 'lib'])

      // Expand src
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowRight}')
      expect(getAllVisibleNodeIds(container)).toContain('app')

      // Mod+Z — expand is view state, nothing to undo
      await user.keyboard('{Control>}z{/Control}')
      // Folder stays expanded
      expect(getAllVisibleNodeIds(container)).toContain('app')
    })

    it('Mod+Shift+Z redoes after undo', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulTree />)

      // Delete src (content change)
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{Delete}')
      expect(getNodeElement(container, 'src')).toBeNull()

      // Undo
      getNodeElement(container, 'lib')!.focus()
      await user.keyboard('{Control>}z{/Control}')
      expect(getNodeElement(container, 'src')).not.toBeNull()

      // Redo
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}')
      expect(getNodeElement(container, 'src')).toBeNull()
    })

    it('Mod+Z on empty history is no-op', async () => {
      const user = userEvent.setup()
      const { container } = renderTree(fixtureData())

      const visibleBefore = getAllVisibleNodeIds(container)
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{Control>}z{/Control}')
      expect(getAllVisibleNodeIds(container)).toEqual(visibleBefore)
    })

    it('Mod+Z skips focus-only changes and undoes content change (V1/V9)', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulTree />)

      // Focus src, expand, navigate to app (3 focus changes)
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowRight}') // expand
      await user.keyboard('{ArrowRight}') // focus app
      await user.keyboard('{ArrowDown}') // focus main

      expect(getFocusedNodeId(container)).toBe('main')

      // Delete main (content change)
      await user.keyboard('{Delete}')
      expect(getNodeElement(container, 'main')).toBeNull()

      // Mod+Z — should undo delete, skipping all focus/expand moves
      await user.keyboard('{Control>}z{/Control}')
      expect(getNodeElement(container, 'main')).not.toBeNull()
    })

    it('Mod+Z after only focus/selection changes is no-op (V6)', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulTree />)

      const visibleBefore = getAllVisibleNodeIds(container)

      // Focus moves + selection (all view state)
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowDown}') // focus lib
      await user.keyboard('{ }') // select lib

      // Mod+Z — nothing to undo (focus and selection are view state)
      await user.keyboard('{Control>}z{/Control}')
      expect(getAllVisibleNodeIds(container)).toEqual(visibleBefore)
    })

    it('undo then new command clears redo future (V7/E4)', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulTree />)

      // Delete src
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{Delete}')
      expect(getNodeElement(container, 'src')).toBeNull()

      // Undo
      getNodeElement(container, 'lib')!.focus()
      await user.keyboard('{Control>}z{/Control}')
      expect(getNodeElement(container, 'src')).not.toBeNull()

      // New command (delete lib) — should clear redo future
      getNodeElement(container, 'lib')!.focus()
      await user.keyboard('{Delete}')
      expect(getNodeElement(container, 'lib')).toBeNull()

      // Redo should NOT redo the original src deletion — future was cleared
      await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}')
      expect(getNodeElement(container, 'src')).not.toBeNull()
    })

    it('expand then delete — undo restores file, folder stays expanded (V4)', async () => {
      const user = userEvent.setup()
      const { container } = render(<StatefulTree />)

      // Expand src
      getNodeElement(container, 'src')!.focus()
      await user.keyboard('{ArrowRight}') // expand
      await user.keyboard('{ArrowRight}') // focus app

      // Delete app
      await user.keyboard('{Delete}')
      expect(getNodeElement(container, 'app')).toBeNull()

      // Undo — file restored, folder stays expanded
      await user.keyboard('{Control>}z{/Control}')
      expect(getNodeElement(container, 'app')).not.toBeNull()
      expect(getAllVisibleNodeIds(container)).toContain('app')
      expect(getAllVisibleNodeIds(container)).toContain('main')
    })
  })

  describe('delete + focus recovery', () => {
    it('Delete removes focused node, focus moves to next sibling', async () => {
      const user = userEvent.setup()

      // Use a stateful wrapper to handle onChange → rerender

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
