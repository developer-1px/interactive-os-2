import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCommandEngine } from '../core/command-engine'
import { createStore, getEntity, getChildren } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import { clipboardCommands, clipboard, resetClipboard } from '../plugins/clipboard'

beforeEach(() => {
  resetClipboard()
})

function fixtureStore() {
  return createStore({
    entities: {
      folder1: { id: 'folder1', name: 'src' },
      file1: { id: 'file1', name: 'App.tsx' },
      file2: { id: 'file2', name: 'main.tsx' },
      folder2: { id: 'folder2', name: 'lib' },
    },
    relationships: {
      [ROOT_ID]: ['folder1', 'folder2'],
      folder1: ['file1', 'file2'],
      folder2: [],
    },
  })
}

describe('clipboard() plugin factory', () => {
  it('returns commands map', () => {
    const plugin = clipboard()
    expect(plugin.commands!['copy']).toBe(clipboardCommands.copy)
    expect(plugin.commands!['paste']).toBe(clipboardCommands.paste)
    expect(plugin.commands!['cut']).toBe(clipboardCommands.cut)
  })
})

describe('clipboardCommands.copy + paste', () => {
  it('copies nodes and pastes into target', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())

    // Copy file1
    engine.dispatch(clipboardCommands.copy(['file1']))

    // Paste into folder2
    engine.dispatch(clipboardCommands.paste('folder2'))

    // file1 should still exist in folder1 (copy, not move)
    expect(getChildren(engine.getStore(), 'folder1')).toEqual(['file1', 'file2'])

    // A clone should exist in folder2
    const folder2Children = getChildren(engine.getStore(), 'folder2')
    expect(folder2Children).toHaveLength(1)

    // The cloned entity should have a new ID but same data
    const cloneId = folder2Children[0]!
    const clone = getEntity(engine.getStore(), cloneId)
    expect(clone?.name).toBe('App.tsx')
    expect(cloneId).not.toBe('file1') // new ID
  })

  it('paste without prior copy is a no-op', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(clipboardCommands.paste('folder2'))
    // Store should be unchanged (paste creates a no-op command when clipboard is empty)
    expect(getChildren(engine.getStore(), 'folder2')).toEqual([])
  })

  it('undo paste removes pasted nodes', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())

    engine.dispatch(clipboardCommands.copy(['file1']))
    const cmd = clipboardCommands.paste('folder2')
    engine.dispatch(cmd)

    const undone = cmd.undo(engine.getStore())
    expect(getChildren(undone, 'folder2')).toEqual([])
  })
})

describe('clipboardCommands.cut + paste', () => {
  it('moves nodes from source to target', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())

    engine.dispatch(clipboardCommands.cut(['file1']))
    engine.dispatch(clipboardCommands.paste('folder2'))

    // file1 should be removed from folder1
    expect(getChildren(engine.getStore(), 'folder1')).toEqual(['file2'])

    // file1 should now be in folder2 (same ID, not cloned)
    expect(getChildren(engine.getStore(), 'folder2')).toEqual(['file1'])
    expect(getEntity(engine.getStore(), 'file1')?.name).toBe('App.tsx')
  })
})

describe('clipboardCommands.copy multiple', () => {
  it('copies multiple nodes', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())

    engine.dispatch(clipboardCommands.copy(['file1', 'file2']))
    engine.dispatch(clipboardCommands.paste('folder2'))

    const folder2Children = getChildren(engine.getStore(), 'folder2')
    expect(folder2Children).toHaveLength(2)
  })
})

describe('paste into leaf node', () => {
  it('pastes into parent when target is a leaf (no relationship entry)', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())

    engine.dispatch(clipboardCommands.copy(['file2']))
    // Paste targeting file1 (leaf) — should go into folder1 (file1's parent)
    engine.dispatch(clipboardCommands.paste('file1'))

    // file1 has no relationship entry, so paste goes to folder1
    expect(getChildren(engine.getStore(), 'folder1').length).toBe(3) // file1, file2, clone
  })

  it('pastes into folder when target is a container (has relationship entry)', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())

    engine.dispatch(clipboardCommands.copy(['file1']))
    engine.dispatch(clipboardCommands.paste('folder2'))

    expect(getChildren(engine.getStore(), 'folder2').length).toBe(1)
  })
})
