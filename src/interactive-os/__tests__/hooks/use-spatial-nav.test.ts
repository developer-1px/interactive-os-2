import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSpatialNav } from '../../plugins/useSpatialNav'
import type { NormalizedData } from '../../store/types'
import { ROOT_ID } from '../../store/types'
import { createStore } from '../../store/createStore'

const DIRECTIONS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'] as const

describe('useSpatialNav — keyMap structure', () => {
  const store: NormalizedData = createStore({
    entities: { a: { id: 'a' } },
    relationships: { [ROOT_ID]: ['a'] },
  })

  it('returns object with keyMap and clearCursorsAtDepth', () => {
    const { result } = renderHook(() => useSpatialNav('#root', store))
    expect(result.current).toHaveProperty('keyMap')
    expect(result.current).toHaveProperty('clearCursorsAtDepth')
    expect(typeof result.current.clearCursorsAtDepth).toBe('function')
  })

  it('returns all 4 plain Arrow handlers in keyMap', () => {
    const { result } = renderHook(() => useSpatialNav('#root', store))
    const keys = Object.keys(result.current.keyMap)

    for (const dir of DIRECTIONS) {
      expect(keys).toContain(dir)
      expect(typeof result.current.keyMap[dir]).toBe('function')
    }
  })

  it('returns all 4 Shift+Arrow handlers in keyMap', () => {
    const { result } = renderHook(() => useSpatialNav('#root', store))
    const keys = Object.keys(result.current.keyMap)

    for (const dir of DIRECTIONS) {
      const key = `Shift+${dir}`
      expect(keys).toContain(key)
      expect(typeof result.current.keyMap[key]).toBe('function')
    }
  })

  it('Shift+Arrow handler is no-op when no rects available (jsdom)', () => {
    const { result } = renderHook(() => useSpatialNav('#root', store))

    const extendSelectionTo = vi.fn(() => ({ type: 'test', payload: null, execute: (s: NormalizedData) => s }))
    const ctx = {
      focused: 'a',
      extendSelectionTo,
    } as unknown as Parameters<(typeof result.current.keyMap)['Shift+ArrowDown']>[0]

    const cmd = result.current.keyMap['Shift+ArrowDown'](ctx)
    expect(cmd).toBeUndefined()
  })
})
