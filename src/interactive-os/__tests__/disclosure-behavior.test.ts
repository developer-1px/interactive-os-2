import { describe, it, expect } from 'vitest'
import { disclosure } from '../behaviors/disclosure'

describe('disclosure behavior preset', () => {
  it('has role button', () => {
    expect(disclosure.role).toBe('button')
  })

  it('Enter and Space both activate', () => {
    expect(disclosure.keyMap['Enter']).toBeDefined()
    expect(disclosure.keyMap['Space']).toBeDefined()
  })

  it('has no arrow key navigation', () => {
    expect(disclosure.keyMap['ArrowDown']).toBeUndefined()
    expect(disclosure.keyMap['ArrowUp']).toBeUndefined()
  })

  it('ariaAttributes returns aria-expanded when present', () => {
    const attrs = disclosure.ariaAttributes(
      { id: 'test' },
      { focused: false, selected: false, disabled: false, index: 0, siblingCount: 1, expanded: true }
    )
    expect(attrs['aria-expanded']).toBe('true')
  })

  it('ariaAttributes omits aria-expanded when not present', () => {
    const attrs = disclosure.ariaAttributes(
      { id: 'test' },
      { focused: false, selected: false, disabled: false, index: 0, siblingCount: 1 }
    )
    expect(attrs['aria-expanded']).toBeUndefined()
  })
})
