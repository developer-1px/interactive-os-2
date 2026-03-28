// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Tree View — File Directory (Computed Properties)
 * https://www.w3.org/WAI/ARIA/apg/patterns/treeview/examples/treeview-1a/
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { TreeView } from '../ui/TreeView'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { captureAriaTree, extractRoleHierarchy } from './helpers/ariaTreeSnapshot'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeTreeData(): NormalizedData {
  return createStore({
    entities: {
      a: { id: 'a', data: { name: 'Folder A' } },
      'a/1': { id: 'a/1', data: { name: 'File 1' } },
      'a/2': { id: 'a/2', data: { name: 'File 2' } },
      b: { id: 'b', data: { name: 'Folder B' } },
      'b/1': { id: 'b/1', data: { name: 'File 3' } },
      c: { id: 'c', data: { name: 'Leaf C' } },
    },
    relationships: {
      [ROOT_ID]: ['a', 'b', 'c'],
      a: ['a/1', 'a/2'],
      b: ['b/1'],
    },
  })
}

function makeNestedData(): NormalizedData {
  return createStore({
    entities: {
      parent: { id: 'parent', data: { name: 'Parent' } },
      child: { id: 'child', data: { name: 'Child Folder' } },
      leaf: { id: 'leaf', data: { name: 'Leaf' } },
    },
    relationships: {
      [ROOT_ID]: ['parent'],
      parent: ['child'],
      child: ['leaf'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNodeEl(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getFocusedNodeId(container: HTMLElement): string | null {
  const focused = container.querySelector('[tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

function TreeViewWithActivatedDisplay(props: { data: NormalizedData; followFocus?: boolean; 'aria-label': string }) {
  const [activated, setActivated] = useState('')
  return (
    <>
      <TreeView {...props} onActivate={setActivated} />
      <div data-testid="activated">{activated}</div>
    </>
  )
}

// ---------------------------------------------------------------------------
// 1. ARIA Role Structure
// ---------------------------------------------------------------------------

describe('APG TreeView — ARIA Role Structure', () => {
  it('container has role="tree"', () => {
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)
    expect(container.querySelector('[role="tree"]')).not.toBeNull()
  })

  it('tree has aria-label', () => {
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)
    const tree = container.querySelector('[role="tree"]')
    expect(tree?.getAttribute('aria-label')).toBe('File Tree')
  })

  it('root items have role="treeitem"', () => {
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)
    const treeitems = container.querySelectorAll('[role="treeitem"]')
    expect(treeitems.length).toBeGreaterThan(0)
  })

  it('role hierarchy: tree > treeitem', () => {
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('tree')
    expect(hierarchy).toContain('treeitem')
  })

  it('parent nodes have aria-expanded=false when collapsed', () => {
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)
    const folderA = getNodeEl(container, 'a')
    expect(folderA?.getAttribute('aria-expanded')).toBe('false')
  })

  it('leaf nodes do not have aria-expanded', () => {
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)
    const leafC = getNodeEl(container, 'c')
    expect(leafC?.getAttribute('aria-expanded')).toBeNull()
  })

  it('items have aria-selected', () => {
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)
    const treeitems = container.querySelectorAll('[role="treeitem"]')
    treeitems.forEach((item) => {
      expect(item.getAttribute('aria-selected')).not.toBeNull()
    })
  })

  it('items have aria-level', () => {
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)
    const treeitems = container.querySelectorAll('[role="treeitem"]')
    treeitems.forEach((item) => {
      expect(item.getAttribute('aria-level')).not.toBeNull()
    })
  })

  it('root items have aria-level=1', () => {
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)
    const folderA = getNodeEl(container, 'a')
    expect(folderA?.getAttribute('aria-level')).toBe('1')
  })

  it('items have aria-posinset and aria-setsize', () => {
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)
    const folderA = getNodeEl(container, 'a')
    expect(folderA?.getAttribute('aria-posinset')).not.toBeNull()
    expect(folderA?.getAttribute('aria-setsize')).not.toBeNull()
  })

  it('first root item has aria-posinset=1, setsize=3', () => {
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)
    const folderA = getNodeEl(container, 'a')
    expect(folderA?.getAttribute('aria-posinset')).toBe('1')
    expect(folderA?.getAttribute('aria-setsize')).toBe('3')
  })

  it('initially only root items visible (children collapsed)', () => {
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)
    expect(getNodeEl(container, 'a/1')).toBeNull()
    expect(getNodeEl(container, 'b/1')).toBeNull()
  })

  it('initial focus: first item has tabindex=0', () => {
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)
    expect(getFocusedNodeId(container)).toBe('a')
  })

  it('captureAriaTree shows aria-expanded, aria-level, aria-selected', () => {
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)
    const tree = captureAriaTree(container)
    expect(tree).toContain('tree')
    expect(tree).toContain('treeitem')
  })

  it('renders empty tree without error', () => {
    const { container } = render(
      <TreeView
        data={createStore({ entities: {}, relationships: { [ROOT_ID]: [] } })}
        aria-label="Empty tree"
      />,
    )
    const tree = container.querySelector('[role="tree"]')
    expect(tree).not.toBeNull()
    expect(tree!.getAttribute('aria-label')).toBe('Empty tree')
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard: Expand / Collapse (ArrowRight / ArrowLeft)
// ---------------------------------------------------------------------------

describe('APG TreeView — Keyboard: Expand / Collapse', () => {
  it('ArrowRight expands a collapsed parent node', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)

    expect(getNodeEl(container, 'a/1')).toBeNull()

    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{ArrowRight}')

    expect(getNodeEl(container, 'a/1')).not.toBeNull()
    expect(getNodeEl(container, 'a/2')).not.toBeNull()
  })

  it('ArrowRight on expanded node focuses first child', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)

    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    await user.keyboard('{ArrowRight}') // focus first child

    expect(getFocusedNodeId(container)).toBe('a/1')
  })

  it('ArrowLeft collapses an expanded parent node', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)

    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    expect(getNodeEl(container, 'a/1')).not.toBeNull()

    await user.keyboard('{ArrowLeft}') // collapse
    expect(getNodeEl(container, 'a/1')).toBeNull()
  })

  it('ArrowLeft on a child moves focus to parent', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)

    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    await user.keyboard('{ArrowRight}') // focus a/1

    expect(getFocusedNodeId(container)).toBe('a/1')

    await user.keyboard('{ArrowLeft}')
    expect(getFocusedNodeId(container)).toBe('a')
  })

  it('aria-expanded=true after ArrowRight expand', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)

    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{ArrowRight}')

    expect(getNodeEl(container, 'a')?.getAttribute('aria-expanded')).toBe('true')
  })

  it('aria-expanded=false after ArrowLeft collapse', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)

    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    await user.keyboard('{ArrowLeft}') // collapse

    expect(getNodeEl(container, 'a')?.getAttribute('aria-expanded')).toBe('false')
  })
})

// ---------------------------------------------------------------------------
// 3. Keyboard: Vertical Navigation (ArrowDown / ArrowUp)
// ---------------------------------------------------------------------------

describe('APG TreeView — Keyboard: Vertical Navigation', () => {
  it('ArrowDown moves focus to next sibling', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)

    getNodeEl(container, 'a')!.focus()
    expect(getFocusedNodeId(container)).toBe('a')

    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('b')
  })

  it('ArrowDown navigates into expanded children', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)

    // Expand 'a'
    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{ArrowRight}')

    // ArrowDown should go into children
    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('a/1')

    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('a/2')

    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('b')
  })

  it('ArrowUp moves focus to previous item', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)

    getNodeEl(container, 'b')!.focus()
    await user.keyboard('{ArrowUp}')
    expect(getFocusedNodeId(container)).toBe('a')

    await user.keyboard('{ArrowUp}')
    // At first item, no further movement
    expect(getFocusedNodeId(container)).toBe('a')
  })

  it('ArrowDown + ArrowUp round-trip through visible items', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)

    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('b')

    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('c')

    await user.keyboard('{ArrowUp}')
    expect(getFocusedNodeId(container)).toBe('b')
  })
})

// ---------------------------------------------------------------------------
// 4. Keyboard: Home / End
// ---------------------------------------------------------------------------

describe('APG TreeView — Keyboard: Home / End', () => {
  it('Home moves focus to first visible item', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)

    getNodeEl(container, 'b')!.focus()
    await user.keyboard('{Home}')
    expect(getFocusedNodeId(container)).toBe('a')
  })

  it('End moves focus to last visible item', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)

    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{End}')
    expect(getFocusedNodeId(container)).toBe('c')
  })

  it('End moves to absolute last visible item (c), even with b expanded', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)

    // Expand 'b' (which has b/1), but 'c' is after 'b' at root level
    getNodeEl(container, 'b')!.focus()
    await user.keyboard('{ArrowRight}') // expand b

    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{End}')
    // c comes after b in root order, so c is the last visible item
    expect(getFocusedNodeId(container)).toBe('c')
  })
})

// ---------------------------------------------------------------------------
// 5. Click Interaction
// ---------------------------------------------------------------------------

describe('APG TreeView — Click Interaction', () => {
  it('clicking a collapsed parent expands it', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)

    expect(getNodeEl(container, 'a/1')).toBeNull()
    await user.click(getNodeEl(container, 'a')!)
    expect(getNodeEl(container, 'a/1')).not.toBeNull()
  })

  it('clicking expanded folder with onActivate: collapses and activates', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TreeViewWithActivatedDisplay data={makeTreeData()} aria-label="File Tree" />,
    )

    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    expect(getNodeEl(container, 'a')?.getAttribute('aria-expanded')).toBe('true')

    await user.click(getNodeEl(container, 'a')!)
    expect(getNodeEl(container, 'a')?.getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByTestId('activated').textContent).toBe('a')
  })

  it('clicking a leaf activates it', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TreeViewWithActivatedDisplay data={makeTreeData()} aria-label="File Tree" />,
    )

    await user.click(getNodeEl(container, 'c')!)
    expect(screen.getByTestId('activated').textContent).toBe('c')
    expect(getNodeEl(container, 'c')!.hasAttribute('aria-expanded')).toBe(false)
  })

  it('clicking collapsed folder with onActivate: expands and activates', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TreeViewWithActivatedDisplay data={makeTreeData()} aria-label="File Tree" />,
    )

    expect(getNodeEl(container, 'a/1')).toBeNull()
    await user.click(getNodeEl(container, 'a')!)
    expect(getNodeEl(container, 'a')?.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByTestId('activated').textContent).toBe('a')
  })
})

// ---------------------------------------------------------------------------
// 6. Enter / Space Activation
// ---------------------------------------------------------------------------

describe('APG TreeView — Enter / Space Activation', () => {
  it('Enter on collapsed folder with onActivate: activates without expand', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TreeViewWithActivatedDisplay data={makeTreeData()} aria-label="File Tree" />,
    )

    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('activated').textContent).toBe('a')
    // Enter activates but does not expand (APG: tree Enter fires action, not expand)
    expect(getNodeEl(container, 'a')?.getAttribute('aria-expanded')).toBe('false')
  })
})

// ---------------------------------------------------------------------------
// 7. Nested Click Bubbling Guard
// ---------------------------------------------------------------------------

describe('APG TreeView — Nested Click Bubbling Guard', () => {
  it('clicking child folder does not collapse parent (bubbling guard)', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TreeViewWithActivatedDisplay data={makeNestedData()} aria-label="File Tree" />,
    )

    // Expand parent
    await user.click(getNodeEl(container, 'parent')!)
    expect(getNodeEl(container, 'parent')?.getAttribute('aria-expanded')).toBe('true')
    expect(getNodeEl(container, 'child')).not.toBeNull()

    // Click nested child folder — parent must stay expanded
    await user.click(getNodeEl(container, 'child')!)
    expect(getNodeEl(container, 'child')?.getAttribute('aria-expanded')).toBe('true')
    expect(getNodeEl(container, 'parent')?.getAttribute('aria-expanded')).toBe('true')
  })
})

// ---------------------------------------------------------------------------
// 8. followFocus
// ---------------------------------------------------------------------------

describe('APG TreeView — followFocus', () => {
  it('followFocus + onActivate: moving focus triggers onActivate', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TreeViewWithActivatedDisplay data={makeTreeData()} followFocus aria-label="File Tree" />,
    )

    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{ArrowDown}')

    expect(getFocusedNodeId(container)).toBe('b')
    expect(screen.getByTestId('activated').textContent).toBe('b')
  })
})

// ---------------------------------------------------------------------------
// 9. Custom renderItem
// ---------------------------------------------------------------------------

describe('APG TreeView — Custom renderItem', () => {
  it('supports custom renderItem', () => {
    render(
      <TreeView
        data={makeTreeData()}
        renderItem={(_props, node: Record<string, unknown>, _state: NodeState) => (
          <span data-testid="custom">{(node.data as Record<string, unknown>)?.name as string}!</span>
        )}
        aria-label="Custom tree"
      />,
    )
    const customs = screen.getAllByTestId('custom')
    expect(customs.length).toBeGreaterThan(0)
    expect(customs[0].textContent).toBe('Folder A!')
  })
})

// ---------------------------------------------------------------------------
// 10. child level ARIA attributes after expand
// ---------------------------------------------------------------------------

describe('APG TreeView — Child ARIA attributes after expand', () => {
  it('expanded children have aria-level=2', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)

    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{ArrowRight}') // expand

    const child = getNodeEl(container, 'a/1')
    expect(child?.getAttribute('aria-level')).toBe('2')
  })

  it('expanded children have correct aria-posinset', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)

    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{ArrowRight}') // expand

    const child1 = getNodeEl(container, 'a/1')
    const child2 = getNodeEl(container, 'a/2')
    expect(child1?.getAttribute('aria-posinset')).toBe('1')
    expect(child2?.getAttribute('aria-posinset')).toBe('2')
  })

  it('expanded children have aria-setsize equal to parent child count', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="File Tree" />)

    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{ArrowRight}') // expand (a has 2 children)

    const child1 = getNodeEl(container, 'a/1')
    expect(child1?.getAttribute('aria-setsize')).toBe('2')
  })
})
