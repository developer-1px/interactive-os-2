import { describe, it, expect, vi } from 'vitest'
import { createBehaviorContext } from '../behaviors/create-behavior-context'
import { createStore } from '../core/normalized-store'
import { createCommandEngine } from '../core/command-engine'
import { ROOT_ID } from '../core/types'
import { focusCommands, expandCommands } from '../plugins/core'

function setup() {
  const store = createStore({
    entities: {
      folder1: { id: 'folder1', data: { name: 'src' } },
      file1: { id: 'file1', data: { name: 'App.tsx' } },
      file2: { id: 'file2', data: { name: 'main.tsx' } },
      folder2: { id: 'folder2', data: { name: 'lib' } },
    },
    relationships: {
      [ROOT_ID]: ['folder1', 'folder2'],
      folder1: ['file1', 'file2'],
      folder2: [],
    },
  })

  const engine = createCommandEngine(store, [], vi.fn())
  engine.dispatch(focusCommands.setFocus('file1'))
  engine.dispatch(expandCommands.expand('folder1'))
  return { engine }
}

describe('createBehaviorContext', () => {
  it('returns current focused and selected state', () => {
    const { engine } = setup()
    const ctx = createBehaviorContext(engine)
    expect(ctx.focused).toBe('file1')
    expect(ctx.selected).toEqual([])
    expect(ctx.isExpanded).toBe(false)
  })

  it('getEntity returns entity from store', () => {
    const { engine } = setup()
    const ctx = createBehaviorContext(engine)
    expect(ctx.getEntity('folder1')).toEqual({ id: 'folder1', data: { name: 'src' } })
    expect(ctx.getEntity('nonexistent')).toBeUndefined()
  })

  it('getChildren returns children from relationships', () => {
    const { engine } = setup()
    const ctx = createBehaviorContext(engine)
    expect(ctx.getChildren('folder1')).toEqual(['file1', 'file2'])
    expect(ctx.getChildren('file1')).toEqual([])
  })

  it('dispatch forwards to engine', () => {
    const { engine } = setup()
    const dispatchSpy = vi.spyOn(engine, 'dispatch')
    const ctx = createBehaviorContext(engine)
    const cmd = focusCommands.setFocus('file2')
    ctx.dispatch(cmd)
    expect(dispatchSpy).toHaveBeenCalledWith(cmd)
  })

  it('focusNext returns command to move focus to next visible node', () => {
    const { engine } = setup()
    const ctx = createBehaviorContext(engine)
    const cmd = ctx.focusNext()
    const newStore = cmd.execute(engine.getStore())
    expect(newStore.entities['__focus__']?.focusedId).toBe('file2')
  })

  it('focusPrev returns command to move focus to previous visible node', () => {
    const { engine } = setup()
    engine.dispatch(focusCommands.setFocus('file2'))
    const ctx = createBehaviorContext(engine)
    const cmd = ctx.focusPrev()
    const newStore = cmd.execute(engine.getStore())
    expect(newStore.entities['__focus__']?.focusedId).toBe('file1')
  })

  it('focusFirst returns command to focus first visible node', () => {
    const { engine } = setup()
    engine.dispatch(focusCommands.setFocus('file2'))
    const ctx = createBehaviorContext(engine)
    const cmd = ctx.focusFirst()
    const newStore = cmd.execute(engine.getStore())
    expect(newStore.entities['__focus__']?.focusedId).toBe('folder1')
  })

  it('focusLast returns command to focus last visible node', () => {
    const { engine } = setup()
    const ctx = createBehaviorContext(engine)
    const cmd = ctx.focusLast()
    const newStore = cmd.execute(engine.getStore())
    expect(newStore.entities['__focus__']?.focusedId).toBe('folder2')
  })

  it('focusParent returns command to focus parent node', () => {
    const { engine } = setup()
    const ctx = createBehaviorContext(engine)
    const cmd = ctx.focusParent()
    const newStore = cmd.execute(engine.getStore())
    expect(newStore.entities['__focus__']?.focusedId).toBe('folder1')
  })

  it('focusChild returns command to focus first child', () => {
    const { engine } = setup()
    engine.dispatch(focusCommands.setFocus('folder1'))
    const ctx = createBehaviorContext(engine)
    const cmd = ctx.focusChild()
    const newStore = cmd.execute(engine.getStore())
    expect(newStore.entities['__focus__']?.focusedId).toBe('file1')
  })

  it('expand returns expand command for focused node', () => {
    const { engine } = setup()
    engine.dispatch(focusCommands.setFocus('folder2'))
    const ctx = createBehaviorContext(engine)
    const cmd = ctx.expand()
    const newStore = cmd.execute(engine.getStore())
    expect((newStore.entities['__expanded__']?.expandedIds as string[])?.includes('folder2')).toBe(true)
  })

  it('toggleSelect returns select toggle for focused node', () => {
    const { engine } = setup()
    const ctx = createBehaviorContext(engine)
    const cmd = ctx.toggleSelect()
    const newStore = cmd.execute(engine.getStore())
    expect((newStore.entities['__selection__']?.selectedIds as string[])?.includes('file1')).toBe(true)
  })
})
