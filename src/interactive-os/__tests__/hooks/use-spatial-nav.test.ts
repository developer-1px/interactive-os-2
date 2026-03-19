import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSpatialNav } from '../../hooks/use-spatial-nav'
import type { NormalizedData } from '../../core/types'
import { ROOT_ID } from '../../core/types'
import { createStore } from '../../core/createStore'

const DIRECTIONS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'] as const

describe('useSpatialNav — keyMap structure', () => {
  const store: NormalizedData = createStore({
    entities: { a: { id: 'a' } },
    relationships: { [ROOT_ID]: ['a'] },
  })

  it('returns all 4 plain Arrow handlers', () => {
    const { result } = renderHook(() => useSpatialNav('#root', store))
    const keys = Object.keys(result.current)

    for (const dir of DIRECTIONS) {
      expect(keys).toContain(dir)
      expect(typeof result.current[dir]).toBe('function')
    }
  })

  it('returns all 4 Shift+Arrow handlers', () => {
    const { result } = renderHook(() => useSpatialNav('#root', store))
    const keys = Object.keys(result.current)

    for (const dir of DIRECTIONS) {
      const key = `Shift+${dir}`
      expect(keys).toContain(key)
      expect(typeof result.current[key]).toBe('function')
    }
  })

  it('Shift+Arrow handler is no-op when no rects available (jsdom)', () => {
    const { result } = renderHook(() => useSpatialNav('#root', store))

    const extendSelectionTo = vi.fn(() => ({ type: 'test', payload: null, execute: (s: NormalizedData) => s, undo: (s: NormalizedData) => s }))
    const ctx = {
      focused: 'a',
      extendSelectionTo,
    } as Parameters<(typeof result.current)['Shift+ArrowDown']>[0]

    const cmd = result.current['Shift+ArrowDown'](ctx)
    expect(cmd).toBeUndefined()
    expect(extendSelectionTo).not.toHaveBeenCalled()
  })
})
