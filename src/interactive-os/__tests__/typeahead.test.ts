import { describe, it, expect } from 'vitest'
import { findTypeaheadMatch, isPrintableKey } from '../plugins/typeahead'

describe('isPrintableKey', () => {
  function makeEvent(overrides: Partial<KeyboardEvent>): KeyboardEvent {
    return { key: 'a', ctrlKey: false, metaKey: false, altKey: false, isComposing: false, ...overrides } as KeyboardEvent
  }

  it('returns true for single printable char without modifiers', () => {
    expect(isPrintableKey(makeEvent({ key: 'a' }))).toBe(true)
  })

  it('returns false for modifier combos', () => {
    expect(isPrintableKey(makeEvent({ key: 'a', ctrlKey: true }))).toBe(false)
    expect(isPrintableKey(makeEvent({ key: 'a', metaKey: true }))).toBe(false)
    expect(isPrintableKey(makeEvent({ key: 'a', altKey: true }))).toBe(false)
  })

  it('returns false during IME composing', () => {
    expect(isPrintableKey(makeEvent({ key: 'a', isComposing: true }))).toBe(false)
  })

  it('returns false for non-single-char keys', () => {
    expect(isPrintableKey(makeEvent({ key: 'ArrowDown' }))).toBe(false)
    expect(isPrintableKey(makeEvent({ key: 'Enter' }))).toBe(false)
    expect(isPrintableKey(makeEvent({ key: 'Escape' }))).toBe(false)
  })

  it('returns true for numbers and special chars', () => {
    expect(isPrintableKey(makeEvent({ key: '1' }))).toBe(true)
    expect(isPrintableKey(makeEvent({ key: '.' }))).toBe(true)
  })
})

describe('findTypeaheadMatch', () => {
  const nodes = [
    { id: 'apple', label: 'Apple' },
    { id: 'banana', label: 'Banana' },
    { id: 'blueberry', label: 'Blueberry' },
    { id: 'cherry', label: 'Cherry' },
    { id: 'date', label: 'Date' },
  ]

  it('finds first item matching single character', () => {
    const result = findTypeaheadMatch(nodes, 'b', '')
    expect(result).toBe('banana')
  })

  it('is case-insensitive', () => {
    const result = findTypeaheadMatch(nodes, 'B', '')
    expect(result).toBe('banana')
  })

  it('multi-char narrows search', () => {
    const result = findTypeaheadMatch(nodes, 'bl', '')
    expect(result).toBe('blueberry')
  })

  it('cycles to next match when searching from current focus', () => {
    const result = findTypeaheadMatch(nodes, 'b', 'banana')
    expect(result).toBe('blueberry')
  })

  it('wraps around to beginning when no match after current', () => {
    const result = findTypeaheadMatch(nodes, 'b', 'blueberry')
    expect(result).toBe('banana')
  })

  it('returns null when no match found', () => {
    const result = findTypeaheadMatch(nodes, 'z', '')
    expect(result).toBeNull()
  })

  it('returns null for empty nodes list', () => {
    const result = findTypeaheadMatch([], 'a', '')
    expect(result).toBeNull()
  })

  it('skips nodes with empty labels', () => {
    const withEmpty = [
      { id: 'no-label', label: '' },
      { id: 'banana', label: 'Banana' },
    ]
    const result = findTypeaheadMatch(withEmpty, 'b', '')
    expect(result).toBe('banana')
  })

  it('matches numbers', () => {
    const withNumbers = [{ id: 'item1', label: '123 File' }]
    const result = findTypeaheadMatch(withNumbers, '1', '')
    expect(result).toBe('item1')
  })

  it('stays on current if only match and single char buffer', () => {
    const single = [{ id: 'banana', label: 'Banana' }]
    const result = findTypeaheadMatch(single, 'b', 'banana')
    expect(result).toBe('banana')
  })
})
