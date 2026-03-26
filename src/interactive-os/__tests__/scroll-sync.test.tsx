/**
 * Test: DOM scroll synchronization — container scrollTop adjusts when focus moves.
 * jsdom has no layout engine, so we mock getBoundingClientRect and scroll dimensions.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { listbox } from '../pattern/examples/listbox'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'

function fixtureStore(): NormalizedData {
  return createStore({
    entities: {
      a: { id: 'a', data: { label: 'A' } },
      b: { id: 'b', data: { label: 'B' } },
      c: { id: 'c', data: { label: 'C' } },
    },
    relationships: { [ROOT_ID]: ['a', 'b', 'c'] },
  })
}

describe('scroll sync', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('adjusts container scrollTop when focused item is below viewport', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={listbox()} data={fixtureStore()} plugins={[]}>
        <Aria.Item render={(props, node, state) => (
          <span {...props} data-focused={state.focused}>{(node as { data: { label: string } }).data.label}</span>
        )} />
      </Aria>
    )

    const ariaContainer = container.querySelector('[data-aria-container]') as HTMLElement
    // Mock scrollable container: 100px tall, 300px content
    Object.defineProperty(ariaContainer, 'scrollHeight', { value: 300, configurable: true })
    Object.defineProperty(ariaContainer, 'clientHeight', { value: 100, configurable: true })
    vi.spyOn(ariaContainer, 'getBoundingClientRect').mockReturnValue(
      { top: 0, bottom: 100, left: 0, right: 200, width: 200, height: 100, x: 0, y: 0, toJSON: () => {} },
    )

    const first = container.querySelector('[data-node-id="a"]') as HTMLElement
    first.focus()

    // Item B is below the container viewport
    const itemB = container.querySelector('[data-node-id="b"]') as HTMLElement
    vi.spyOn(itemB, 'getBoundingClientRect').mockReturnValue(
      { top: 120, bottom: 150, left: 0, right: 200, width: 200, height: 30, x: 0, y: 120, toJSON: () => {} },
    )

    await user.keyboard('{ArrowDown}')

    // scrollTop should increase to bring item B into view
    expect(ariaContainer.scrollTop).toBeGreaterThan(0)
  })

  it('does not scroll outer containers', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={listbox()} data={fixtureStore()} plugins={[]}>
        <Aria.Item render={(props, node, state) => (
          <span {...props} data-focused={state.focused}>{(node as { data: { label: string } }).data.label}</span>
        )} />
      </Aria>
    )

    const ariaContainer = container.querySelector('[data-aria-container]') as HTMLElement
    // Non-scrollable container (content fits)
    Object.defineProperty(ariaContainer, 'scrollHeight', { value: 100, configurable: true })
    Object.defineProperty(ariaContainer, 'clientHeight', { value: 100, configurable: true })

    const first = container.querySelector('[data-node-id="a"]') as HTMLElement
    first.focus()

    // Parent scroll position should not change
    const parentScrollBefore = container.scrollTop

    await user.keyboard('{ArrowDown}')

    expect(container.scrollTop).toBe(parentScrollBefore)
  })
})
