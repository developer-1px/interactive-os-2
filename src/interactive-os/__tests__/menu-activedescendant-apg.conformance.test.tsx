// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Actions Menu Button Using aria-activedescendant
 * https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-actions-active-descendant/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { menuActivedescendant } from '../pattern/roles/menuActivedescendant'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { extractRoleHierarchy } from './helpers/ariaTreeSnapshot'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      action1: { id: 'action1', data: { name: 'Action 1' } },
      action2: { id: 'action2', data: { name: 'Action 2' } },
      action3: { id: 'action3', data: { name: 'Action 3' } },
    },
    relationships: { [ROOT_ID]: ['action1', 'action2', 'action3'] },
  })
}

function renderMenu(data: NormalizedData) {
  return render(
    <Aria pattern={menuActivedescendant} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <span {...props} data-testid={`item-${item.id}`}>
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )} />
    </Aria>,
  )
}

function getContainer(container: HTMLElement): HTMLElement {
  return container.querySelector('[role="menu"]')!
}


// ---------------------------------------------------------------------------
// 1. ARIA Structure — activedescendant
// ---------------------------------------------------------------------------

describe('APG Menu Activedescendant (#42) — ARIA Structure', () => {
  it('role hierarchy: menu > menuitem', () => {
    const { container } = renderMenu(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('menu')
    expect(hierarchy).toContain('menuitem')
  })

  it('container has tabindex=0', () => {
    const { container } = renderMenu(fixtureData())
    expect(getContainer(container).getAttribute('tabindex')).toBe('0')
  })

  it('menuitems do NOT have tabindex', () => {
    const { container } = renderMenu(fixtureData())
    for (const item of container.querySelectorAll('[role="menuitem"]')) {
      expect(item.hasAttribute('tabindex')).toBe(false)
    }
  })

  it('container has aria-activedescendant', () => {
    const { container } = renderMenu(fixtureData())
    expect(getContainer(container).getAttribute('aria-activedescendant')).toBe('action1')
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard
// ---------------------------------------------------------------------------

describe('APG Menu Activedescendant (#42) — Keyboard', () => {
  it('ArrowDown moves activedescendant to next', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())
    getContainer(container).focus()
    await user.keyboard('{ArrowDown}')
    expect(getContainer(container).getAttribute('aria-activedescendant')).toBe('action2')
  })

  it('ArrowDown wraps from last to first', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())
    getContainer(container).focus()
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    expect(getContainer(container).getAttribute('aria-activedescendant')).toBe('action1')
  })

  it('ArrowUp moves to previous', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())
    getContainer(container).focus()
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowUp}')
    expect(getContainer(container).getAttribute('aria-activedescendant')).toBe('action1')
  })

  it('Home moves to first', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())
    getContainer(container).focus()
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Home}')
    expect(getContainer(container).getAttribute('aria-activedescendant')).toBe('action1')
  })

  it('End moves to last', async () => {
    const user = userEvent.setup()
    const { container } = renderMenu(fixtureData())
    getContainer(container).focus()
    await user.keyboard('{End}')
    expect(getContainer(container).getAttribute('aria-activedescendant')).toBe('action3')
  })
})
