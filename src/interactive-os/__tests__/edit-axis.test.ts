import { describe, it, expect } from 'vitest'
import { edit, replaceEditPlugin } from '../pattern/edit'
import { extractKeyMap } from '../axis/types'

describe('edit axis', () => {
  it('returns F2, Enter, Delete, Alt+Arrow keyMap by default', () => {
    const axis = edit()
    const km = extractKeyMap(axis)
    expect(km).toHaveProperty('F2')
    expect(km).toHaveProperty('Enter')
    expect(km).toHaveProperty('Delete')
    expect(km).toHaveProperty('Alt+ArrowUp')
    expect(km).toHaveProperty('Alt+ArrowDown')
    expect(km).not.toHaveProperty('Alt+ArrowLeft')
  })

  it('includes tree movement keys when tree option is true', () => {
    const axis = edit({ tree: true })
    const km = extractKeyMap(axis)
    expect(km).toHaveProperty('Alt+ArrowLeft')
    expect(km).toHaveProperty('Alt+ArrowRight')
  })

  it('replaceEditPlugin returns plugin with onUnhandledKey', () => {
    const plugin = replaceEditPlugin()
    expect(plugin.onUnhandledKey).toBeDefined()
  })
})
