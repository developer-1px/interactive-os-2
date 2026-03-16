import { describe, it, expect } from 'vitest'
import { createStore } from '../core/normalized-store'
import { createCommandEngine } from '../core/command-engine'
import { ROOT_ID } from '../core/types'
import { focusCommands } from '../plugins/core'
import { createBehaviorContext } from '../behaviors/create-behavior-context'

function fixtureStore() {
  return createStore({
    entities: {
      a: { id: 'a', data: { name: 'A' } },
      b: { id: 'b', data: { name: 'B' } },
      c: { id: 'c', data: { name: 'C' } },
    },
    relationships: { [ROOT_ID]: ['a', 'b', 'c'] },
  })
}

describe('selection model', () => {
  describe('single mode', () => {
    it('toggleSelect in single mode replaces previous selection', () => {
      const engine = createCommandEngine(fixtureStore(), [], () => {})
      engine.dispatch(focusCommands.setFocus('a'))
      const ctx1 = createBehaviorContext(engine, { selectionMode: 'single' })
      engine.dispatch(ctx1.toggleSelect())

      engine.dispatch(focusCommands.setFocus('b'))
      const ctx2 = createBehaviorContext(engine, { selectionMode: 'single' })
      engine.dispatch(ctx2.toggleSelect())

      const ids = engine.getStore().entities['__selection__']?.selectedIds as string[]
      expect(ids).toEqual(['b'])
    })
  })

  describe('multiple mode (default)', () => {
    it('toggleSelect adds/removes independently', () => {
      const engine = createCommandEngine(fixtureStore(), [], () => {})
      engine.dispatch(focusCommands.setFocus('a'))
      const ctx1 = createBehaviorContext(engine)
      engine.dispatch(ctx1.toggleSelect())

      engine.dispatch(focusCommands.setFocus('b'))
      const ctx2 = createBehaviorContext(engine)
      engine.dispatch(ctx2.toggleSelect())

      const ids = engine.getStore().entities['__selection__']?.selectedIds as string[]
      expect(ids).toEqual(['a', 'b'])
    })
  })
})
