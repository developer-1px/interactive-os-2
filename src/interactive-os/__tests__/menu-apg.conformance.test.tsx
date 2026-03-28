// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Menu Button (Actions Menu Button using element.focus())
 * https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-actions/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MenuList } from '../ui/MenuList'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { captureAriaTree, extractRoleHierarchy } from './helpers/ariaTreeSnapshot'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

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

function flatFixtureData(): NormalizedData {
  return createStore({
    entities: {
      cut: { id: 'cut', data: { name: 'Cut' } },
      copy: { id: 'copy', data: { name: 'Copy' } },
      paste: { id: 'paste', data: { name: 'Paste' } },
    },
    relationships: {
      [ROOT_ID]: ['cut', 'copy', 'paste'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderMenu(data: NormalizedData) {
  return render(
    <MenuList
      data={data}
      plugins={[]}
      renderItem={(props, item, state: NodeState) => (
        <span
          {...props}
          data-testid={`item-${item.id}`}
          data-focused={state.focused}
          data-selected={state.selected}
        >
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )}
    />,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getFocusedNodeId(container: HTMLElement): string | null {
  const focused = container.querySelector('[tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

function getAllVisibleNodeIds(container: HTMLElement): string[] {
  const nodes = container.querySelectorAll('[data-node-id]')
  return Array.from(nodes).map((n) => n.getAttribute('data-node-id')!).filter(Boolean)
}

// ---------------------------------------------------------------------------
// 1. ARIA Role Structure
// ---------------------------------------------------------------------------

describe('APG Menu — ARIA Role Structure', () => {
  it('container has role="menu"', () => {
    const { container } = renderMenu(flatFixtureData())
    expect(container.querySelector('[role="menu"]')).not.toBeNull()
  })

  it('items have role="menuitem"', () => {
    const { container } = renderMenu(flatFixtureData())
    const items = container.querySelectorAll('[role="menuitem"]')
    expect(items.length).toBe(3)
  })

  it('role hierarchy: menu > menuitem', () => {
    const { container } = renderMenu(flatFixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('menu')
    expect(hierarchy).toContain('menuitem')
  })

  it('parent items with children have aria-expanded', () => {
    const { container } = renderMenu(fixtureData())
    const fileNode = getNode(container, 'file')
    expect(fileNode?.getAttribute('aria-expanded')).not.toBeNull()
  })

  it('parent items are collapsed initially (aria-expanded=false)', () => {
    const { container } = renderMenu(fixtureData())
    const fileNode = getNode(container, 'file')
    expect(fileNode?.getAttribute('aria-expanded')).toBe('false')
  })

  it('leaf items do not have aria-expanded', () => {
    const { container } = renderMenu(fixtureData())
    const helpNode = getNode(container, 'help')
    expect(helpNode?.getAttribute('aria-expanded')).toBeNull()
  })

  it('initial focus: first item has tabindex=0 (roving tabindex)', () => {
    const { container } = renderMenu(flatFixtureData())
    expect(getFocusedNodeId(container)).toBe('cut')
  })

  it('only one item has tabindex=0 at a time', () => {
    const { container } = renderMenu(flatFixtureData())
    const tabindex0 = container.querySelectorAll('[tabindex="0"]')
    expect(tabindex0).toHaveLength(1)
  })

  it('captureAriaTree includes aria-expanded on parent items', () => {
    const { container } = renderMenu(fixtureData())
    const tree = captureAriaTree(container)
    expect(tree).toContain('expanded=false')
  })

  it('initially only top-level items are visible', () => {
    const { container } = renderMenu(fixtureData())
    expect(getAllVisibleNodeIds(container)).toEqual(['file', 'edit', 'help'])
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard: Vertical Navigation (ArrowDown / ArrowUp)
// ---------------------------------------------------------------------------

describe('APG Menu — Keyboard: Vertical Navigation', () => {
  it('ArrowDown moves focus to next item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())

    expect(getFocusedNodeId(container)).toBe('file')
    getNode(container, 'file')!.focus()
    await user.keyboard('{ArrowDown}')

    expect(getFocusedNodeId(container)).toBe('edit')
  })

  it('GAP: ArrowDown at last item does NOT wrap (APG requires circular navigation)', async () => {
    // APG spec: Down Arrow at last item wraps to first item
    // Our navigate() does not wrap — gap exists, needs navigate({ wrap: true })
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())

    getNode(container, 'help')!.focus()
    await user.keyboard('{ArrowDown}')

    // Stays at last item instead of wrapping — documented gap
    expect(getFocusedNodeId(container)).toBe('help')
  })

  it('ArrowUp moves focus to previous item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())

    getNode(container, 'edit')!.focus()
    await user.keyboard('{ArrowUp}')

    expect(getFocusedNodeId(container)).toBe('file')
  })

  it('GAP: ArrowUp at first item does NOT wrap (APG requires circular navigation)', async () => {
    // APG spec: Up Arrow at first item wraps to last item
    // Our navigate() does not wrap — gap exists, needs navigate({ wrap: true })
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())

    getNode(container, 'file')!.focus()
    await user.keyboard('{ArrowUp}')

    // Stays at first item instead of wrapping — documented gap
    expect(getFocusedNodeId(container)).toBe('file')
  })

  it('Home moves focus to first item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())

    getNode(container, 'help')!.focus()
    await user.keyboard('{Home}')

    expect(getFocusedNodeId(container)).toBe('file')
  })

  it('End moves focus to last item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())

    getNode(container, 'file')!.focus()
    await user.keyboard('{End}')

    expect(getFocusedNodeId(container)).toBe('help')
  })

  it('only the focused item has tabindex=0 after navigation', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())

    getNode(container, 'file')!.focus()
    await user.keyboard('{ArrowDown}')

    const tabindex0 = container.querySelectorAll('[tabindex="0"]')
    expect(tabindex0).toHaveLength(1)
    expect(tabindex0[0].getAttribute('data-node-id')).toBe('edit')
  })
})

// ---------------------------------------------------------------------------
// 3. Keyboard: Submenu Expand / Collapse
// ---------------------------------------------------------------------------

describe('APG Menu — Keyboard: Submenu Expand/Collapse', () => {
  it('ArrowRight expands submenu on item with children', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())

    expect(getAllVisibleNodeIds(container)).toEqual(['file', 'edit', 'help'])

    getNode(container, 'file')!.focus()
    await user.keyboard('{ArrowRight}')

    expect(getAllVisibleNodeIds(container)).toContain('newFile')
    expect(getAllVisibleNodeIds(container)).toContain('open')
  })

  it('ArrowRight sets aria-expanded=true on expanded parent', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())

    getNode(container, 'file')!.focus()
    await user.keyboard('{ArrowRight}')

    expect(getNode(container, 'file')?.getAttribute('aria-expanded')).toBe('true')
  })

  it('ArrowRight on already-expanded item focuses first child', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())

    getNode(container, 'file')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    await user.keyboard('{ArrowRight}') // navigate to first child

    expect(getFocusedNodeId(container)).toBe('newFile')
  })

  it('ArrowLeft collapses expanded submenu', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())

    getNode(container, 'file')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    expect(getAllVisibleNodeIds(container)).toContain('newFile')

    await user.keyboard('{ArrowLeft}') // collapse
    expect(getAllVisibleNodeIds(container)).not.toContain('newFile')
  })

  it('ArrowLeft on child focuses parent', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())

    getNode(container, 'file')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    await user.keyboard('{ArrowRight}') // focus newFile
    expect(getFocusedNodeId(container)).toBe('newFile')

    await user.keyboard('{ArrowLeft}')
    expect(getFocusedNodeId(container)).toBe('file')
  })

  it('Enter on parent item toggles expand', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())

    getNode(container, 'edit')!.focus()
    await user.keyboard('{Enter}')

    expect(getAllVisibleNodeIds(container)).toContain('copy')
    expect(getAllVisibleNodeIds(container)).toContain('paste')
  })
})

// ---------------------------------------------------------------------------
// 4. Keyboard: Activation
// ---------------------------------------------------------------------------

describe('APG Menu — Keyboard: Activation', () => {
  it('Enter on leaf item selects it (activates action)', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())

    getNode(container, 'help')!.focus()
    await user.keyboard('{Enter}')

    const testNode = container.querySelector('[data-testid="item-help"]')
    expect(testNode?.getAttribute('data-selected')).toBe('true')
  })
})

// ---------------------------------------------------------------------------
// 5. Click Interaction
// ---------------------------------------------------------------------------

describe('APG Menu — Click Interaction', () => {
  it('clicking a parent item expands its submenu', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())

    expect(getAllVisibleNodeIds(container)).toEqual(['file', 'edit', 'help'])
    await user.click(getNode(container, 'file')!)

    expect(getAllVisibleNodeIds(container)).toContain('newFile')
    expect(getAllVisibleNodeIds(container)).toContain('open')
  })

  it('clicking a leaf item selects it', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())

    await user.click(getNode(container, 'help')!)

    const testNode = container.querySelector('[data-testid="item-help"]')
    expect(testNode?.getAttribute('data-selected')).toBe('true')
  })
})
