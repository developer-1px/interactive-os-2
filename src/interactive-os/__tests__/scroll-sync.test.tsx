/**
 * Test: DOM scroll synchronization — scrollIntoView called when focus moves.
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../components/aria'
import { listbox } from '../behaviors/listbox'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core } from '../plugins/core'

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
  it('calls scrollIntoView when focus moves via keyboard', async () => {
    const scrollMock = vi.fn()
    // Stub scrollIntoView on HTMLElement prototype for jsdom
    HTMLElement.prototype.scrollIntoView = scrollMock

    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={listbox} data={fixtureStore()} plugins={[core()]}>
        <Aria.Item render={(node, state) => (
          <span data-focused={state.focused}>{(node as { data: { label: string } }).data.label}</span>
        )} />
      </Aria>
    )

    const first = container.querySelector('[data-node-id="a"]') as HTMLElement
    first.focus()
    scrollMock.mockClear()

    await user.keyboard('{ArrowDown}')

    // scrollIntoView should have been called for the newly focused node
    expect(scrollMock).toHaveBeenCalled()
    const lastCall = scrollMock.mock.calls[scrollMock.mock.calls.length - 1]
    expect(lastCall[0]).toEqual({ block: 'nearest', inline: 'nearest' })

    // Clean up
    // @ts-expect-error — removing stub
    delete HTMLElement.prototype.scrollIntoView
  })
})
