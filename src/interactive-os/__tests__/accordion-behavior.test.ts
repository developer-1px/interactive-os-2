import { describe, it, expect } from 'vitest'
import { accordion } from '../behaviors/accordion'

describe('accordion behavior preset', () => {
  it('has role region', () => {
    expect(accordion.role).toBe('region')
  })

  it('has vertical roving-tabindex focus strategy', () => {
    expect(accordion.focusStrategy).toEqual({
      type: 'roving-tabindex',
      orientation: 'vertical',
    })
  })

  it('defines APG-compliant keyboard mappings', () => {
    const expectedKeys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', 'Space']
    for (const key of expectedKeys) {
      expect(accordion.keyMap[key]).toBeDefined()
    }
  })

  it('ariaAttributes returns aria-expanded when expanded is defined', () => {
    const node = { id: 'header-1', name: 'Header 1' }
    const state = {
      focused: true,
      selected: false,
      disabled: false,
      index: 0,
      siblingCount: 3,
      expanded: true,
    }
    const attrs = accordion.ariaAttributes(node, state)
    expect(attrs['aria-expanded']).toBe('true')
  })

  it('ariaAttributes returns aria-expanded false when collapsed', () => {
    const node = { id: 'header-2', name: 'Header 2' }
    const state = {
      focused: false,
      selected: false,
      disabled: false,
      index: 1,
      siblingCount: 3,
      expanded: false,
    }
    const attrs = accordion.ariaAttributes(node, state)
    expect(attrs['aria-expanded']).toBe('false')
  })

  it('ariaAttributes omits aria-expanded when not defined', () => {
    const node = { id: 'header-3', name: 'Header 3' }
    const state = {
      focused: false,
      selected: false,
      disabled: false,
      index: 2,
      siblingCount: 3,
    }
    const attrs = accordion.ariaAttributes(node, state)
    expect(attrs['aria-expanded']).toBeUndefined()
  })
})
