import { describe, it, expect } from 'vitest'
import { menu } from '../behaviors/menu'

describe('menu behavior preset', () => {
  it('has role menu', () => {
    expect(menu.role).toBe('menu')
  })

  it('has vertical roving-tabindex focus strategy', () => {
    expect(menu.focusStrategy).toEqual({
      type: 'roving-tabindex',
      orientation: 'vertical',
    })
  })

  it('defines APG-compliant keyboard mappings including submenu navigation', () => {
    const expectedKeys = ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End', 'Enter', 'Space']
    for (const key of expectedKeys) {
      expect(menu.keyMap[key]).toBeDefined()
    }
  })

  it('ariaAttributes returns aria-expanded when expanded is defined', () => {
    const node = { id: 'menu-item-1', name: 'File' }
    const state = {
      focused: true,
      selected: false,
      disabled: false,
      index: 0,
      siblingCount: 3,
      expanded: true,
    }
    const attrs = menu.ariaAttributes(node, state)
    expect(attrs['aria-expanded']).toBe('true')
  })

  it('ariaAttributes returns aria-expanded false when collapsed', () => {
    const node = { id: 'menu-item-2', name: 'Edit' }
    const state = {
      focused: false,
      selected: false,
      disabled: false,
      index: 1,
      siblingCount: 3,
      expanded: false,
    }
    const attrs = menu.ariaAttributes(node, state)
    expect(attrs['aria-expanded']).toBe('false')
  })

  it('ariaAttributes omits aria-expanded when not defined', () => {
    const node = { id: 'menu-item-3', name: 'Help' }
    const state = {
      focused: false,
      selected: false,
      disabled: false,
      index: 2,
      siblingCount: 3,
    }
    const attrs = menu.ariaAttributes(node, state)
    expect(attrs['aria-expanded']).toBeUndefined()
  })
})
