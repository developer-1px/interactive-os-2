import { describe, it, expect, vi } from 'vitest'
import { createCommandEngine } from '../core/command-engine'
import { createStore } from '../core/normalized-store'
import { core, focusCommands, selectionCommands, expandCommands } from '../plugins/core'
import { ROOT_ID } from '../core/types'

function fixtureStore() {
  return createStore({
    entities: {
      folder1: { id: 'folder1', name: 'src' },
      file1: { id: 'file1', name: 'App.tsx' },
      file2: { id: 'file2', name: 'main.tsx' },
    },
    relationships: {
      [ROOT_ID]: ['folder1'],
      folder1: ['file1', 'file2'],
    },
  })
}

describe('core() plugin factory', () => {
  it('returns commands map with all expected keys', () => {
    const plugin = core()
    expect(plugin.commands).toBeDefined()
    expect(plugin.commands!['focus']).toBe(focusCommands.setFocus)
    expect(plugin.commands!['select']).toBe(selectionCommands.select)
    expect(plugin.commands!['toggleSelect']).toBe(selectionCommands.toggleSelect)
    expect(plugin.commands!['clearSelection']).toBe(selectionCommands.clearSelection)
    expect(plugin.commands!['expand']).toBe(expandCommands.expand)
    expect(plugin.commands!['collapse']).toBe(expandCommands.collapse)
    expect(plugin.commands!['toggleExpand']).toBe(expandCommands.toggleExpand)
  })
})

describe('core plugin — focus commands', () => {
  it('sets focused node', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(focusCommands.setFocus('file1'))
    expect(engine.getStore().entities['__focus__']).toEqual({
      id: '__focus__',
      focusedId: 'file1',
    })
  })

  it('changes focus', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(focusCommands.setFocus('file1'))
    engine.dispatch(focusCommands.setFocus('file2'))
    expect(engine.getStore().entities['__focus__']?.focusedId).toBe('file2')
  })

  it('undo restores previous focus (not deletes)', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(focusCommands.setFocus('file1'))
    const cmd = focusCommands.setFocus('file2')
    engine.dispatch(cmd)
    expect(engine.getStore().entities['__focus__']?.focusedId).toBe('file2')
    const undone = cmd.undo(engine.getStore())
    expect(undone.entities['__focus__']?.focusedId).toBe('file1')
  })
})

describe('core plugin — selection commands', () => {
  it('selects a node', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(selectionCommands.select('file1'))
    expect(engine.getStore().entities['__selection__']).toEqual({
      id: '__selection__',
      selectedIds: ['file1'],
    })
  })

  it('undo restores previous selection', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(selectionCommands.select('file1'))
    const cmd = selectionCommands.select('file2')
    engine.dispatch(cmd)
    const undone = cmd.undo(engine.getStore())
    expect(undone.entities['__selection__']?.selectedIds).toEqual(['file1'])
  })

  it('toggles selection', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(selectionCommands.select('file1'))
    engine.dispatch(selectionCommands.toggleSelect('file2'))
    expect(engine.getStore().entities['__selection__']?.selectedIds).toEqual(['file1', 'file2'])
  })

  it('deselects on toggle', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(selectionCommands.select('file1'))
    engine.dispatch(selectionCommands.toggleSelect('file1'))
    expect(engine.getStore().entities['__selection__']?.selectedIds).toEqual([])
  })

  it('clears selection', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(selectionCommands.select('file1'))
    engine.dispatch(selectionCommands.clearSelection())
    expect(engine.getStore().entities['__selection__']?.selectedIds).toEqual([])
  })

  it('clearSelection undo restores previous selection', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(selectionCommands.select('file1'))
    engine.dispatch(selectionCommands.toggleSelect('file2'))
    const cmd = selectionCommands.clearSelection()
    engine.dispatch(cmd)
    expect(engine.getStore().entities['__selection__']?.selectedIds).toEqual([])
    const undone = cmd.undo(engine.getStore())
    expect(undone.entities['__selection__']?.selectedIds).toEqual(['file1', 'file2'])
  })
})

describe('core plugin — expand/collapse commands', () => {
  it('expands a node', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(expandCommands.expand('folder1'))
    const expandState = engine.getStore().entities['__expanded__']
    expect((expandState?.expandedIds as string[])?.includes('folder1')).toBe(true)
  })

  it('collapses a node', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(expandCommands.expand('folder1'))
    engine.dispatch(expandCommands.collapse('folder1'))
    const expandState = engine.getStore().entities['__expanded__']
    expect((expandState?.expandedIds as string[])?.includes('folder1')).toBe(false)
  })

  it('toggles expand state', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(expandCommands.toggleExpand('folder1'))
    expect((engine.getStore().entities['__expanded__']?.expandedIds as string[])?.includes('folder1')).toBe(true)
    engine.dispatch(expandCommands.toggleExpand('folder1'))
    expect((engine.getStore().entities['__expanded__']?.expandedIds as string[])?.includes('folder1')).toBe(false)
  })
})
