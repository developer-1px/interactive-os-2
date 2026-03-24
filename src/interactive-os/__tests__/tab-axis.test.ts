import { describe, it, expect } from 'vitest'
import { tab } from '../axis/tab'
import type { PatternContext } from '../pattern/types'

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

    it('Tab delegates to focusNext with wrap', () => {
      const result = tab('loop')
      const ctx = {
        focused: 'c',
        focusNext: (opts?: { wrap?: boolean }) => ({
          type: 'focus',
          payload: { nodeId: opts?.wrap ? 'a' : 'c' },
        }),
      }
      const cmd = result.keyMap['Tab'](ctx as unknown as PatternContext)
      expect(cmd).toMatchObject({ type: 'focus', payload: { nodeId: 'a' } })
    })

    it('Shift+Tab delegates to focusPrev with wrap', () => {
      const result = tab('loop')
      const ctx = {
        focused: 'a',
        focusPrev: (opts?: { wrap?: boolean }) => ({
          type: 'focus',
          payload: { nodeId: opts?.wrap ? 'c' : 'a' },
        }),
      }
      const cmd = result.keyMap['Shift+Tab'](ctx as unknown as PatternContext)
      expect(cmd).toMatchObject({ type: 'focus', payload: { nodeId: 'c' } })
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
