import { describe, it, expect, vi } from 'vitest'
import { depthArrow } from '../axes/depthArrow'
import { depthEnterEsc } from '../axes/depthEnterEsc'
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

describe('depthArrow', () => {
  it('ArrowRight calls focusChild() when isExpanded=true', () => {
    const ctx = makeMockCtx({ isExpanded: true })
    const result = depthArrow['ArrowRight'](ctx)
    expect(ctx.focusChild).toHaveBeenCalled()
    expect(ctx.expand).not.toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusChild' })
  })

  it('ArrowRight calls expand() when isExpanded=false', () => {
    const ctx = makeMockCtx({ isExpanded: false })
    const result = depthArrow['ArrowRight'](ctx)
    expect(ctx.expand).toHaveBeenCalled()
    expect(ctx.focusChild).not.toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'expand' })
  })

  it('ArrowLeft calls collapse() when isExpanded=true', () => {
    const ctx = makeMockCtx({ isExpanded: true })
    const result = depthArrow['ArrowLeft'](ctx)
    expect(ctx.collapse).toHaveBeenCalled()
    expect(ctx.focusParent).not.toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'collapse' })
  })

  it('ArrowLeft calls focusParent() when isExpanded=false', () => {
    const ctx = makeMockCtx({ isExpanded: false })
    const result = depthArrow['ArrowLeft'](ctx)
    expect(ctx.focusParent).toHaveBeenCalled()
    expect(ctx.collapse).not.toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusParent' })
  })
})

describe('depthEnterEsc', () => {
  describe('Enter', () => {
    it('returns a batch command when focused node has children', () => {
      const ctx = makeMockCtx({
        focused: 'parent-1',
        getChildren: vi.fn(() => ['child-1', 'child-2']),
      })
      const result = depthEnterEsc['Enter'](ctx)
      expect(result).toBeDefined()
      expect(result).toMatchObject({ type: 'batch' })
    })

    it('returns a rename command when focused node has no children', () => {
      const ctx = makeMockCtx({
        focused: 'leaf-1',
        getChildren: vi.fn(() => []),
      })
      const result = depthEnterEsc['Enter'](ctx)
      expect(result).toBeDefined()
      expect(result).toMatchObject({ type: 'rename:start', payload: { nodeId: 'leaf-1' } })
    })
  })

  describe('Escape', () => {
    it('returns a batch command when there is a valid spatial parent', () => {
      const ctx = makeMockCtx({
        focused: 'child-1',
        getEntity: vi.fn((id) => {
          if (id === '__spatial_parent__') {
            return { id: '__spatial_parent__', parentId: 'parent-1' }
          }
          return undefined
        }),
      })
      const result = depthEnterEsc['Escape'](ctx)
      expect(result).toBeDefined()
      expect(result).toMatchObject({ type: 'batch' })
    })

    it('returns undefined when at root (no spatial parent entity)', () => {
      const ctx = makeMockCtx({
        focused: 'root-child',
        getEntity: vi.fn(() => undefined),
      })
      const result = depthEnterEsc['Escape'](ctx)
      expect(result).toBeUndefined()
    })

    it('returns undefined when spatial parent is ROOT_ID', () => {
      const ctx = makeMockCtx({
        focused: 'top-level',
        getEntity: vi.fn((id) => {
          if (id === '__spatial_parent__') {
            return { id: '__spatial_parent__', parentId: '__root__' }
          }
          return undefined
        }),
      })
      const result = depthEnterEsc['Escape'](ctx)
      expect(result).toBeUndefined()
    })
  })
})
