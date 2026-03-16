import { describe, it, expect } from 'vitest'
import { treegrid } from '../behaviors/treegrid'

describe('treegrid behavior preset', () => {
  it('has role treegrid', () => {
    expect(treegrid.role).toBe('treegrid')
  })

  it('has vertical roving-tabindex focus strategy', () => {
    expect(treegrid.focusStrategy).toEqual({
      type: 'roving-tabindex',
      orientation: 'vertical',
    })
  })

  it('defines APG-compliant keyboard mappings', () => {
    const expectedKeys = ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Enter', 'Space', 'Home', 'End']
    for (const key of expectedKeys) {
      expect(treegrid.keyMap[key]).toBeDefined()
    }
  })

  it('ariaAttributes returns correct attributes for a tree node', () => {
    const node = { id: 'test', name: 'Test' }
    const state = {
      focused: true, selected: false, disabled: false,
      index: 2, siblingCount: 5, expanded: true, level: 3,
    }
    const attrs = treegrid.ariaAttributes(node, state)
    expect(attrs['aria-expanded']).toBe('true')
    expect(attrs['aria-level']).toBe('3')
    expect(attrs['aria-selected']).toBe('false')
    expect(attrs['aria-posinset']).toBe('3')
    expect(attrs['aria-setsize']).toBe('5')
  })

  it('ariaAttributes omits aria-expanded for leaf nodes', () => {
    const node = { id: 'leaf', name: 'Leaf' }
    const state = { focused: false, selected: false, disabled: false, index: 0, siblingCount: 1 }
    const attrs = treegrid.ariaAttributes(node, state)
    expect(attrs['aria-expanded']).toBeUndefined()
  })
})
