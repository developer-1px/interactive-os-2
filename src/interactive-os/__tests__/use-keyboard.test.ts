import { describe, it, expect } from 'vitest'
import { parseKeyCombo, matchKeyEvent } from '../hooks/useKeyboard'

describe('parseKeyCombo', () => {
  it('parses simple key', () => {
    expect(parseKeyCombo('ArrowDown')).toEqual({
      key: 'ArrowDown', ctrl: false, shift: false, alt: false, meta: false,
    })
  })

  it('parses Mod+key (Mod = Ctrl on non-Mac, Meta on Mac)', () => {
    const result = parseKeyCombo('Mod+C')
    expect(result.key).toBe('c')
    expect(result.ctrl || result.meta).toBe(true)
  })

  it('parses Ctrl+Shift+key', () => {
    expect(parseKeyCombo('Ctrl+Shift+Z')).toEqual({
      key: 'z', ctrl: true, shift: true, alt: false, meta: false,
    })
  })

  it('parses single character keys as lowercase', () => {
    expect(parseKeyCombo('F2').key).toBe('F2')
    expect(parseKeyCombo('Mod+C').key).toBe('c')
  })
})

describe('matchKeyEvent', () => {
  function makeEvent(overrides: Partial<KeyboardEvent>): KeyboardEvent {
    return {
      key: '', ctrlKey: false, shiftKey: false, altKey: false, metaKey: false,
      ...overrides,
    } as KeyboardEvent
  }

  it('matches simple arrow key', () => {
    expect(matchKeyEvent(makeEvent({ key: 'ArrowDown' }), 'ArrowDown')).toBe(true)
    expect(matchKeyEvent(makeEvent({ key: 'ArrowUp' }), 'ArrowDown')).toBe(false)
  })

  it('matches Ctrl+C', () => {
    expect(matchKeyEvent(makeEvent({ key: 'c', ctrlKey: true }), 'Ctrl+C')).toBe(true)
  })

  it('does not match when modifier is missing', () => {
    expect(matchKeyEvent(makeEvent({ key: 'c' }), 'Ctrl+C')).toBe(false)
  })

  it('does not match when extra modifier is present', () => {
    expect(matchKeyEvent(makeEvent({ key: 'c', ctrlKey: true, shiftKey: true }), 'Ctrl+C')).toBe(false)
  })

  it('matches Delete key', () => {
    expect(matchKeyEvent(makeEvent({ key: 'Delete' }), 'Delete')).toBe(true)
  })

  it('matches Space', () => {
    expect(matchKeyEvent(makeEvent({ key: ' ' }), 'Space')).toBe(true)
  })
})
