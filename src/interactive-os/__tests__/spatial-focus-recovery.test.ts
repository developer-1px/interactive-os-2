// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCommandEngine } from '../core/createCommandEngine'
import { createStore, getChildren, getEntity } from '../core/createStore'
import { ROOT_ID, createBatchCommand } from '../core/types'
import { focusCommands } from '../plugins/core'
import { crudCommands } from '../plugins/crud'
import { clipboardCommands, resetClipboard } from '../plugins/clipboard'
import { history, historyCommands } from '../plugins/history'
import {
  focusRecovery,
  isVisible,
  findFallbackFocus,
  detectNewVisibleEntities,
  spatialReachable,
} from '../plugins/focusRecovery'

function fixtureStore() {
  return createStore({
    entities: {
      section1: { id: 'section1', data: { name: 'Hero', type: 'section' } },
      card1: { id: 'card1', data: { name: 'Card 1', type: 'card' } },
      card2: { id: 'card2', data: { name: 'Card 2', type: 'card' } },
      section2: { id: 'section2', data: { name: 'Features', type: 'section' } },
      card3: { id: 'card3', data: { name: 'Card 3', type: 'card' } },
    },
    relationships: {
      [ROOT_ID]: ['section1', 'section2'],
      section1: ['card1', 'card2'],
      section2: ['card3'],
    },
  })
}

function getFocusedId(engine: ReturnType<typeof createCommandEngine>): string {
  return (engine.getStore().entities['__focus__']?.focusedId as string) ?? ''
}

// ── Unit tests: isVisible / findFallbackFocus / detectNewVisibleEntities with isReachable ──

describe('isVisible with custom isReachable', () => {
  it('returns true for child of unexpanded parent when isReachable = () => true', () => {
    const store = fixtureStore()
    // No expand — in tree model this would be false
    // With spatial isReachable, it should be true
    expect(isVisible(store, 'card1', spatialReachable)).toBe(true)
  })

  it('returns false for non-existent node regardless of isReachable', () => {
    const store = fixtureStore()
    expect(isVisible(store, 'nonexistent', spatialReachable)).toBe(false)
  })

  it('uses default tree logic when isReachable is not provided', () => {
    const store = fixtureStore()
    // No expand → child not visible in tree model
    expect(isVisible(store, 'card1')).toBe(false)
  })
})

describe('findFallbackFocus with custom isReachable', () => {
  it('finds next sibling in spatial model (no expand needed)', () => {
    const storeBefore = fixtureStore()
    // Remove card1 from store
    const storeAfter = crudCommands.remove('card1').execute(storeBefore)

    const fallback = findFallbackFocus(storeBefore, storeAfter, 'card1', spatialReachable)
    expect(fallback).toBe('card2')
  })

  it('finds previous sibling when last child deleted in spatial model', () => {
    const storeBefore = fixtureStore()
    const storeAfter = crudCommands.remove('card2').execute(storeBefore)

    const fallback = findFallbackFocus(storeBefore, storeAfter, 'card2', spatialReachable)
    expect(fallback).toBe('card1')
  })

  it('finds parent when only child deleted in spatial model', () => {
    const storeBefore = fixtureStore()
    const storeAfter = crudCommands.remove('card3').execute(storeBefore)

    const fallback = findFallbackFocus(storeBefore, storeAfter, 'card3', spatialReachable)
    expect(fallback).toBe('section2')
  })
})

describe('detectNewVisibleEntities with custom isReachable', () => {
  it('detects newly created node in spatial model (no expand needed)', () => {
    const storeBefore = fixtureStore()
    const storeAfter = crudCommands
      .create({ id: 'card4', data: { name: 'Card 4', type: 'card' } }, 'section1')
      .execute(storeBefore)

    const newEntities = detectNewVisibleEntities(storeBefore, storeAfter, spatialReachable)
    expect(newEntities).toContain('card4')
  })
})

// ── Integration: focusRecovery plugin with isReachable option ──

describe('focusRecovery plugin with isReachable (spatial model)', () => {
  beforeEach(() => {
    resetClipboard()
  })

  function setup() {
    const historyPlugin = history()
    const recoveryPlugin = focusRecovery({ isReachable: spatialReachable })
    const engine = createCommandEngine(
      fixtureStore(),
      [historyPlugin.middleware!, recoveryPlugin.middleware!],
      vi.fn()
    )
    // No expand needed — spatial model
    return { engine }
  }

  describe('delete', () => {
    it('focuses next sibling after deleting focused node', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('card1'))
      engine.dispatch(crudCommands.remove('card1'))
      expect(getFocusedId(engine)).toBe('card2')
    })

    it('focuses previous sibling when deleting last child', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('card2'))
      engine.dispatch(crudCommands.remove('card2'))
      expect(getFocusedId(engine)).toBe('card1')
    })

    it('focuses parent when deleting only child', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('card3'))
      engine.dispatch(crudCommands.remove('card3'))
      expect(getFocusedId(engine)).toBe('section2')
    })
  })

  describe('paste', () => {
    it('focuses pasted node after copy+paste', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('card1'))
      engine.dispatch(clipboardCommands.copy(['card1']))
      engine.dispatch(clipboardCommands.paste('section2'))

      const focused = getFocusedId(engine)
      const section2Children = getChildren(engine.getStore(), 'section2')
      expect(section2Children).toContain(focused)
      expect(focused).not.toBe('card1')
    })

    it('focuses duplicated node after copy+paste batch (Cmd+D)', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('card1'))
      engine.dispatch(createBatchCommand([
        clipboardCommands.copy(['card1']),
        clipboardCommands.paste('card1'),
      ]))

      const focused = getFocusedId(engine)
      const section1Children = getChildren(engine.getStore(), 'section1')
      expect(section1Children).toContain(focused)
      expect(focused).not.toBe('card1')
      expect(focused).not.toBe('card2')
    })
  })

  describe('undo/redo', () => {
    it('undo delete focuses restored node', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('card1'))
      engine.dispatch(crudCommands.remove('card1'))
      expect(getFocusedId(engine)).toBe('card2')

      engine.dispatch(historyCommands.undo())
      expect(getEntity(engine.getStore(), 'card1')).toBeDefined()
      expect(getFocusedId(engine)).toBe('card1')
    })

    it('redo delete recovers focus', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('card1'))
      engine.dispatch(crudCommands.remove('card1'))
      engine.dispatch(historyCommands.undo())
      expect(getFocusedId(engine)).toBe('card1')

      engine.dispatch(historyCommands.redo())
      expect(getFocusedId(engine)).toBe('card2')
    })
  })
})
