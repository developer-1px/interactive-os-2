import { describe, it, expect, vi } from 'vitest'
import { createCommandEngine } from '../core/command-engine'
import { createStore, getChildren } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import { dndCommands, dnd } from '../plugins/dnd'
import { history, historyCommands } from '../plugins/history'

function fixtureStore() {
  return createStore({
    entities: {
      folder1: { id: 'folder1', name: 'src' },
      folder2: { id: 'folder2', name: 'lib' },
      folder3: { id: 'folder3', name: 'test' },
      file1: { id: 'file1', name: 'App.tsx' },
      file2: { id: 'file2', name: 'main.tsx' },
      file3: { id: 'file3', name: 'index.ts' },
    },
    relationships: {
      [ROOT_ID]: ['folder1', 'folder2', 'folder3'],
      folder1: ['file1', 'file2'],
      folder2: ['file3'],
      folder3: [],
    },
  })
}

describe('dnd() plugin factory', () => {
  it('returns commands map', () => {
    const plugin = dnd()
    expect(plugin.commands!['moveUp']).toBe(dndCommands.moveUp)
    expect(plugin.commands!['moveDown']).toBe(dndCommands.moveDown)
    expect(plugin.commands!['moveOut']).toBe(dndCommands.moveOut)
    expect(plugin.commands!['moveIn']).toBe(dndCommands.moveIn)
    expect(plugin.commands!['moveTo']).toBe(dndCommands.moveTo)
  })
})

describe('dndCommands.moveUp', () => {
  it('swaps node with previous sibling', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(dndCommands.moveUp('folder2'))
    expect(getChildren(engine.getStore(), ROOT_ID)).toEqual(['folder2', 'folder1', 'folder3'])
  })

  it('no-op when already first', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(dndCommands.moveUp('folder1'))
    expect(getChildren(engine.getStore(), ROOT_ID)).toEqual(['folder1', 'folder2', 'folder3'])
  })

  it('undo restores original position', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    const cmd = dndCommands.moveUp('folder2')
    engine.dispatch(cmd)
    const undone = cmd.undo(engine.getStore())
    expect(getChildren(undone, ROOT_ID)).toEqual(['folder1', 'folder2', 'folder3'])
  })
})

describe('dndCommands.moveDown', () => {
  it('swaps node with next sibling', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(dndCommands.moveDown('folder1'))
    expect(getChildren(engine.getStore(), ROOT_ID)).toEqual(['folder2', 'folder1', 'folder3'])
  })

  it('no-op when already last', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(dndCommands.moveDown('folder3'))
    expect(getChildren(engine.getStore(), ROOT_ID)).toEqual(['folder1', 'folder2', 'folder3'])
  })
})

describe('dndCommands.moveOut', () => {
  it('moves node to parent level', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(dndCommands.moveOut('file1'))
    // file1 should move from folder1 to root, after folder1
    expect(getChildren(engine.getStore(), 'folder1')).toEqual(['file2'])
    expect(getChildren(engine.getStore(), ROOT_ID)).toEqual(['folder1', 'file1', 'folder2', 'folder3'])
  })

  it('no-op when already at root', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(dndCommands.moveOut('folder1'))
    expect(getChildren(engine.getStore(), ROOT_ID)).toEqual(['folder1', 'folder2', 'folder3'])
  })

  it('undo restores original position', () => {
    const historyPlugin = history()
    const engine = createCommandEngine(fixtureStore(), [historyPlugin.middleware!], vi.fn())
    engine.dispatch(dndCommands.moveOut('file1'))
    engine.dispatch(historyCommands.undo())
    expect(getChildren(engine.getStore(), 'folder1')).toEqual(['file1', 'file2'])
    expect(getChildren(engine.getStore(), ROOT_ID)).toEqual(['folder1', 'folder2', 'folder3'])
  })
})

describe('dndCommands.moveIn', () => {
  it('moves node into previous sibling as last child', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(dndCommands.moveIn('folder2'))
    // folder2 moves into folder1 as last child
    expect(getChildren(engine.getStore(), ROOT_ID)).toEqual(['folder1', 'folder3'])
    expect(getChildren(engine.getStore(), 'folder1')).toEqual(['file1', 'file2', 'folder2'])
  })

  it('no-op when first sibling (no previous)', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(dndCommands.moveIn('folder1'))
    expect(getChildren(engine.getStore(), ROOT_ID)).toEqual(['folder1', 'folder2', 'folder3'])
  })
})

describe('dndCommands.moveTo', () => {
  it('moves node to specific parent and index', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(dndCommands.moveTo('file1', 'folder2', 0))
    expect(getChildren(engine.getStore(), 'folder1')).toEqual(['file2'])
    expect(getChildren(engine.getStore(), 'folder2')).toEqual(['file1', 'file3'])
  })

  it('undo restores original position', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    const cmd = dndCommands.moveTo('file1', 'folder2', 0)
    engine.dispatch(cmd)
    const undone = cmd.undo(engine.getStore())
    expect(getChildren(undone, 'folder1')).toEqual(['file1', 'file2'])
    expect(getChildren(undone, 'folder2')).toEqual(['file3'])
  })
})
