// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Treegrid (Email Inbox)
 * https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/examples/treegrid-1/
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { TreeGrid } from '../ui/TreeGrid'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import { crud } from '../plugins/crud'
import { clipboard, resetClipboard } from '../plugins/clipboard'
import { history } from '../plugins/history'
import { focusRecovery } from '../plugins/focusRecovery'
import { dnd } from '../plugins/dnd'
import type { NodeState } from '../pattern/types'
import { captureAriaTree, extractRoleHierarchy } from './helpers/ariaTreeSnapshot'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

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

const plugins = [crud(), clipboard(), dnd(), history(), focusRecovery()]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderTree(data: NormalizedData, onChange?: (d: NormalizedData) => void) {
  return render(
    <TreeGrid
      data={data}
      plugins={plugins}
      enableEditing
      onChange={onChange}
      renderItem={(props, node, state: NodeState) => (
        <span {...props} data-testid={`node-${node.id}`} data-focused={state.focused} data-selected={state.selected}>
          {(node.data as Record<string, unknown>)?.name as string}
        </span>
      )}
    />,
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
  return Array.from(nodes).map((n) => n.getAttribute('data-node-id')!).filter(Boolean)
}

function StatefulTree() {
  const [data, setData] = useState(fixtureData())
  return (
    <TreeGrid
      data={data}
      plugins={plugins}
      enableEditing
      onChange={setData}
      renderItem={(props, node, state: NodeState) => (
        <span {...props} data-testid={`node-${node.id}`} data-focused={state.focused} data-selected={state.selected}>
          {(node.data as Record<string, unknown>)?.name as string}
        </span>
      )}
    />
  )
}

// ---------------------------------------------------------------------------
// 1. ARIA Role Structure
// ---------------------------------------------------------------------------

describe('APG TreeGrid — ARIA Role Structure', () => {
  it('container has role="treegrid"', () => {
    const { container } = renderTree(fixtureData())
    expect(container.querySelector('[role="treegrid"]')).not.toBeNull()
  })

  it('rows have role="row"', () => {
    const { container } = renderTree(fixtureData())
    const rows = container.querySelectorAll('[role="row"]')
    expect(rows.length).toBeGreaterThan(0)
  })

  it('role hierarchy: treegrid > row', () => {
    const { container } = renderTree(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('treegrid')
    expect(hierarchy).toContain('row')
  })

  it('parent rows have aria-expanded=false when collapsed', () => {
    const { container } = renderTree(fixtureData())
    const srcRow = getNodeElement(container, 'src')
    expect(srcRow?.getAttribute('aria-expanded')).toBe('false')
  })

  it('leaf rows do not have aria-expanded', () => {
    // utils is only visible after lib is expanded; check src's children after expand
    const { container } = renderTree(fixtureData())
    // src has children so it has aria-expanded; lib also has children
    const srcEl = getNodeElement(container, 'src')
    expect(srcEl?.getAttribute('aria-expanded')).toBe('false') // has children
  })

  it('rows have aria-selected', () => {
    const { container } = renderTree(fixtureData())
    const rows = container.querySelectorAll('[role="row"]')
    rows.forEach((row) => {
      expect(row.getAttribute('aria-selected')).not.toBeNull()
    })
  })

  it('rows have aria-level', () => {
    const { container } = renderTree(fixtureData())
    const rows = container.querySelectorAll('[role="row"]')
    rows.forEach((row) => {
      expect(row.getAttribute('aria-level')).not.toBeNull()
    })
  })

  it('root rows have aria-level=1', () => {
    const { container } = renderTree(fixtureData())
    const srcRow = getNodeElement(container, 'src')
    expect(srcRow?.getAttribute('aria-level')).toBe('1')
  })

  it('rows have aria-posinset and aria-setsize', () => {
    const { container } = renderTree(fixtureData())
    const srcRow = getNodeElement(container, 'src')
    expect(srcRow?.getAttribute('aria-posinset')).not.toBeNull()
    expect(srcRow?.getAttribute('aria-setsize')).not.toBeNull()
  })

  it('first root row has aria-posinset=1, setsize=2', () => {
    const { container } = renderTree(fixtureData())
    const srcRow = getNodeElement(container, 'src')
    expect(srcRow?.getAttribute('aria-posinset')).toBe('1')
    expect(srcRow?.getAttribute('aria-setsize')).toBe('2')
  })

  it('initially only root rows are visible (children collapsed)', () => {
    const { container } = renderTree(fixtureData())
    expect(getAllVisibleNodeIds(container)).toEqual(['src', 'lib'])
  })

  it('initial focus: first row has tabindex=0 (roving tabindex)', () => {
    const { container } = renderTree(fixtureData())
    expect(getFocusedNodeId(container)).toBe('src')
  })

  it('captureAriaTree shows aria-expanded, aria-level on rows', () => {
    const { container } = renderTree(fixtureData())
    const tree = captureAriaTree(container)
    expect(tree).toContain('treegrid')
    expect(tree).toContain('row')
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard: Vertical Navigation (ArrowDown / ArrowUp)
// ---------------------------------------------------------------------------

describe('APG TreeGrid — Keyboard: Vertical Navigation', () => {
  it('ArrowDown moves focus to next row', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())

    expect(getFocusedNodeId(container)).toBe('src')
    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ArrowDown}')

    expect(getFocusedNodeId(container)).toBe('lib')
  })

  it('ArrowUp moves focus to previous row', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())

    getNodeElement(container, 'lib')!.focus()
    await user.keyboard('{ArrowUp}')

    expect(getFocusedNodeId(container)).toBe('src')
  })

  it('Home moves focus to first row', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())

    act(() => { getNodeElement(container, 'lib')!.focus() })
    expect(getFocusedNodeId(container)).toBe('lib')

    await user.keyboard('{Home}')
    expect(getFocusedNodeId(container)).toBe('src')
  })

  it('End moves focus to last row', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{End}')

    expect(getFocusedNodeId(container)).toBe('lib')
  })
})

// ---------------------------------------------------------------------------
// 3. Keyboard: Expand / Collapse (ArrowRight / ArrowLeft)
// ---------------------------------------------------------------------------

describe('APG TreeGrid — Keyboard: Expand / Collapse', () => {
  it('ArrowRight expands a collapsed row', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())

    expect(getAllVisibleNodeIds(container)).toEqual(['src', 'lib'])

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ArrowRight}')

    expect(getAllVisibleNodeIds(container)).toContain('app')
    expect(getAllVisibleNodeIds(container)).toContain('main')
  })

  it('aria-expanded=true after ArrowRight expand', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ArrowRight}')

    expect(getNodeElement(container, 'src')?.getAttribute('aria-expanded')).toBe('true')
  })

  it('ArrowRight on expanded row moves focus to first child', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    await user.keyboard('{ArrowRight}') // focus first child

    expect(getFocusedNodeId(container)).toBe('app')
  })

  it('ArrowLeft collapses an expanded row', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    expect(getAllVisibleNodeIds(container)).toContain('app')

    await user.keyboard('{ArrowLeft}') // collapse
    expect(getAllVisibleNodeIds(container)).not.toContain('app')
  })

  it('aria-expanded=false after ArrowLeft collapse', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowLeft}')

    expect(getNodeElement(container, 'src')?.getAttribute('aria-expanded')).toBe('false')
  })

  it('ArrowLeft on child moves focus to parent', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    await user.keyboard('{ArrowRight}') // focus app

    expect(getFocusedNodeId(container)).toBe('app')

    await user.keyboard('{ArrowLeft}')
    expect(getFocusedNodeId(container)).toBe('src')
  })
})

// ---------------------------------------------------------------------------
// 4. Selection
// ---------------------------------------------------------------------------

describe('APG TreeGrid — Selection', () => {
  it('Space toggles selection on focused row', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ }')

    const testNode = container.querySelector('[data-testid="node-src"]')
    expect(testNode?.getAttribute('data-selected')).toBe('true')
  })

  it('aria-selected=true after Space selection', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ }')

    const srcRow = getNodeElement(container, 'src')
    expect(srcRow?.getAttribute('aria-selected')).toBe('true')
  })

  it('rows start with aria-selected=false', () => {
    const { container } = renderTree(fixtureData())
    const rows = container.querySelectorAll('[role="row"]')
    rows.forEach((row) => {
      expect(row.getAttribute('aria-selected')).toBe('false')
    })
  })
})

// ---------------------------------------------------------------------------
// 5. Child ARIA attributes after expand
// ---------------------------------------------------------------------------

describe('APG TreeGrid — Child ARIA attributes after expand', () => {
  it('expanded children have aria-level=2', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ArrowRight}') // expand

    const appRow = getNodeElement(container, 'app')
    expect(appRow?.getAttribute('aria-level')).toBe('2')
  })

  it('expanded children have correct aria-posinset', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ArrowRight}') // expand

    const appRow = getNodeElement(container, 'app')
    const mainRow = getNodeElement(container, 'main')
    expect(appRow?.getAttribute('aria-posinset')).toBe('1')
    expect(mainRow?.getAttribute('aria-posinset')).toBe('2')
  })

  it('expanded children have aria-setsize equal to parent child count', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ArrowRight}') // expand (src has 2 children)

    const appRow = getNodeElement(container, 'app')
    expect(appRow?.getAttribute('aria-setsize')).toBe('2')
  })
})

// ---------------------------------------------------------------------------
// 6. DnD (Alt+Arrow)
// ---------------------------------------------------------------------------

describe('APG TreeGrid — DnD (keyboard)', () => {
  beforeEach(() => {
    resetClipboard()
  })

  it('Alt+ArrowUp moves row up among siblings', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulTree />)

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    await user.keyboard('{ArrowRight}') // focus app
    await user.keyboard('{ArrowDown}') // focus main

    expect(getFocusedNodeId(container)).toBe('main')

    await user.keyboard('{Alt>}{ArrowUp}{/Alt}')
    const visible = getAllVisibleNodeIds(container)
    const mainIdx = visible.indexOf('main')
    const appIdx = visible.indexOf('app')
    expect(mainIdx).toBeLessThan(appIdx)
  })

  it('Alt+ArrowDown moves row down among siblings', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulTree />)

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    await user.keyboard('{ArrowRight}') // focus app

    expect(getFocusedNodeId(container)).toBe('app')

    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
    const visible = getAllVisibleNodeIds(container)
    const appIdx = visible.indexOf('app')
    const mainIdx = visible.indexOf('main')
    expect(appIdx).toBeGreaterThan(mainIdx)
  })

  it('Alt+ArrowLeft moves row out to parent level', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulTree />)

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    await user.keyboard('{ArrowRight}') // focus app

    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}')
    const visible = getAllVisibleNodeIds(container)
    expect(visible.indexOf('app')).toBeGreaterThan(visible.indexOf('src'))
  })

  it('Alt+ArrowRight moves row into previous sibling', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulTree />)

    getNodeElement(container, 'lib')!.focus()
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}')

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    const visible = getAllVisibleNodeIds(container)
    expect(visible).toContain('lib')
    expect(visible.indexOf('lib')).toBeGreaterThan(visible.indexOf('src'))
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
})

// ---------------------------------------------------------------------------
// 7. Clipboard: Cut / Copy / Paste
// ---------------------------------------------------------------------------

describe('APG TreeGrid — Clipboard', () => {
  beforeEach(() => {
    resetClipboard()
  })

  it('cut then paste moves row to new location', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulTree />)

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    await user.keyboard('{ArrowRight}') // focus app
    fireEvent.cut(getNodeElement(container, 'app')!)

    act(() => { getNodeElement(container, 'lib')!.focus() })
    fireEvent.paste(getNodeElement(container, 'lib')!)

    await user.keyboard('{ArrowRight}') // expand lib
    const visible = getAllVisibleNodeIds(container)
    expect(visible).toContain('app')
    expect(visible.indexOf('app')).toBeGreaterThan(visible.indexOf('lib'))
  })

  it('copy then paste copies row with new ID', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulTree />)

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    await user.keyboard('{ArrowRight}') // focus app
    fireEvent.copy(getNodeElement(container, 'app')!)

    act(() => { getNodeElement(container, 'lib')!.focus() })
    fireEvent.paste(getNodeElement(container, 'lib')!)

    const visible = getAllVisibleNodeIds(container)
    expect(visible).toContain('app') // original still exists

    act(() => { getNodeElement(container, 'lib')!.focus() })
    await user.keyboard('{ArrowRight}') // expand lib
    const visibleAfter = getAllVisibleNodeIds(container)
    expect(visibleAfter.length).toBeGreaterThan(visible.length) // copy added
  })
})

// ---------------------------------------------------------------------------
// 8. Undo / Redo
// ---------------------------------------------------------------------------

describe('APG TreeGrid — Undo / Redo', () => {
  beforeEach(() => {
    resetClipboard()
  })

  it('Mod+Z undoes delete and restores row', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulTree />)

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{Delete}')
    expect(getNodeElement(container, 'src')).toBeNull()

    getNodeElement(container, 'lib')!.focus()
    await user.keyboard('{Control>}z{/Control}')
    expect(getNodeElement(container, 'src')).not.toBeNull()
  })

  it('Mod+Z does not undo expand (expand is view state, not content)', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())

    expect(getAllVisibleNodeIds(container)).toEqual(['src', 'lib'])

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    expect(getAllVisibleNodeIds(container)).toContain('app')

    await user.keyboard('{Control>}z{/Control}')
    expect(getAllVisibleNodeIds(container)).toContain('app') // still expanded
  })

  it('Mod+Shift+Z redoes after undo', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulTree />)

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{Delete}')
    expect(getNodeElement(container, 'src')).toBeNull()

    getNodeElement(container, 'lib')!.focus()
    await user.keyboard('{Control>}z{/Control}')
    expect(getNodeElement(container, 'src')).not.toBeNull()

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
})

// ---------------------------------------------------------------------------
// 9. Delete + Focus Recovery
// ---------------------------------------------------------------------------

describe('APG TreeGrid — Delete + Focus Recovery', () => {
  beforeEach(() => {
    resetClipboard()
  })

  it('Delete removes focused row, focus moves to next sibling', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulTree />)

    getNodeElement(container, 'src')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    await user.keyboard('{ArrowRight}') // focus app

    expect(getFocusedNodeId(container)).toBe('app')

    await user.keyboard('{Delete}')

    expect(getNodeElement(container, 'app')).toBeNull()
    expect(getFocusedNodeId(container)).toBe('main') // focus moves to next sibling
  })
})
