import { describe, it, expect } from 'vitest'
import { listbox } from '../behaviors/listbox'

describe('listbox behavior preset', () => {
  it('has role listbox', () => {
    expect(listbox.role).toBe('listbox')
  })

  it('has vertical roving-tabindex focus strategy', () => {
    expect(listbox.focusStrategy).toEqual({
      type: 'roving-tabindex',
      orientation: 'vertical',
    })
  })

  it('defines APG-compliant keyboard mappings', () => {
    for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Space', 'Enter']) {
      expect(listbox.keyMap[key]).toBeDefined()
    }
  })

  it('does NOT have ArrowRight/Left (flat list, no nesting)', () => {
    expect(listbox.keyMap['ArrowRight']).toBeUndefined()
    expect(listbox.keyMap['ArrowLeft']).toBeUndefined()
  })

  it('ariaAttributes returns correct attributes', () => {
    const attrs = listbox.ariaAttributes(
      { id: 'test' },
      { focused: true, selected: true, disabled: false, index: 1, siblingCount: 3 }
    )
    expect(attrs['aria-selected']).toBe('true')
    expect(attrs['aria-posinset']).toBe('2')
    expect(attrs['aria-setsize']).toBe('3')
    expect(attrs['aria-expanded']).toBeUndefined()
  })
})
