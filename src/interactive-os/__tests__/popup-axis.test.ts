import { describe, it, expect } from 'vitest'
import { popupCommands, getPopupEntity, POPUP_ID } from '../axis/popup'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'

function fixtureStore() {
  return createStore({
    entities: {
      trigger: { id: 'trigger', data: { name: 'Menu' } },
      item1: { id: 'item1', data: { name: 'Cut' } },
      item2: { id: 'item2', data: { name: 'Copy' } },
    },
    relationships: {
      [ROOT_ID]: ['trigger'],
      trigger: ['item1', 'item2'],
    },
  })
}

describe('popupCommands', () => {
  describe('open', () => {
    it('sets isOpen=true and stores triggerId', () => {
      const store = fixtureStore()
      const cmd = popupCommands.open('trigger')
      const next = cmd.execute(store)
      const entity = getPopupEntity(next)
      expect(entity.isOpen).toBe(true)
      expect(entity.triggerId).toBe('trigger')
    })

    it('is idempotent — same triggerId returns same store ref', () => {
      const store = fixtureStore()
      const cmd = popupCommands.open('trigger')
      const after1 = cmd.execute(store)
      const after2 = popupCommands.open('trigger').execute(after1)
      expect(after2).toBe(after1)
    })
  })

  describe('close', () => {
    it('sets isOpen=false', () => {
      const store = fixtureStore()
      const opened = popupCommands.open('trigger').execute(store)
      const closed = popupCommands.close().execute(opened)
      expect(getPopupEntity(closed).isOpen).toBe(false)
    })

    it('preserves triggerId after close', () => {
      const store = fixtureStore()
      const opened = popupCommands.open('trigger').execute(store)
      const closed = popupCommands.close().execute(opened)
      expect(getPopupEntity(closed).triggerId).toBe('trigger')
    })

    it('close on already-closed still creates entity with isOpen=false', () => {
      const store = fixtureStore()
      const closed = popupCommands.close().execute(store)
      const entity = closed.entities[POPUP_ID]
      expect(entity).toBeDefined()
      expect(entity.isOpen).toBe(false)
    })
  })

  describe('no undo', () => {
    it('open command has no undo (view state)', () => {
      const cmd = popupCommands.open('trigger')
      expect('undo' in cmd).toBe(false)
    })

    it('close command has no undo (view state)', () => {
      const cmd = popupCommands.close()
      expect('undo' in cmd).toBe(false)
    })
  })
})
