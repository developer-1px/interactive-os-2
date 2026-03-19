import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAria } from '../hooks/useAria'
import { listbox } from '../behaviors/listbox'
import { core, focusCommands } from '../plugins/core'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'

function makeStore(items: string[]): NormalizedData {
  const entities: Record<string, { id: string; data: { label: string } }> = {}
  for (const id of items) {
    entities[id] = { id, data: { label: id } }
  }
  return createStore({ entities, relationships: { [ROOT_ID]: items } })
}

describe('useAria: external data sync (Gap 1)', () => {
  it('reflects external data changes when data prop updates', () => {
    const store1 = makeStore(['a', 'b', 'c'])
    const store2 = makeStore(['a', 'b', 'c', 'd'])
    const onChange = vi.fn()

    const { result, rerender } = renderHook(
      ({ data }) => useAria({ behavior: listbox, data, plugins: [core()], onChange }),
      { initialProps: { data: store1 } },
    )

    // Initial: 3 items, focused on 'a'
    expect(result.current.focused).toBe('a')

    // External data change: add 'd'
    rerender({ data: store2 })

    // Engine should now see 'd'
    const store = result.current.getStore()
    const children = store.relationships[ROOT_ID]
    expect(children).toContain('d')
    expect(children).toHaveLength(4)
  })

  it('preserves focus when external data adds items', () => {
    const store1 = makeStore(['a', 'b'])
    const onChange = vi.fn()

    const { result, rerender } = renderHook(
      ({ data }) => useAria({ behavior: listbox, data, plugins: [core()], onChange }),
      { initialProps: { data: store1 } },
    )

    // Move focus to 'b'
    act(() => {
      result.current.dispatch(focusCommands.setFocus('b'))
    })
    expect(result.current.focused).toBe('b')

    // External: add 'c', keeping 'b' in the list
    const store2 = makeStore(['a', 'b', 'c'])
    rerender({ data: store2 })

    // Focus should remain on 'b'
    expect(result.current.focused).toBe('b')
  })
})

describe('useAria: initialFocus (Gap 2)', () => {
  it('focuses specified node instead of first child', () => {
    const store = makeStore(['a', 'b', 'c'])
    const onChange = vi.fn()

    const { result } = renderHook(() =>
      useAria({ behavior: listbox, data: store, plugins: [core()], onChange, initialFocus: 'b' }),
    )

    expect(result.current.focused).toBe('b')
  })

  it('falls back to first child if initialFocus not in store', () => {
    const store = makeStore(['a', 'b', 'c'])
    const onChange = vi.fn()

    const { result } = renderHook(() =>
      useAria({ behavior: listbox, data: store, plugins: [core()], onChange, initialFocus: 'z' }),
    )

    expect(result.current.focused).toBe('a')
  })
})
