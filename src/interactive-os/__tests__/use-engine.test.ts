import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEngine } from '../hooks/useEngine'
import { ROOT_ID } from '../core/types'
import type { NormalizedData, Plugin, Command } from '../core/types'

function fixtureData(): NormalizedData {
  return {
    entities: {
      item1: { id: 'item1', data: { name: 'Item 1' } },
      item2: { id: 'item2', data: { name: 'Item 2' } },
    },
    relationships: {
      [ROOT_ID]: ['item1', 'item2'],
    },
  }
}

function makeSetNameCommand(id: string, name: string): Command {
  return {
    type: 'setName',
    payload: { id, name },
    execute(store: NormalizedData): NormalizedData {
      const entity = store.entities[id]
      return {
        ...store,
        entities: {
          ...store.entities,
          [id]: { ...entity, data: { ...entity.data, name } },
        },
      }
    },
    undo(store: NormalizedData): NormalizedData {
      return store // simplified for test
    },
  }
}

describe('useEngine hook', () => {
  it('creates engine from initial data', () => {
    const data = fixtureData()
    const { result } = renderHook(() => useEngine({ data }))

    expect(result.current.engine).toBeDefined()
    expect(result.current.engine.dispatch).toBeInstanceOf(Function)
    expect(result.current.engine.getStore).toBeInstanceOf(Function)
    expect(result.current.engine.syncStore).toBeInstanceOf(Function)
  })

  it('returns current store', () => {
    const data = fixtureData()
    const { result } = renderHook(() => useEngine({ data }))

    expect(result.current.store).toEqual(data)
    expect(result.current.store.entities.item1.data).toEqual({ name: 'Item 1' })
  })

  it('calls onChange when command dispatched', () => {
    const data = fixtureData()
    const onChange = vi.fn()
    const { result } = renderHook(() => useEngine({ data, onChange }))

    act(() => {
      result.current.engine.dispatch(makeSetNameCommand('item1', 'Updated'))
    })

    expect(onChange).toHaveBeenCalledTimes(1)
    const newStore = onChange.mock.calls[0][0] as NormalizedData
    expect(newStore.entities.item1.data).toEqual({ name: 'Updated' })
    // Store snapshot should also be updated after re-render
    expect(result.current.store.entities.item1.data).toEqual({ name: 'Updated' })
  })

  it('syncStore updates when external data changes', () => {
    const data1 = fixtureData()
    const data2: NormalizedData = {
      entities: {
        item1: { id: 'item1', data: { name: 'Changed' } },
        item2: { id: 'item2', data: { name: 'Item 2' } },
      },
      relationships: {
        [ROOT_ID]: ['item1', 'item2'],
      },
    }

    const { result, rerender } = renderHook(
      ({ data }) => useEngine({ data }),
      { initialProps: { data: data1 } }
    )

    expect(result.current.store.entities.item1.data).toEqual({ name: 'Item 1' })

    rerender({ data: data2 })

    expect(result.current.store.entities.item1.data).toEqual({ name: 'Changed' })
  })

  it('middleware pipeline works', () => {
    const data = fixtureData()
    const log: string[] = []

    const loggingPlugin: Plugin = {
      middleware: (next) => (command) => {
        log.push(`before:${command.type}`)
        next(command)
        log.push(`after:${command.type}`)
      },
    }

    const { result } = renderHook(() =>
      useEngine({ data, plugins: [loggingPlugin] })
    )

    act(() => {
      result.current.engine.dispatch(makeSetNameCommand('item1', 'Test'))
    })

    expect(log).toEqual(['before:setName', 'after:setName'])
  })
})
