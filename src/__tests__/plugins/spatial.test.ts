import { describe, it, expect } from 'vitest'
import { createStore } from '../../interactive-os/core/createStore'
import { ROOT_ID } from '../../interactive-os/core/types'
import {
  SPATIAL_PARENT_ID,
  spatialCommands,
  spatial,
  getSpatialParentId,
} from '../../interactive-os/plugins/spatial'

function buildTree() {
  return createStore({
    entities: {
      a: { id: 'a' },
      b: { id: 'b' },
      c: { id: 'c' },
    },
    relationships: {
      [ROOT_ID]: ['a', 'b'],
      a: ['c'],
    },
  })
}

describe('spatial plugin', () => {
  it('initializes with ROOT_ID as implicit default (no entity)', () => {
    const store = buildTree()
    expect(store.entities[SPATIAL_PARENT_ID]).toBeUndefined()
    expect(getSpatialParentId(store)).toBe(ROOT_ID)
  })

  it('enterChild sets spatial parent to given node', () => {
    const store = buildTree()
    const cmd = spatialCommands.enterChild('a')
    const next = cmd.execute(store)
    expect(getSpatialParentId(next)).toBe('a')
    expect(next.entities[SPATIAL_PARENT_ID]?.parentId).toBe('a')
  })

  it('exitToParent restores to grandparent', () => {
    let store = buildTree()
    // Enter 'a' (child of ROOT), then enter 'c' (child of 'a')
    store = spatialCommands.enterChild('a').execute(store)
    store = spatialCommands.enterChild('c').execute(store)
    expect(getSpatialParentId(store)).toBe('c')

    // Exit from 'c' should go to 'a' (parent of 'c')
    const exitCmd = spatialCommands.exitToParent()
    store = exitCmd.execute(store)
    expect(getSpatialParentId(store)).toBe('a')
  })

  it('exitToParent removes entity when going back to ROOT_ID', () => {
    let store = buildTree()
    store = spatialCommands.enterChild('a').execute(store)
    expect(getSpatialParentId(store)).toBe('a')

    // Exit from 'a' → parent of 'a' is ROOT_ID → remove entity
    const exitCmd = spatialCommands.exitToParent()
    store = exitCmd.execute(store)
    expect(store.entities[SPATIAL_PARENT_ID]).toBeUndefined()
    expect(getSpatialParentId(store)).toBe(ROOT_ID)
  })

  it('enterChild is undoable', () => {
    const store = buildTree()
    const cmd = spatialCommands.enterChild('a')
    const after = cmd.execute(store)
    expect(getSpatialParentId(after)).toBe('a')

    const restored = cmd.undo(after)
    expect(restored.entities[SPATIAL_PARENT_ID]).toBeUndefined()
    expect(getSpatialParentId(restored)).toBe(ROOT_ID)
  })

  it('enterChild undo restores previous non-root parent', () => {
    let store = buildTree()
    store = spatialCommands.enterChild('a').execute(store)

    const cmd = spatialCommands.enterChild('c')
    const after = cmd.execute(store)
    expect(getSpatialParentId(after)).toBe('c')

    const restored = cmd.undo(after)
    expect(getSpatialParentId(restored)).toBe('a')
  })

  it('exitToParent at ROOT_ID does nothing (no-op)', () => {
    const store = buildTree()
    const cmd = spatialCommands.exitToParent()
    const after = cmd.execute(store)
    expect(after).toBe(store) // reference equality — no mutation
    expect(getSpatialParentId(after)).toBe(ROOT_ID)
  })

  it('spatial() factory returns plugin with name', () => {
    const plugin = spatial()
    expect(plugin.name).toBe('spatial')
  })
})
