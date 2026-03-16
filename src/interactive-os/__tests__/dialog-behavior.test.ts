import { describe, it, expect } from 'vitest'
import { dialog } from '../behaviors/dialog'

describe('dialog behavior preset', () => {
  it('has role dialog', () => {
    expect(dialog.role).toBe('dialog')
  })

  it('Escape closes dialog', () => {
    expect(dialog.keyMap['Escape']).toBeDefined()
  })

  it('Tab traps focus', () => {
    expect(dialog.keyMap['Tab']).toBeDefined()
  })

  it('has vertical roving-tabindex', () => {
    expect(dialog.focusStrategy).toEqual({
      type: 'roving-tabindex',
      orientation: 'vertical',
    })
  })
})
