// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Rating Radio Group
 * https://www.w3.org/WAI/ARIA/apg/patterns/radio/examples/radio-rating/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { radiogroup } from '../pattern/roles/radiogroup'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { extractRoleHierarchy } from './helpers/ariaTreeSnapshot'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      star1: { id: 'star1', data: { name: '1 Star' } },
      star2: { id: 'star2', data: { name: '2 Stars' } },
      star3: { id: 'star3', data: { name: '3 Stars' } },
      star4: { id: 'star4', data: { name: '4 Stars' } },
      star5: { id: 'star5', data: { name: '5 Stars' } },
    },
    relationships: {
      [ROOT_ID]: ['star1', 'star2', 'star3', 'star4', 'star5'],
    },
  })
}

function renderRadio(data: NormalizedData) {
  return render(
    <Aria pattern={radiogroup} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <span {...props} data-testid={`radio-${item.id}`}>
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

describe('APG Rating Radio Group — ARIA Structure', () => {
  it('role hierarchy: radiogroup > radio', () => {
    const { container } = renderRadio(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('radiogroup')
    expect(hierarchy).toContain('radio')
  })

  it('radios have aria-checked', () => {
    const { container } = renderRadio(fixtureData())
    expect(getNode(container, 'star1')?.getAttribute('aria-checked')).not.toBeNull()
  })

  it('initial focus on first radio', () => {
    const { container } = renderRadio(fixtureData())
    expect(getFocusedNodeId(container)).toBe('star1')
  })
})

describe('APG Rating Radio Group — Keyboard', () => {
  it('ArrowDown moves focus and selects (selectionFollowsFocus)', async () => {
    const user = userEvent.setup()
    const { container } = renderRadio(fixtureData())
    getNode(container, 'star1')!.focus()
    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('star2')
    expect(getNode(container, 'star2')?.getAttribute('aria-checked')).toBe('true')
  })

  it('ArrowDown wraps from last to first', async () => {
    const user = userEvent.setup()
    const { container } = renderRadio(fixtureData())
    getNode(container, 'star5')!.focus()
    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('star1')
  })

  it('click selects radio', async () => {
    const user = userEvent.setup()
    const { container } = renderRadio(fixtureData())
    await user.click(getNode(container, 'star3')!)
    expect(getNode(container, 'star3')?.getAttribute('aria-checked')).toBe('true')
  })
})
