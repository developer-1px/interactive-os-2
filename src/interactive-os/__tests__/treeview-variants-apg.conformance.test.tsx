// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Treeview Variants (Declared Properties, Navigation)
 * https://www.w3.org/WAI/ARIA/apg/patterns/treeview/examples/treeview-1b/
 * https://www.w3.org/WAI/ARIA/apg/patterns/treeview/examples/treeview-navigation/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { tree } from '../pattern/examples/tree'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { extractRoleHierarchy } from './helpers/ariaTreeSnapshot'

// Hierarchical fixture — same shape for both variants
function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      projects:  { id: 'projects',  data: { name: 'Projects' } },
      proj1:     { id: 'proj1',     data: { name: 'Project 1' } },
      proj2:     { id: 'proj2',     data: { name: 'Project 2' } },
      reports:   { id: 'reports',   data: { name: 'Reports' } },
      annual:    { id: 'annual',    data: { name: 'Annual Report' } },
    },
    relationships: {
      [ROOT_ID]: ['projects', 'reports'],
      projects: ['proj1', 'proj2'],
      reports: ['annual'],
    },
  })
}

function renderTree(data: NormalizedData) {
  return render(
    <Aria behavior={tree} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <span {...props} data-testid={`node-${item.id}`}>
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )} />
    </Aria>,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getFocusedNodeId(container: HTMLElement): string | null {
  return container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id') ?? null
}

function getAllVisibleNodeIds(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[data-node-id]'))
    .map(n => n.getAttribute('data-node-id')!)
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// 1. Treeview Declared Properties (#64)
// ---------------------------------------------------------------------------

describe('APG Treeview Declared (#64) — ARIA Structure', () => {
  it('role hierarchy: tree > treeitem', () => {
    const { container } = renderTree(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('tree')
    expect(hierarchy).toContain('treeitem')
  })

  it('parent items have aria-expanded=false initially', () => {
    const { container } = renderTree(fixtureData())
    expect(getNode(container, 'projects')?.getAttribute('aria-expanded')).toBe('false')
  })

  it('initially only top-level items are visible', () => {
    const { container } = renderTree(fixtureData())
    expect(getAllVisibleNodeIds(container)).toEqual(['projects', 'reports'])
  })
})

describe('APG Treeview Declared (#64) — Keyboard', () => {
  it('ArrowRight expands parent', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())
    getNode(container, 'projects')!.focus()
    await user.keyboard('{ArrowRight}')
    expect(getNode(container, 'projects')?.getAttribute('aria-expanded')).toBe('true')
    expect(getAllVisibleNodeIds(container)).toContain('proj1')
  })

  it('ArrowLeft collapses expanded parent', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())
    getNode(container, 'projects')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    await user.keyboard('{ArrowLeft}') // collapse
    expect(getNode(container, 'projects')?.getAttribute('aria-expanded')).toBe('false')
  })

  it('ArrowDown moves to next visible item', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())
    getNode(container, 'projects')!.focus()
    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('reports')
  })
})

// ---------------------------------------------------------------------------
// 2. Navigation Treeview (#65) — Same pattern, items act as links
// ---------------------------------------------------------------------------

describe('APG Navigation Treeview (#65) — ARIA Structure', () => {
  it('role hierarchy matches tree pattern', () => {
    const { container } = renderTree(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('tree')
    expect(hierarchy).toContain('treeitem')
  })

  it('leaf items have aria-selected', () => {
    const { container } = renderTree(fixtureData())
    // Top-level items have aria-selected
    expect(getNode(container, 'projects')?.getAttribute('aria-selected')).not.toBeNull()
  })
})

describe('APG Navigation Treeview (#65) — Keyboard', () => {
  it('Enter selects leaf item (navigation action)', async () => {
    const user = userEvent.setup()
    const { container } = renderTree(fixtureData())
    // Expand projects first
    getNode(container, 'projects')!.focus()
    await user.keyboard('{ArrowRight}') // expand
    await user.keyboard('{ArrowRight}') // focus proj1
    await user.keyboard('{Enter}')
    expect(getNode(container, 'proj1')?.getAttribute('aria-selected')).toBe('true')
  })
})
