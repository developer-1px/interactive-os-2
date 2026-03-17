import { describe, it, expect, vi } from 'vitest'
import { createCommandEngine } from '../core/createCommandEngine'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import { focusCommands, expandCommands } from '../plugins/core'
import { crudCommands } from '../plugins/crud'
import { history } from '../plugins/history'
import { focusRecovery } from '../plugins/focus-recovery'

/**
 * Reproduce: tree에서 삭제 시 포커스 복구 안 됨
 *
 * tree behavior는 treegrid와 동일한 계층 구조를 사용하지만
 * PageTreeView는 core()만 로드. crud/focusRecovery가 빠져있으면
 * 삭제 자체가 안 되거나, 삭제 후 포커스가 죽은 노드를 가리킬 수 있음.
 */

function fixtureStore() {
  return createStore({
    entities: {
      docs: { id: 'docs', data: { name: 'docs', type: 'folder' } },
      intro: { id: 'intro', data: { name: 'intro.md', type: 'file' } },
      setup: { id: 'setup', data: { name: 'setup.md', type: 'file' } },
      api: { id: 'api', data: { name: 'api.md', type: 'file' } },
      license: { id: 'license', data: { name: 'LICENSE', type: 'file' } },
    },
    relationships: {
      [ROOT_ID]: ['docs', 'license'],
      docs: ['intro', 'setup', 'api'],
    },
  })
}

function getFocusedId(engine: ReturnType<typeof createCommandEngine>): string {
  return (engine.getStore().entities['__focus__']?.focusedId as string) ?? ''
}

describe('tree: focus recovery after delete', () => {
  // Scenario A: tree with crud + focusRecovery (what Collection would use)
  describe('with focusRecovery middleware', () => {
    function setup() {
      const historyPlugin = history()
      const recoveryPlugin = focusRecovery()
      const engine = createCommandEngine(
        fixtureStore(),
        [historyPlugin.middleware!, recoveryPlugin.middleware!],
        vi.fn()
      )
      engine.dispatch(expandCommands.expand('docs'))
      return { engine }
    }

    it('focuses next sibling after deleting focused node', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('intro'))
      engine.dispatch(crudCommands.remove('intro'))
      expect(getFocusedId(engine)).toBe('setup')
    })

    it('focuses previous sibling when deleting last child', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('api'))
      engine.dispatch(crudCommands.remove('api'))
      expect(getFocusedId(engine)).toBe('setup')
    })

    it('focuses parent when deleting only child', () => {
      const { engine } = setup()
      // Delete all children except one, then delete that one
      engine.dispatch(focusCommands.setFocus('intro'))
      engine.dispatch(crudCommands.remove('intro'))
      engine.dispatch(crudCommands.remove('setup'))
      engine.dispatch(focusCommands.setFocus('api'))
      engine.dispatch(crudCommands.remove('api'))
      expect(getFocusedId(engine)).toBe('docs')
    })
  })

  // Scenario B: tree with core() only (what PageTreeView currently uses)
  // This is likely the broken scenario — no focusRecovery, no crud
  describe('with core() only — no focusRecovery', () => {
    function setup() {
      const engine = createCommandEngine(
        fixtureStore(),
        [],
        vi.fn()
      )
      engine.dispatch(expandCommands.expand('docs'))
      return { engine }
    }

    it('without focusRecovery, focus remains stale after delete (expected)', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('intro'))
      engine.dispatch(crudCommands.remove('intro'))

      // Without focusRecovery middleware, focus points to deleted node — stale.
      // This is expected: focusRecovery is required for proper delete recovery.
      const focused = getFocusedId(engine)
      const store = engine.getStore()
      const focusedEntity = store.entities[focused]
      expect(focusedEntity).toBeUndefined()
    })
  })
})
