import { describe, it, expect } from 'vitest'
import { tabs } from '../behaviors/tabs'

describe('tabs behavior preset', () => {
  it('has role tablist', () => {
    expect(tabs.role).toBe('tablist')
  })

  it('has horizontal roving-tabindex focus strategy', () => {
    expect(tabs.focusStrategy).toEqual({
      type: 'roving-tabindex',
      orientation: 'horizontal',
    })
  })

  it('uses ArrowLeft/Right for navigation (not Up/Down)', () => {
    expect(tabs.keyMap['ArrowRight']).toBeDefined()
    expect(tabs.keyMap['ArrowLeft']).toBeDefined()
    expect(tabs.keyMap['ArrowDown']).toBeUndefined()
    expect(tabs.keyMap['ArrowUp']).toBeUndefined()
  })

  it('Enter and Space both activate', () => {
    expect(tabs.keyMap['Enter']).toBeDefined()
    expect(tabs.keyMap['Space']).toBeDefined()
  })

  it('ariaAttributes returns aria-selected', () => {
    const attrs = tabs.ariaAttributes(
      { id: 'tab1' },
      { focused: true, selected: true, disabled: false, index: 0, siblingCount: 3 }
    )
    expect(attrs['aria-selected']).toBe('true')
  })
})
