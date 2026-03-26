import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { TreeView } from '../ui/TreeView'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'

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

describe('TreeView', () => {
  it('ArrowRight expands a parent node, revealing children', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="Test tree" />)

    // Initially children of 'a' should not be visible (collapsed)
    expect(getNodeEl(container, 'a/1')).toBeNull()

    // Focus parent and expand
    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{ArrowRight}')

    // Children should now be visible
    expect(getNodeEl(container, 'a/1')).not.toBeNull()
    expect(getNodeEl(container, 'a/2')).not.toBeNull()
  })

  it('ArrowLeft collapses an expanded parent node', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="Test tree" />)

    // Expand first
    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{ArrowRight}')
    expect(getNodeEl(container, 'a/1')).not.toBeNull()

    // Collapse
    await user.keyboard('{ArrowLeft}')
    expect(getNodeEl(container, 'a/1')).toBeNull()
  })

  it('click on parent node expands it', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="Test tree" />)

    expect(getNodeEl(container, 'a/1')).toBeNull()
    await user.click(getNodeEl(container, 'a')!)
    // click on parent directly expands (ctx.activate → toggleExpand)
    expect(getNodeEl(container, 'a/1')).not.toBeNull()
  })

  it('ArrowDown/ArrowUp navigate between visible items', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="Test tree" />)

    getNodeEl(container, 'a')!.focus()
    expect(getFocusedNodeId(container)).toBe('a')

    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('b')

    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('c')

    await user.keyboard('{ArrowUp}')
    expect(getFocusedNodeId(container)).toBe('b')
  })

  it('Home jumps to first item, End jumps to last', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="Test tree" />)

    getNodeEl(container, 'b')!.focus()
    await user.keyboard('{Home}')
    expect(getFocusedNodeId(container)).toBe('a')

    await user.keyboard('{End}')
    expect(getFocusedNodeId(container)).toBe('c')
  })

  it('ArrowDown navigates into expanded children', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={makeTreeData()} aria-label="Test tree" />)

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

  it('followFocus + onActivate: moving focus triggers onActivate', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TreeViewWithActivatedDisplay data={makeTreeData()} followFocus aria-label="Test tree" />
    )

    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{ArrowDown}')

    expect(getFocusedNodeId(container)).toBe('b')
    expect(screen.getByTestId('activated').textContent).toBe('b')
  })

  it('supports custom renderItem', () => {
    render(
      <TreeView
        data={makeTreeData()}
        renderItem={(_props, node: Record<string, unknown>, _state: NodeState) => (
          <span data-testid="custom">{(node.data as Record<string, unknown>)?.name as string}!</span>
        )}
        aria-label="Custom tree"
      />
    )
    // At least the first root item should use custom render
    const customs = screen.getAllByTestId('custom')
    expect(customs.length).toBeGreaterThan(0)
    expect(customs[0].textContent).toBe('Folder A!')
  })

  // V1: 2026-03-26-treeview-click-expand-prd.md
  it('click on collapsed folder with onActivate expands and activates', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TreeViewWithActivatedDisplay data={makeTreeData()} aria-label="Test tree" />
    )

    expect(getNodeEl(container, 'a/1')).toBeNull()
    await user.click(getNodeEl(container, 'a')!)
    expect(getNodeEl(container, 'a')!.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByTestId('activated').textContent).toBe('a')
  })

  // V2: 2026-03-26-treeview-click-expand-prd.md
  it('click on expanded folder with onActivate collapses and activates', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TreeViewWithActivatedDisplay data={makeTreeData()} aria-label="Test tree" />
    )

    // Expand first
    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{ArrowRight}')
    expect(getNodeEl(container, 'a')!.getAttribute('aria-expanded')).toBe('true')

    // Click to collapse
    await user.click(getNodeEl(container, 'a')!)
    expect(getNodeEl(container, 'a')!.getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByTestId('activated').textContent).toBe('a')
  })

  // V3: 2026-03-26-treeview-click-expand-prd.md
  it('click on leaf with onActivate activates without expand', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TreeViewWithActivatedDisplay data={makeTreeData()} aria-label="Test tree" />
    )

    await user.click(getNodeEl(container, 'c')!)
    expect(screen.getByTestId('activated').textContent).toBe('c')
    expect(getNodeEl(container, 'c')!.hasAttribute('aria-expanded')).toBe(false)
  })

  // V4: 2026-03-26-treeview-click-expand-prd.md
  it('Enter on collapsed folder with onActivate activates without expand', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TreeViewWithActivatedDisplay data={makeTreeData()} aria-label="Test tree" />
    )

    getNodeEl(container, 'a')!.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('activated').textContent).toBe('a')
    expect(getNodeEl(container, 'a')!.getAttribute('aria-expanded')).toBe('false')
  })

  it('renders empty tree without error', () => {
    const { container } = render(
      <TreeView
        data={createStore({ entities: {}, relationships: { [ROOT_ID]: [] } })}
        aria-label="Empty tree"
      />
    )
    const tree = container.querySelector('[role="tree"]')
    expect(tree).not.toBeNull()
    expect(tree!.getAttribute('aria-label')).toBe('Empty tree')
  })
})
