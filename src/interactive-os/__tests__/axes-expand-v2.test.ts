// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { expand } from '../axes/expand'
import type { BehaviorContext } from '../behaviors/types'
import type { Command } from '../core/types'

function makeCmd(type: string): Command {
  return {
    type,
    payload: null,
    execute: (s) => s,
    undo: (s) => s,
  }
}

function makeMockCtx(overrides?: Partial<BehaviorContext>): BehaviorContext {
  return {
    focused: 'node-1',
    selected: [],
    isExpanded: false,
    focusNext: vi.fn(() => makeCmd('focusNext')),
    focusPrev: vi.fn(() => makeCmd('focusPrev')),
    focusFirst: vi.fn(() => makeCmd('focusFirst')),
    focusLast: vi.fn(() => makeCmd('focusLast')),
    focusParent: vi.fn(() => makeCmd('focusParent')),
    focusChild: vi.fn(() => makeCmd('focusChild')),
    expand: vi.fn(() => makeCmd('expand')),
    collapse: vi.fn(() => makeCmd('collapse')),
    activate: vi.fn(() => makeCmd('activate')),
    toggleSelect: vi.fn(() => makeCmd('toggleSelect')),
    extendSelection: vi.fn((dir) => makeCmd(`extendSelection:${dir}`)),
    extendSelectionTo: vi.fn((id) => makeCmd(`extendSelectionTo:${id}`)),
    dispatch: vi.fn(),
    getEntity: vi.fn(() => undefined),
    getChildren: vi.fn(() => []),
    ...overrides,
  }
}

describe('expand() factory — arrow mode', () => {
  it('binds ArrowRight and ArrowLeft, config is empty (expandable managed by activate)', () => {
    const axis = expand({ mode: 'arrow' })
    expect(axis.keyMap).toHaveProperty('ArrowRight')
    expect(axis.keyMap).toHaveProperty('ArrowLeft')
    expect(axis.config).toEqual({})
  })

  it('ArrowRight calls expand() when collapsed', () => {
    const axis = expand({ mode: 'arrow' })
    const ctx = makeMockCtx({ isExpanded: false })
    const result = axis.keyMap['ArrowRight'](ctx)
    expect(ctx.expand).toHaveBeenCalled()
    expect(ctx.focusChild).not.toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'expand' })
  })

  it('ArrowRight calls focusChild() when expanded', () => {
    const axis = expand({ mode: 'arrow' })
    const ctx = makeMockCtx({ isExpanded: true })
    const result = axis.keyMap['ArrowRight'](ctx)
    expect(ctx.focusChild).toHaveBeenCalled()
    expect(ctx.expand).not.toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusChild' })
  })

  it('ArrowLeft calls collapse() when expanded', () => {
    const axis = expand({ mode: 'arrow' })
    const ctx = makeMockCtx({ isExpanded: true })
    const result = axis.keyMap['ArrowLeft'](ctx)
    expect(ctx.collapse).toHaveBeenCalled()
    expect(ctx.focusParent).not.toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'collapse' })
  })

  it('ArrowLeft calls focusParent() when collapsed', () => {
    const axis = expand({ mode: 'arrow' })
    const ctx = makeMockCtx({ isExpanded: false })
    const result = axis.keyMap['ArrowLeft'](ctx)
    expect(ctx.focusParent).toHaveBeenCalled()
    expect(ctx.collapse).not.toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusParent' })
  })
})

describe('expand() factory — enter-esc mode', () => {
  it('binds Enter and Escape, config is empty (expandable managed by activate)', () => {
    const axis = expand({ mode: 'enter-esc' })
    expect(axis.keyMap).toHaveProperty('Enter')
    expect(axis.keyMap).toHaveProperty('Escape')
    expect(axis.config).toEqual({})
  })

  it('Enter returns batch command when node has children', () => {
    const axis = expand({ mode: 'enter-esc' })
    const ctx = makeMockCtx({
      focused: 'parent-1',
      getChildren: vi.fn(() => ['child-1', 'child-2']),
    })
    const result = axis.keyMap['Enter'](ctx)
    expect(result).toBeDefined()
    expect(result).toMatchObject({ type: 'batch' })
  })

  it('Enter returns rename command when node is a leaf', () => {
    const axis = expand({ mode: 'enter-esc' })
    const ctx = makeMockCtx({
      focused: 'leaf-1',
      getChildren: vi.fn(() => []),
    })
    const result = axis.keyMap['Enter'](ctx)
    expect(result).toBeDefined()
    expect(result).toMatchObject({ type: 'rename:start', payload: { nodeId: 'leaf-1' } })
  })

  it('Escape returns batch command when spatial parent exists and is not ROOT', () => {
    const axis = expand({ mode: 'enter-esc' })
    const ctx = makeMockCtx({
      focused: 'child-1',
      getEntity: vi.fn((id) => {
        if (id === '__spatial_parent__') {
          return { id: '__spatial_parent__', parentId: 'parent-1' }
        }
        return undefined
      }),
    })
    const result = axis.keyMap['Escape'](ctx)
    expect(result).toBeDefined()
    expect(result).toMatchObject({ type: 'batch' })
  })

  it('Escape returns undefined when no spatial parent entity', () => {
    const axis = expand({ mode: 'enter-esc' })
    const ctx = makeMockCtx({
      focused: 'root-child',
      getEntity: vi.fn(() => undefined),
    })
    const result = axis.keyMap['Escape'](ctx)
    expect(result).toBeUndefined()
  })

  it('Escape returns undefined when spatial parent is ROOT_ID', () => {
    const axis = expand({ mode: 'enter-esc' })
    const ctx = makeMockCtx({
      focused: 'top-level',
      getEntity: vi.fn((id) => {
        if (id === '__spatial_parent__') {
          return { id: '__spatial_parent__', parentId: '__root__' }
        }
        return undefined
      }),
    })
    const result = axis.keyMap['Escape'](ctx)
    expect(result).toBeUndefined()
  })
})

describe('expand() factory — default mode', () => {
  it('default mode is arrow (binds ArrowRight and ArrowLeft)', () => {
    const axis = expand()
    expect(axis.keyMap).toHaveProperty('ArrowRight')
    expect(axis.keyMap).toHaveProperty('ArrowLeft')
    expect(axis.keyMap).not.toHaveProperty('Enter')
    expect(axis.keyMap).not.toHaveProperty('Escape')
    expect(axis.config).toEqual({})
  })
})
