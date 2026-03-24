import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEngine } from '../engine/useEngine'
import { useAriaZone } from '../primitives/useAriaZone'
import { listbox } from '../pattern/listbox'
import { history } from '../plugins/history'
import { focusCommands } from '../plugins/core'
import { crudCommands } from '../plugins/crud'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { Command } from '../engine/types'

const testStore: NormalizedData = {
  entities: {
    a: { id: 'a', data: { label: 'A' } },
    b: { id: 'b', data: { label: 'B' } },
    c: { id: 'c', data: { label: 'C' } },
  },
  relationships: {
    [ROOT_ID]: ['a', 'b', 'c'],
  },
}

const plugins: Plugin[] = [history()]

describe('useAriaZone', () => {
  it('initial focus on first item', () => {
    function App() {
      const { engine, store } = useEngine({ data: testStore, plugins })
      const aria = useAriaZone({ engine, store, behavior: listbox(), scope: 'test' })
      return <div data-testid="f">{aria.focused}</div>
    }
    const { getByTestId } = render(<App />)
    expect(getByTestId('f').textContent).toBe('a')
  })

  it('dispatch setFocus updates focused', () => {
    const holder = { dispatch: null as null | ((cmd: Command) => void) }
    function App() {
      const { engine, store } = useEngine({ data: testStore, plugins })
      const aria = useAriaZone({ engine, store, behavior: listbox(), scope: 'test' })
      // eslint-disable-next-line react-hooks/immutability
      holder.dispatch = aria.dispatch
      return <div data-testid="f">{aria.focused}</div>
    }
    const { getByTestId } = render(<App />)
    expect(getByTestId('f').textContent).toBe('a')

    act(() => { holder.dispatch!(focusCommands.setFocus('b')) })
    expect(getByTestId('f').textContent).toBe('b')
  })

  it('getNodeProps uses scoped data attribute', () => {
    function App() {
      const { engine, store } = useEngine({ data: testStore, plugins })
      const aria = useAriaZone({ engine, store, behavior: listbox(), scope: 'test' })
      return (
        <div>{['a', 'b', 'c'].map(id => (
          <div key={id} {...(aria.getNodeProps(id) as React.HTMLAttributes<HTMLDivElement>)}>{id}</div>
        ))}</div>
      )
    }
    const { container } = render(<App />)
    expect(container.querySelector('[data-test-id="a"]')).toBeTruthy()
    expect(container.querySelector('[data-node-id]')).toBeNull()
  })

  it('keyboard ArrowDown moves focus', async () => {
    const user = userEvent.setup()
    function App() {
      const { engine, store } = useEngine({ data: testStore, plugins })
      const aria = useAriaZone({ engine, store, behavior: listbox(), scope: 'test' })
      return (
        <div role="listbox" data-aria-container="">
          {['a', 'b', 'c'].map(id => (
            <div key={id} {...(aria.getNodeProps(id) as React.HTMLAttributes<HTMLDivElement>)}>{id}</div>
          ))}
        </div>
      )
    }
    const { container } = render(<App />)
    const first = container.querySelector('[data-test-id="a"]') as HTMLElement
    first.focus()
    await user.keyboard('{ArrowDown}')
    const focused = container.querySelector('[tabindex="0"]')
    expect(focused?.getAttribute('data-test-id')).toBe('b')
  })

  it('two zones share engine — independent focus', () => {
    const holder = { dispatchA: null as null | ((cmd: Command) => void), dispatchB: null as null | ((cmd: Command) => void) }
    function App() {
      const { engine, store } = useEngine({ data: testStore, plugins })
      const zoneA = useAriaZone({ engine, store, behavior: listbox(), scope: 'za' })
      const zoneB = useAriaZone({ engine, store, behavior: listbox(), scope: 'zb' })
      // eslint-disable-next-line react-hooks/immutability
      holder.dispatchA = zoneA.dispatch
      // eslint-disable-next-line react-hooks/immutability
      holder.dispatchB = zoneB.dispatch
      return (
        <div>
          <div data-testid="fa">{zoneA.focused}</div>
          <div data-testid="fb">{zoneB.focused}</div>
        </div>
      )
    }
    const { getByTestId } = render(<App />)
    expect(getByTestId('fa').textContent).toBe('a')
    expect(getByTestId('fb').textContent).toBe('a')

    // Move zone A focus — zone B unaffected
    act(() => { holder.dispatchA!(focusCommands.setFocus('c')) })
    expect(getByTestId('fa').textContent).toBe('c')
    expect(getByTestId('fb').textContent).toBe('a')
  })

  it('two zones share engine — data command visible in both', () => {
    const holder = { dispatchA: null as null | ((cmd: Command) => void) }
    function App() {
      const { engine, store } = useEngine({ data: testStore, plugins })
      const zoneA = useAriaZone({ engine, store, behavior: listbox(), scope: 'za' })
      const _zoneB = useAriaZone({ engine, store, behavior: listbox(), scope: 'zb' })
      // eslint-disable-next-line react-hooks/immutability
      holder.dispatchA = zoneA.dispatch
      const itemsA = Object.keys(store.entities).filter(k => !k.startsWith('__'))
      const itemsB = Object.keys(store.entities).filter(k => !k.startsWith('__'))
      return (
        <div>
          <div data-testid="countA">{itemsA.length}</div>
          <div data-testid="countB">{itemsB.length}</div>
        </div>
      )
    }
    const { getByTestId } = render(<App />)
    expect(getByTestId('countA').textContent).toBe('3')

    // Delete item 'c' from zone A
    act(() => { holder.dispatchA!(crudCommands.remove('c')) })
    expect(getByTestId('countA').textContent).toBe('2')
    expect(getByTestId('countB').textContent).toBe('2')
  })
})
