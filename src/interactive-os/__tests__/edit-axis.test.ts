import { describe, it, expect } from 'vitest'
import { edit, replaceEditPlugin } from '../plugins/edit'

describe('edit plugin', () => {
  it('returns F2, Enter, Delete, Alt+Arrow keyMap by default', () => {
    const plugin = edit()
    const km = plugin.keyMap!
    expect(km).toHaveProperty('F2')
    expect(km).toHaveProperty('Enter')
    expect(km).toHaveProperty('Delete')
    expect(km).toHaveProperty('Alt+ArrowUp')
    expect(km).toHaveProperty('Alt+ArrowDown')
    expect(km).not.toHaveProperty('Alt+ArrowLeft')
  })

  it('includes tree movement keys when tree option is true', () => {
    const plugin = edit({ tree: true })
    const km = plugin.keyMap!
    expect(km).toHaveProperty('Alt+ArrowLeft')
    expect(km).toHaveProperty('Alt+ArrowRight')
  })

  it('replaceEditPlugin returns plugin with onUnhandledKey', () => {
    const plugin = replaceEditPlugin()
    expect(plugin.onUnhandledKey).toBeDefined()
  })
})
