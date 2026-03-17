/**
 * Test: paste inserts after focused node (sibling position), not at end.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createCommandEngine } from '../core/createCommandEngine'
import { createStore, getChildren } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import { focusCommands } from '../plugins/core'
import { clipboardCommands, resetClipboard } from '../plugins/clipboard'

function fixtureStore() {
  return createStore({
    entities: {
      a: { id: 'a', data: { label: 'A' } },
      b: { id: 'b', data: { label: 'B' } },
      c: { id: 'c', data: { label: 'C' } },
      d: { id: 'd', data: { label: 'D' } },
    },
    relationships: {
      [ROOT_ID]: ['a', 'b', 'c', 'd'],
    },
  })
}

describe('paste position', () => {
  beforeEach(() => {
    resetClipboard()
  })

  it('copy-paste inserts after focused node, not at end', () => {
    const engine = createCommandEngine(fixtureStore(), [], () => {})

    // Copy 'a'
    engine.dispatch(clipboardCommands.copy(['a']))

    // Focus on 'b', paste → should insert after 'b' (position 2), not at end
    engine.dispatch(focusCommands.setFocus('b'))
    engine.dispatch(clipboardCommands.paste('b'))

    const children = getChildren(engine.getStore(), ROOT_ID)
    // Expected: a, b, a-copy, c, d
    expect(children[0]).toBe('a')
    expect(children[1]).toBe('b')
    expect(children[2]).toContain('a') // a-copy-N
    expect(children[3]).toBe('c')
    expect(children[4]).toBe('d')
    expect(children.length).toBe(5)
  })

  it('copy-paste at last item appends after it', () => {
    const engine = createCommandEngine(fixtureStore(), [], () => {})

    engine.dispatch(clipboardCommands.copy(['a']))
    engine.dispatch(focusCommands.setFocus('d'))
    engine.dispatch(clipboardCommands.paste('d'))

    const children = getChildren(engine.getStore(), ROOT_ID)
    // Expected: a, b, c, d, a-copy
    expect(children[3]).toBe('d')
    expect(children[4]).toContain('a')
    expect(children.length).toBe(5)
  })

  it('cut-paste moves to after focused node', () => {
    const engine = createCommandEngine(fixtureStore(), [], () => {})

    // Cut 'd'
    engine.dispatch(clipboardCommands.cut(['d']))

    // Focus on 'a', paste → d should go after a
    engine.dispatch(focusCommands.setFocus('a'))
    engine.dispatch(clipboardCommands.paste('a'))

    const children = getChildren(engine.getStore(), ROOT_ID)
    // Expected: a, d, b, c
    expect(children).toEqual(['a', 'd', 'b', 'c'])
  })
})
