import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAria } from '../hooks/useAria'
import { listbox } from '../behaviors/listbox'
import { core, focusCommands, selectionCommands } from '../plugins/core'
import { history } from '../plugins/history'
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

// ── Gap 1: External data sync edge cases ──

describe('external data sync: focused item removed', () => {
  it('should recover focus when external data removes the focused item', () => {
    const store1 = makeStore(['a', 'b', 'c'])
    const onChange = vi.fn()

    const { result, rerender } = renderHook(
      ({ data }) => useAria({ behavior: listbox, data, plugins: [core()], onChange }),
      { initialProps: { data: store1 } },
    )

    act(() => {
      result.current.dispatch(focusCommands.setFocus('b'))
    })
    expect(result.current.focused).toBe('b')

    // External: remove 'b'
    const store2 = makeStore(['a', 'c'])
    rerender({ data: store2 })

    const focused = result.current.focused
    const store = result.current.getStore()
    const focusExists = focused in store.entities

    // ASSERTION: focused item should exist in the store
    // If this fails, we have a stale focus bug
    expect(focusExists).toBe(true)
  })
})

describe('external data sync: selected items removed', () => {
  it('should clean up selection when selected items are externally removed', () => {
    const store1 = makeStore(['a', 'b', 'c'])
    const onChange = vi.fn()

    const { result, rerender } = renderHook(
      ({ data }) => useAria({ behavior: listbox, data, plugins: [core()], onChange }),
      { initialProps: { data: store1 } },
    )

    act(() => {
      result.current.dispatch(selectionCommands.toggleSelect('b'))
    })
    expect(result.current.selected).toContain('b')

    // External: remove 'b'
    const store2 = makeStore(['a', 'c'])
    rerender({ data: store2 })

    const selected = result.current.selected
    const store = result.current.getStore()
    const orphaned = selected.filter(id => !(id in store.entities))

    // ASSERTION: no orphaned selections
    expect(orphaned).toEqual([])
  })
})

describe('external data sync: relationships change, entities same', () => {
  it('detects reorder even when entity objects are different refs', () => {
    const store1 = makeStore(['a', 'b', 'c'])
    const onChange = vi.fn()

    const { result, rerender } = renderHook(
      ({ data }) => useAria({ behavior: listbox, data, plugins: [core()], onChange }),
      { initialProps: { data: store1 } },
    )

    const store2 = makeStore(['c', 'a', 'b'])
    rerender({ data: store2 })

    const children = result.current.getStore().relationships[ROOT_ID]
    expect(children).toEqual(['c', 'a', 'b'])
  })
})

describe('external data sync: rapid consecutive updates', () => {
  it('handles multiple data changes in sequence', () => {
    const store1 = makeStore(['a'])
    const onChange = vi.fn()

    const { result, rerender } = renderHook(
      ({ data }) => useAria({ behavior: listbox, data, plugins: [core()], onChange }),
      { initialProps: { data: store1 } },
    )

    rerender({ data: makeStore(['a', 'b']) })
    rerender({ data: makeStore(['a', 'b', 'c']) })
    rerender({ data: makeStore(['a', 'b', 'c', 'd']) })

    const children = result.current.getStore().relationships[ROOT_ID]
    expect(children).toEqual(['a', 'b', 'c', 'd'])
    expect(result.current.focused).toBe('a')
  })
})

describe('external data sync + internal mutation', () => {
  it('external sync after focus change preserves both', () => {
    const store1 = makeStore(['a', 'b', 'c'])
    const onChange = vi.fn()

    const { result, rerender } = renderHook(
      ({ data }) => useAria({
        behavior: listbox,
        data,
        plugins: [core(), history()],
        onChange,
      }),
      { initialProps: { data: store1 } },
    )

    act(() => {
      result.current.dispatch(focusCommands.setFocus('c'))
    })
    expect(result.current.focused).toBe('c')

    const store2 = makeStore(['a', 'b', 'c', 'd'])
    rerender({ data: store2 })

    expect(result.current.focused).toBe('c')
    expect(result.current.getStore().relationships[ROOT_ID]).toContain('d')
  })
})

// ── Gap 2: initialFocus edge cases ──

describe('initialFocus: nested entity (not ROOT child)', () => {
  it('focuses a nested entity that exists in store but is not ROOT child', () => {
    const entities: Record<string, { id: string; data: { label: string } }> = {
      group1: { id: 'group1', data: { label: 'Group 1' } },
      child1: { id: 'child1', data: { label: 'Child 1' } },
      child2: { id: 'child2', data: { label: 'Child 2' } },
    }
    const store = createStore({
      entities,
      relationships: {
        [ROOT_ID]: ['group1'],
        group1: ['child1', 'child2'],
      },
    })
    const onChange = vi.fn()

    const { result } = renderHook(() =>
      useAria({
        behavior: listbox,
        data: store,
        plugins: [core()],
        onChange,
        initialFocus: 'child2',
      }),
    )

    expect(result.current.focused).toBe('child2')
  })
})

describe('initialFocus: empty store', () => {
  it('handles empty store gracefully with no crash', () => {
    const store = createStore({ entities: {}, relationships: { [ROOT_ID]: [] } })
    const onChange = vi.fn()

    const { result } = renderHook(() =>
      useAria({
        behavior: listbox,
        data: store,
        plugins: [core()],
        onChange,
        initialFocus: 'nonexistent',
      }),
    )

    // No items, no focus target → empty string or undefined-ish
    expect(result.current.focused).toBe('')
  })
})

// ── Meta-entity key collision ──

describe('syncStore: user entity with __ prefix', () => {
  it('should not clobber user entities that start with __', () => {
    const entities: Record<string, { id: string; data?: { label: string } }> = {
      a: { id: 'a', data: { label: 'A' } },
      __custom__: { id: '__custom__', data: { label: 'Custom' } },
    }
    const store1 = createStore({
      entities,
      relationships: { [ROOT_ID]: ['a', '__custom__'] },
    })
    const onChange = vi.fn()

    const { result, rerender } = renderHook(
      ({ data }) => useAria({ behavior: listbox, data, plugins: [core()], onChange }),
      { initialProps: { data: store1 } },
    )

    // Update: change __custom__ label
    const entities2: Record<string, { id: string; data?: { label: string } }> = {
      a: { id: 'a', data: { label: 'A' } },
      __custom__: { id: '__custom__', data: { label: 'Updated Custom' } },
    }
    const store2 = createStore({
      entities: entities2,
      relationships: { [ROOT_ID]: ['a', '__custom__'] },
    })
    rerender({ data: store2 })

    // The sync logic preserves ALL __ prefixed entities from the engine's internal state.
    // This means __custom__ from external data gets overwritten by internal __custom__.
    const entity = result.current.getStore().entities['__custom__'] as { data?: { label: string } }
    // This SHOULD be 'Updated Custom' from external data
    expect(entity?.data?.label).toBe('Updated Custom')
  })
})
