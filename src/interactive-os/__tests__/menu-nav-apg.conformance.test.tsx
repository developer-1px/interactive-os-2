// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Navigation Menu Button
 * https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-links/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { menu } from '../pattern/roles/menu'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { extractRoleHierarchy } from './helpers/ariaTreeSnapshot'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      waiAria: { id: 'waiAria', data: { name: 'WAI-ARIA Overview' } },
      wcag:    { id: 'wcag',    data: { name: 'WCAG Overview' } },
      atag:    { id: 'atag',    data: { name: 'ATAG Overview' } },
    },
    relationships: {
      [ROOT_ID]: ['waiAria', 'wcag', 'atag'],
    },
  })
}

function renderMenu(data: NormalizedData) {
  return render(
    <Aria behavior={menu} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <span {...props} data-testid={`link-${item.id}`}>
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

describe('APG Navigation Menu Button — ARIA Structure', () => {
  it('role hierarchy: menu > menuitem', () => {
    const { container } = renderMenu(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('menu')
    expect(hierarchy).toContain('menuitem')
  })

  it('initial focus on first item', () => {
    const { container } = renderMenu(fixtureData())
    expect(getFocusedNodeId(container)).toBe('waiAria')
  })
})

describe('APG Navigation Menu Button — Keyboard', () => {
  it('ArrowDown moves to next item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())
    getNode(container, 'waiAria')!.focus()
    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('wcag')
  })

  it('ArrowDown wraps from last to first', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())
    getNode(container, 'atag')!.focus()
    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('waiAria')
  })

  it('ArrowUp moves to previous item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())
    getNode(container, 'wcag')!.focus()
    await user.keyboard('{ArrowUp}')
    expect(getFocusedNodeId(container)).toBe('waiAria')
  })
})
