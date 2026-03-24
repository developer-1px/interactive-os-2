// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createStore, getEntity } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import { createCommandEngine } from '../engine/createCommandEngine'
import { clipboardCommands, resetClipboard, clipboard } from '../plugins/clipboard'
import { history, historyCommands } from '../plugins/history'
import { core } from '../plugins/core'

function fixtureStore() {
  return createStore({
    entities: {
      'row-1': { id: 'row-1', data: { cells: ['hello', 'world', 'foo'] } },
      'row-2': { id: 'row-2', data: { cells: ['bar', 'baz', 'qux'] } },
    },
    relationships: { [ROOT_ID]: ['row-1', 'row-2'] },
  })
}

function createEngine(store = fixtureStore()) {
  const corePlugin = core()
  const clipboardPlugin = clipboard()
  const historyPlugin = history()
  const middlewares = [corePlugin, clipboardPlugin, historyPlugin]
    .map((p) => p.middleware)
    .filter((m): m is NonNullable<typeof m> => m != null)
  return createCommandEngine(store, middlewares, vi.fn(), { logger: false })
}

describe('clearCellValue', () => {
  beforeEach(() => resetClipboard())

  // V3: 2026-03-25-cell-edit-plugin-prd.md
  it('sets cell to empty string', () => {
    const engine = createEngine()
    engine.dispatch(clipboardCommands.clearCellValue('row-1', 0))
    const cells = (getEntity(engine.getStore(), 'row-1')?.data as any).cells
    expect(cells[0]).toBe('')
    expect(cells[1]).toBe('world') // other cells unchanged
  })

  // V7: 2026-03-25-cell-edit-plugin-prd.md
  it('undo restores original value', () => {
    const engine = createEngine()
    engine.dispatch(clipboardCommands.clearCellValue('row-1', 0))
    engine.dispatch(historyCommands.undo())
    const cells = (getEntity(engine.getStore(), 'row-1')?.data as any).cells
    expect(cells[0]).toBe('hello')
  })

  // V9: 2026-03-25-cell-edit-plugin-prd.md
  it('on empty cell is no-op', () => {
    const initial = createStore({
      entities: { 'row-1': { id: 'row-1', data: { cells: ['', 'world'] } } },
      relationships: { [ROOT_ID]: ['row-1'] },
    })
    const engine = createEngine(initial)
    const storeBefore = engine.getStore()
    engine.dispatch(clipboardCommands.clearCellValue('row-1', 0))
    expect(engine.getStore()).toBe(storeBefore) // reference equality = no change
  })
})

describe('cutCellValue', () => {
  beforeEach(() => resetClipboard())

  // V1: 2026-03-25-cell-edit-plugin-prd.md
  it('copies value to buffer and clears cell', () => {
    const engine = createEngine()
    engine.dispatch(clipboardCommands.cutCellValue('row-1', 0))
    // Cell cleared
    const cells = (getEntity(engine.getStore(), 'row-1')?.data as any).cells
    expect(cells[0]).toBe('')
    // Buffer has value — verify by pasting to another cell
    engine.dispatch(clipboardCommands.pasteCellValue('row-2', 0))
    const cells2 = (getEntity(engine.getStore(), 'row-2')?.data as any).cells
    expect(cells2[0]).toBe('hello')
  })

  // V6: 2026-03-25-cell-edit-plugin-prd.md
  it('undo restores original value', () => {
    const engine = createEngine()
    engine.dispatch(clipboardCommands.cutCellValue('row-1', 0))
    engine.dispatch(historyCommands.undo())
    const cells = (getEntity(engine.getStore(), 'row-1')?.data as any).cells
    expect(cells[0]).toBe('hello')
  })
})
