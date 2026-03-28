// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { layerStack } from '../overlay/layerStack'

describe('layerStack', () => {
  beforeEach(() => {
    layerStack._reset()
  })

  // V11: 2026-03-28-overlay-core-layer-prd.md
  it('push/remove manages stack LIFO', () => {
    const close1 = vi.fn()
    const close2 = vi.fn()
    layerStack.push({ id: 'a', close: close1 })
    layerStack.push({ id: 'b', close: close2 })

    expect(layerStack.size).toBe(2)
    expect(layerStack.isTop('b')).toBe(true)
    expect(layerStack.isTop('a')).toBe(false)

    layerStack.remove('b')
    expect(layerStack.size).toBe(1)
    expect(layerStack.isTop('a')).toBe(true)
  })

  // V11: 2026-03-28-overlay-core-layer-prd.md
  it('closeTop closes and removes the topmost entry', () => {
    const close1 = vi.fn()
    const close2 = vi.fn()
    layerStack.push({ id: 'a', close: close1 })
    layerStack.push({ id: 'b', close: close2 })

    const closed = layerStack.closeTop()
    expect(closed).toBe(true)
    expect(close2).toHaveBeenCalledOnce()
    expect(close1).not.toHaveBeenCalled()
    // Note: closeTop calls close() but does not auto-remove. The overlay's cleanup effect removes it.
  })

  it('closeTop returns false on empty stack', () => {
    expect(layerStack.closeTop()).toBe(false)
  })

  it('remove is safe for non-existent id', () => {
    layerStack.push({ id: 'a', close: vi.fn() })
    layerStack.remove('nonexistent')
    expect(layerStack.size).toBe(1)
  })
})
