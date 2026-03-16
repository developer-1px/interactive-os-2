import { describe, it, expect } from 'vitest'
import { toolbar } from '../behaviors/toolbar'

describe('toolbar behavior preset', () => {
  it('has role toolbar', () => {
    expect(toolbar.role).toBe('toolbar')
  })

  it('has horizontal roving-tabindex', () => {
    expect(toolbar.focusStrategy).toEqual({
      type: 'roving-tabindex',
      orientation: 'horizontal',
    })
  })

  it('uses ArrowLeft/Right for navigation', () => {
    expect(toolbar.keyMap['ArrowRight']).toBeDefined()
    expect(toolbar.keyMap['ArrowLeft']).toBeDefined()
    expect(toolbar.keyMap['ArrowDown']).toBeUndefined()
  })

  it('Enter and Space activate', () => {
    expect(toolbar.keyMap['Enter']).toBeDefined()
    expect(toolbar.keyMap['Space']).toBeDefined()
  })

  it('ariaAttributes returns aria-pressed', () => {
    const attrs = toolbar.ariaAttributes(
      { id: 'btn' },
      { focused: true, selected: true, disabled: false, index: 0, siblingCount: 3 }
    )
    expect(attrs['aria-pressed']).toBe('true')
  })
})
