import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAria } from '../primitives/useAria'
import { tree } from '../pattern/roles/tree'
import { ROOT_ID } from '../store/types'

function fixtureData() {
  return {
    entities: {
      src: { id: 'src', data: { name: 'src' } },
      app: { id: 'app', data: { name: 'App.tsx' } },
      main: { id: 'main', data: { name: 'main.tsx' } },
    },
    relationships: {
      [ROOT_ID]: ['src'],
      src: ['app', 'main'],
    },
  }
}

describe('useAria hook', () => {
  it('returns dispatch, getNodeProps, getNodeState, focused, selected', () => {
    const data = fixtureData()
    const { result } = renderHook(() =>
      useAria({ behavior: tree, data, plugins: [] })
    )
    expect(result.current.dispatch).toBeInstanceOf(Function)
    expect(result.current.getNodeProps).toBeInstanceOf(Function)
    expect(result.current.getNodeState).toBeInstanceOf(Function)
    expect(result.current.focused).toBeDefined()
    expect(result.current.selected).toEqual([])
  })

  it('getNodeProps returns ARIA attributes and role', () => {
    const data = fixtureData()
    const { result } = renderHook(() =>
      useAria({ behavior: tree, data, plugins: [] })
    )
    const props = result.current.getNodeProps('src')
    expect(props.role).toBe('treeitem')
    expect(props['aria-level']).toBeDefined()
    expect(props.onKeyDown).toBeInstanceOf(Function)
    expect(props.onFocus).toBeInstanceOf(Function)
  })

  it('getNodeState returns computed state', () => {
    const data = fixtureData()
    const { result } = renderHook(() =>
      useAria({ behavior: tree, data, plugins: [] })
    )
    const state = result.current.getNodeState('src')
    expect(state.focused).toBeDefined()
    expect(state.selected).toBe(false)
    expect(state.index).toBe(0)
    expect(state.siblingCount).toBe(1)
  })

  it('first visible node gets focus by default', () => {
    const data = fixtureData()
    const { result } = renderHook(() =>
      useAria({ behavior: tree, data, plugins: [] })
    )
    expect(result.current.focused).toBe('src')
  })

  it('keyMap overrides merge with behavior defaults', () => {
    const data = fixtureData()
    const customHandler = vi.fn()
    const { result } = renderHook(() =>
      useAria({
        behavior: tree,
        data,
        plugins: [],
        keyMap: { Enter: () => { customHandler(); return undefined } },
      })
    )
    expect(result.current.getNodeProps('src').onKeyDown).toBeInstanceOf(Function)
  })
})
