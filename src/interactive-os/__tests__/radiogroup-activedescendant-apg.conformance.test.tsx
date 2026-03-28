// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Radio Group Using aria-activedescendant
 * https://www.w3.org/WAI/ARIA/apg/patterns/radio/examples/radio-activedescendant/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { radiogroupActivedescendant } from '../pattern/roles/radiogroupActivedescendant'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { extractRoleHierarchy } from './helpers/ariaTreeSnapshot'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      red:   { id: 'red',   data: { name: 'Red'   } },
      green: { id: 'green', data: { name: 'Green' } },
      blue:  { id: 'blue',  data: { name: 'Blue'  } },
    },
    relationships: { [ROOT_ID]: ['red', 'green', 'blue'] },
  })
}

function renderRadio(data: NormalizedData) {
  return render(
    <Aria behavior={radiogroupActivedescendant} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <span {...props} data-testid={`radio-${item.id}`}>
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )} />
    </Aria>,
  )
}

function getContainer(container: HTMLElement): HTMLElement {
  return container.querySelector('[role="radiogroup"]')!
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

// ---------------------------------------------------------------------------
// 1. ARIA Structure — aria-activedescendant focus strategy
// ---------------------------------------------------------------------------

describe('APG Radio Group Activedescendant (#46) — ARIA Structure', () => {
  it('role hierarchy: radiogroup > radio', () => {
    const { container } = renderRadio(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('radiogroup')
    expect(hierarchy).toContain('radio')
  })

  it('container has tabindex=0 (activedescendant strategy)', () => {
    const { container } = renderRadio(fixtureData())
    expect(getContainer(container).getAttribute('tabindex')).toBe('0')
  })

  it('radios do NOT have tabindex (focus stays on container)', () => {
    const { container } = renderRadio(fixtureData())
    for (const radio of container.querySelectorAll('[role="radio"]')) {
      expect(radio.hasAttribute('tabindex')).toBe(false)
    }
  })

  it('container has aria-activedescendant pointing to first radio', () => {
    const { container } = renderRadio(fixtureData())
    expect(getContainer(container).getAttribute('aria-activedescendant')).toBe('red')
  })

  it('radios have aria-checked', () => {
    const { container } = renderRadio(fixtureData())
    expect(getNode(container, 'red')?.getAttribute('aria-checked')).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard — arrow keys change activedescendant + auto-select
// ---------------------------------------------------------------------------

describe('APG Radio Group Activedescendant (#46) — Keyboard', () => {
  it('ArrowDown changes aria-activedescendant to next', async () => {
    const user = userEvent.setup()
    const { container } = renderRadio(fixtureData())
    getContainer(container).focus()
    await user.keyboard('{ArrowDown}')
    expect(getContainer(container).getAttribute('aria-activedescendant')).toBe('green')
  })

  it('ArrowDown auto-selects (selectionFollowsFocus)', async () => {
    const user = userEvent.setup()
    const { container } = renderRadio(fixtureData())
    getContainer(container).focus()
    await user.keyboard('{ArrowDown}')
    expect(getNode(container, 'green')?.getAttribute('aria-checked')).toBe('true')
  })

  it('ArrowUp wraps from first to last', async () => {
    const user = userEvent.setup()
    const { container } = renderRadio(fixtureData())
    getContainer(container).focus()
    await user.keyboard('{ArrowUp}')
    expect(getContainer(container).getAttribute('aria-activedescendant')).toBe('blue')
  })

  it('ArrowRight moves to next', async () => {
    const user = userEvent.setup()
    const { container } = renderRadio(fixtureData())
    getContainer(container).focus()
    await user.keyboard('{ArrowRight}')
    expect(getContainer(container).getAttribute('aria-activedescendant')).toBe('green')
  })
})

// ---------------------------------------------------------------------------
// 3. Click
// ---------------------------------------------------------------------------

describe('APG Radio Group Activedescendant (#46) — Click', () => {
  it('click selects radio', async () => {
    const user = userEvent.setup()
    const { container } = renderRadio(fixtureData())
    await user.click(getNode(container, 'blue')!)
    expect(getNode(container, 'blue')?.getAttribute('aria-checked')).toBe('true')
  })
})
