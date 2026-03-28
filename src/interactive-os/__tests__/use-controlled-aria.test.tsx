import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useControlledAria } from '../primitives/useControlledAria'
import { listbox } from '../pattern/roles/listbox'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { Command } from '../engine/types'
import { focusCommands } from '../axis/navigate'

function fixtureStore(): NormalizedData {
  const store = createStore({
    entities: {
      a: { id: 'a', data: { label: 'A' } },
      b: { id: 'b', data: { label: 'B' } },
    },
    relationships: { [ROOT_ID]: ['a', 'b'] },
  })
  // Pre-set focus on first item
  return focusCommands.setFocus('a').execute(store)
}

function TestComponent({ store, onDispatch }: { store: NormalizedData; onDispatch: (cmd: Command) => void }) {
  const aria = useControlledAria({ behavior: listbox(), store, onDispatch })
  return (
    <div role="listbox">
      {['a', 'b'].map(id => {
        const props = aria.getNodeProps(id)
        const state = aria.getNodeState(id)
        return (
          <div key={id} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
            <span data-testid={id} data-focused={state.focused}>{id}</span>
          </div>
        )
      })}
    </div>
  )
}

describe('useControlledAria', () => {
  it('calls onDispatch when ArrowDown is pressed', async () => {
    const onDispatch = vi.fn()
    const user = userEvent.setup()
    const { container } = render(<TestComponent store={fixtureStore()} onDispatch={onDispatch} />)

    ;(container.querySelector('[data-node-id="a"]') as HTMLElement).focus()
    await user.keyboard('{ArrowDown}')

    expect(onDispatch).toHaveBeenCalledTimes(1)
    const cmd = onDispatch.mock.calls[0][0]
    expect(cmd.type).toBe('core:focus')
  })

  it('reads store from props (controlled)', () => {
    const onDispatch = vi.fn()
    const { container, rerender } = render(
      <TestComponent store={fixtureStore()} onDispatch={onDispatch} />
    )

    expect(container.querySelector('[data-testid="a"]')?.getAttribute('data-focused')).toBe('true')

    // Re-render with focus moved to 'b'
    const newStore = focusCommands.setFocus('b').execute(fixtureStore())
    rerender(<TestComponent store={newStore} onDispatch={onDispatch} />)

    expect(container.querySelector('[data-testid="b"]')?.getAttribute('data-focused')).toBe('true')
  })
})
