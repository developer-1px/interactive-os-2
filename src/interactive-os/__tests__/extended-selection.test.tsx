/**
 * Test: Shift-based range selection (extended selection)
 *
 * Shift+Arrow moves focus AND selects all nodes between anchor and new focus.
 * Anchor is the node focused when Shift was first pressed.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../components/aria'
import { listbox } from '../behaviors/listbox'
import { treegrid } from '../behaviors/treegrid'
import { createStore } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core } from '../plugins/core'

function fixtureStore(): NormalizedData {
  return createStore({
    entities: {
      a: { id: 'a', data: { label: 'A' } },
      b: { id: 'b', data: { label: 'B' } },
      c: { id: 'c', data: { label: 'C' } },
      d: { id: 'd', data: { label: 'D' } },
      e: { id: 'e', data: { label: 'E' } },
    },
    relationships: { [ROOT_ID]: ['a', 'b', 'c', 'd', 'e'] },
  })
}

function getSelected(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[aria-selected="true"]'))
    .map(el => el.getAttribute('data-node-id')!)
}

function getFocused(container: HTMLElement): string {
  return container.querySelector('[tabindex="0"][data-node-id]')?.getAttribute('data-node-id') ?? ''
}

describe('extended selection — listbox', () => {
  function setup() {
    const user = userEvent.setup()
    const result = render(
      <Aria behavior={listbox} data={fixtureStore()} plugins={[core()]}>
        <Aria.Node render={(node, state) => (
          <span data-focused={state.focused}>{(node as { data: { label: string } }).data.label}</span>
        )} />
      </Aria>
    )
    return { user, container: result.container as HTMLElement }
  }

  it('Shift+ArrowDown selects current and next node', async () => {
    const { user, container } = setup()
    const first = container.querySelector('[data-node-id="a"]') as HTMLElement
    first.focus()

    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')

    expect(getFocused(container)).toBe('b')
    expect(getSelected(container)).toEqual(['a', 'b'])
  })

  it('Shift+ArrowDown twice extends from anchor', async () => {
    const { user, container } = setup()
    const first = container.querySelector('[data-node-id="a"]') as HTMLElement
    first.focus()

    await user.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}')

    expect(getFocused(container)).toBe('c')
    expect(getSelected(container)).toEqual(['a', 'b', 'c'])
  })

  it('Shift+ArrowUp selects backward', async () => {
    const { user, container } = setup()
    const first = container.querySelector('[data-node-id="a"]') as HTMLElement
    first.focus()

    // Move to 'c' first
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(getFocused(container)).toBe('c')

    await user.keyboard('{Shift>}{ArrowUp}{/Shift}')

    expect(getFocused(container)).toBe('b')
    expect(getSelected(container)).toEqual(['b', 'c'])
  })

  it('Shift+End selects from anchor to last node', async () => {
    const { user, container } = setup()
    const first = container.querySelector('[data-node-id="a"]') as HTMLElement
    first.focus()

    // Move to 'b'
    await user.keyboard('{ArrowDown}')

    await user.keyboard('{Shift>}{End}{/Shift}')

    expect(getFocused(container)).toBe('e')
    expect(getSelected(container)).toEqual(['b', 'c', 'd', 'e'])
  })

  it('Shift+Home selects from anchor to first node', async () => {
    const { user, container } = setup()
    const first = container.querySelector('[data-node-id="a"]') as HTMLElement
    first.focus()

    // Move to 'd'
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    expect(getFocused(container)).toBe('d')

    await user.keyboard('{Shift>}{Home}{/Shift}')

    expect(getFocused(container)).toBe('a')
    expect(getSelected(container)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('anchor resets after normal navigation', async () => {
    const { user, container } = setup()
    const first = container.querySelector('[data-node-id="a"]') as HTMLElement
    first.focus()

    // Shift+ArrowDown from 'a' → selects a,b
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
    expect(getSelected(container)).toEqual(['a', 'b'])

    // Normal ArrowDown (no shift) → moves to 'c', anchor should reset
    await user.keyboard('{ArrowDown}')
    expect(getFocused(container)).toBe('c')

    // Now Shift+ArrowDown from 'c' → new anchor at 'c', selects c,d
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
    expect(getFocused(container)).toBe('d')
    expect(getSelected(container)).toEqual(['c', 'd'])
  })
})

describe('extended selection — treegrid', () => {
  it('Shift+ArrowDown selects range in treegrid', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={treegrid} data={fixtureStore()} plugins={[core()]}>
        <Aria.Node render={(node, state) => (
          <div role="gridcell">
            <span data-focused={state.focused}>{(node as { data: { label: string } }).data.label}</span>
          </div>
        )} />
      </Aria>
    )

    const first = container.querySelector('[data-node-id="a"]') as HTMLElement
    first.focus()

    await user.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}')

    expect(getFocused(container)).toBe('c')
    expect(getSelected(container)).toEqual(['a', 'b', 'c'])
  })
})
