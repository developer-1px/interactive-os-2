import { describe, it, expect, vi } from 'vitest'
import { createCommandEngine } from '../core/command-engine'
import { createStore, getChildren, getEntity } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import { focusCommands, expandCommands } from '../plugins/core'
import { crudCommands } from '../plugins/crud'
import { clipboardCommands, resetClipboard } from '../plugins/clipboard'
import { dndCommands } from '../plugins/dnd'
import { history, historyCommands } from '../plugins/history'
import { focusRecovery } from '../plugins/focus-recovery'

function fixtureStore() {
  return createStore({
    entities: {
      folder1: { id: 'folder1', data: { name: 'src' } },
      file1: { id: 'file1', data: { name: 'App.tsx' } },
      file2: { id: 'file2', data: { name: 'main.tsx' } },
      file3: { id: 'file3', data: { name: 'index.ts' } },
      folder2: { id: 'folder2', data: { name: 'lib' } },
      file4: { id: 'file4', data: { name: 'utils.ts' } },
    },
    relationships: {
      [ROOT_ID]: ['folder1', 'folder2'],
      folder1: ['file1', 'file2', 'file3'],
      folder2: ['file4'],
    },
  })
}

function getFocusedId(engine: ReturnType<typeof createCommandEngine>): string {
  return (engine.getStore().entities['__focus__']?.focusedId as string) ?? ''
}

describe('focusRecovery middleware', () => {
  beforeEach(() => {
    resetClipboard()
  })

  function setup() {
    const historyPlugin = history()
    const recoveryPlugin = focusRecovery()
    const engine = createCommandEngine(
      fixtureStore(),
      [historyPlugin.middleware!, recoveryPlugin.middleware!],
      vi.fn()
    )
    // Expand folders so children are visible
    engine.dispatch(expandCommands.expand('folder1'))
    engine.dispatch(expandCommands.expand('folder2'))
    return { engine }
  }

  // --- Delete scenarios ---

  describe('delete', () => {
    it('focuses next sibling after deleting focused node', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('file1'))
      engine.dispatch(crudCommands.remove('file1'))

      expect(getFocusedId(engine)).toBe('file2')
    })

    it('focuses previous sibling when deleting last sibling', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('file3'))
      engine.dispatch(crudCommands.remove('file3'))

      expect(getFocusedId(engine)).toBe('file2')
    })

    it('focuses parent when deleting only child', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('file4'))
      engine.dispatch(crudCommands.remove('file4'))

      expect(getFocusedId(engine)).toBe('folder2')
    })

    it('focuses next sibling when deleting middle node', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('file2'))
      engine.dispatch(crudCommands.remove('file2'))

      expect(getFocusedId(engine)).toBe('file3')
    })

    it('focus does not change when deleting non-focused node', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('file1'))
      engine.dispatch(crudCommands.remove('file3'))

      expect(getFocusedId(engine)).toBe('file1')
    })
  })

  // --- Collapse scenarios ---

  describe('collapse', () => {
    it('focuses parent when focused child becomes hidden', () => {
      const { engine } = setup()
      engine.dispatch(expandCommands.expand('folder1'))
      engine.dispatch(focusCommands.setFocus('file2'))
      engine.dispatch(expandCommands.collapse('folder1'))

      expect(getFocusedId(engine)).toBe('folder1')
    })

    it('focus does not change when collapsing unrelated node', () => {
      const { engine } = setup()
      engine.dispatch(expandCommands.expand('folder1'))
      engine.dispatch(expandCommands.expand('folder2'))
      engine.dispatch(focusCommands.setFocus('file4'))
      engine.dispatch(expandCommands.collapse('folder1'))

      expect(getFocusedId(engine)).toBe('file4')
    })

    it('focus does not change when focused node is the collapsed node itself', () => {
      const { engine } = setup()
      engine.dispatch(expandCommands.expand('folder1'))
      engine.dispatch(focusCommands.setFocus('folder1'))
      engine.dispatch(expandCommands.collapse('folder1'))

      expect(getFocusedId(engine)).toBe('folder1')
    })
  })

  // --- Create scenarios ---

  describe('create', () => {
    it('focuses newly created node', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('folder1'))
      engine.dispatch(crudCommands.create({ id: 'newfile', data: { name: 'new.ts' } }, 'folder1'))

      expect(getFocusedId(engine)).toBe('newfile')
    })
  })

  // --- Paste scenarios ---

  describe('paste', () => {
    it('focuses pasted node after copy+paste', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('file1'))
      engine.dispatch(clipboardCommands.copy(['file1']))
      engine.dispatch(clipboardCommands.paste('folder2'))

      // Focus should be on the pasted clone (not file1)
      const focused = getFocusedId(engine)
      const folder2Children = getChildren(engine.getStore(), 'folder2')
      expect(folder2Children).toContain(focused)
      expect(focused).not.toBe('file1') // clone has new ID
    })

    it('focuses pasted node after cut+paste', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('file1'))
      engine.dispatch(clipboardCommands.cut(['file1']))
      engine.dispatch(clipboardCommands.paste('folder2'))

      expect(getFocusedId(engine)).toBe('file1')
      expect(getChildren(engine.getStore(), 'folder2')).toContain('file1')
    })
  })

  // --- DnD scenarios ---

  describe('dnd (move)', () => {
    it('focus follows moved node', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('file1'))
      engine.dispatch(dndCommands.moveDown('file1'))

      expect(getFocusedId(engine)).toBe('file1')
    })

    it('focus follows node moved to different parent', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('file1'))
      engine.dispatch(dndCommands.moveTo('file1', 'folder2'))

      expect(getFocusedId(engine)).toBe('file1')
    })
  })

  // --- Undo/Redo scenarios ---

  describe('undo/redo', () => {
    it('undo delete focuses restored node', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('file2'))
      engine.dispatch(crudCommands.remove('file2'))
      expect(getFocusedId(engine)).toBe('file3') // recovery after delete

      engine.dispatch(historyCommands.undo())
      // file2 is restored — focus should go to it
      expect(getEntity(engine.getStore(), 'file2')).toBeDefined()
      expect(getFocusedId(engine)).toBe('file2')
    })

    it('undo create focuses back to where we were', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('folder1'))
      engine.dispatch(crudCommands.create({ id: 'newfile', data: { name: 'new.ts' } }, 'folder1'))
      expect(getFocusedId(engine)).toBe('newfile')

      engine.dispatch(historyCommands.undo())
      // newfile is removed — recovery should fallback
      expect(getEntity(engine.getStore(), 'newfile')).toBeUndefined()
      expect(getFocusedId(engine)).not.toBe('newfile')
    })

    it('redo delete recovers focus again', () => {
      const { engine } = setup()
      engine.dispatch(focusCommands.setFocus('file2'))
      engine.dispatch(crudCommands.remove('file2'))
      engine.dispatch(historyCommands.undo())
      expect(getFocusedId(engine)).toBe('file2')

      engine.dispatch(historyCommands.redo())
      // file2 deleted again — recovery
      expect(getFocusedId(engine)).toBe('file3')
    })
  })
})
