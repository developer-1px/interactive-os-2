import { describe, it, expect } from 'vitest'
import { tab } from '../axes/tab'

describe('tab axis', () => {
  describe('native', () => {
    it('returns empty keyMap and empty config', () => {
      const result = tab('native')
      expect(Object.keys(result.keyMap)).toHaveLength(0)
      expect(result.config).toEqual({})
    })
  })

  describe('flow', () => {
    it('returns empty keyMap and natural-tab-order tabFocusStrategy', () => {
      const result = tab('flow')
      expect(Object.keys(result.keyMap)).toHaveLength(0)
      expect(result.config).toEqual({
        tabFocusStrategy: { type: 'natural-tab-order', orientation: 'both' },
      })
    })
  })

  describe('loop', () => {
    it('returns Tab/Shift+Tab keyMap and natural-tab-order tabFocusStrategy', () => {
      const result = tab('loop')
      expect(result.keyMap).toHaveProperty('Tab')
      expect(result.keyMap).toHaveProperty('Shift+Tab')
      expect(result.config).toEqual({
        tabFocusStrategy: { type: 'natural-tab-order', orientation: 'both' },
      })
    })

    it('Tab at last item wraps to first', () => {
      const result = tab('loop')
      const ctx = {
        focused: 'c',
        focusNext: () => ({ type: 'focus', payload: { nodeId: 'c' } }),
        focusFirst: () => ({ type: 'focus', payload: { nodeId: 'a' } }),
      }
      const cmd = result.keyMap['Tab'](ctx as any)
      expect(cmd).toMatchObject({ type: 'focus', payload: { nodeId: 'a' } })
    })

    it('Tab at non-last item does nothing (browser handles)', () => {
      const result = tab('loop')
      const ctx = {
        focused: 'a',
        focusNext: () => ({ type: 'focus', payload: { nodeId: 'b' } }),
      }
      const cmd = result.keyMap['Tab'](ctx as any)
      expect(cmd).toBeUndefined()
    })

    it('Shift+Tab at first item wraps to last', () => {
      const result = tab('loop')
      const ctx = {
        focused: 'a',
        focusPrev: () => ({ type: 'focus', payload: { nodeId: 'a' } }),
        focusLast: () => ({ type: 'focus', payload: { nodeId: 'c' } }),
      }
      const cmd = result.keyMap['Shift+Tab'](ctx as any)
      expect(cmd).toMatchObject({ type: 'focus', payload: { nodeId: 'c' } })
    })

    it('Shift+Tab at non-first item does nothing (browser handles)', () => {
      const result = tab('loop')
      const ctx = {
        focused: 'b',
        focusPrev: () => ({ type: 'focus', payload: { nodeId: 'a' } }),
      }
      const cmd = result.keyMap['Shift+Tab'](ctx as any)
      expect(cmd).toBeUndefined()
    })
  })

  describe('escape', () => {
    it('returns empty keyMap and roving-tabindex tabFocusStrategy with default orientation', () => {
      const result = tab('escape')
      expect(Object.keys(result.keyMap)).toHaveLength(0)
      expect(result.config).toEqual({
        tabFocusStrategy: { type: 'roving-tabindex', orientation: 'both' },
      })
    })

    it('accepts custom orientation', () => {
      const result = tab('escape', { orientation: 'vertical' })
      expect(result.config).toEqual({
        tabFocusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
      })
    })
  })
})
