// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Layout Grid
 * https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/layout-grids/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { grid } from '../pattern/roles/grid'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { extractRoleHierarchy } from './helpers/ariaTreeSnapshot'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      r1: { id: 'r1', data: { name: 'Row 1' } },
      r2: { id: 'r2', data: { name: 'Row 2' } },
      r3: { id: 'r3', data: { name: 'Row 3' } },
    },
    relationships: { [ROOT_ID]: ['r1', 'r2', 'r3'] },
  })
}

function renderGrid(data: NormalizedData) {
  return render(
    <Aria pattern={grid({ columns: 3 })} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <span {...props} data-testid={`cell-${item.id}`}>
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

describe('APG Layout Grid (#26) — ARIA Structure', () => {
  it('role hierarchy: grid > row', () => {
    const { container } = renderGrid(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('grid')
    expect(hierarchy).toContain('row')
  })

  it('initial focus on first cell', () => {
    const { container } = renderGrid(fixtureData())
    expect(getFocusedNodeId(container)).toBe('r1')
  })
})

describe('APG Layout Grid (#26) — Keyboard', () => {
  it('ArrowDown moves to next row', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData())
    getNode(container, 'r1')!.focus()
    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('r2')
  })

  it('ArrowUp moves to previous row', async () => {
    const user = userEvent.setup()
    const { container } = renderGrid(fixtureData())
    getNode(container, 'r2')!.focus()
    await user.keyboard('{ArrowUp}')
    expect(getFocusedNodeId(container)).toBe('r1')
  })
})
