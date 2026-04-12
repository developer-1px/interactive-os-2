/**
 * Clipboard serialize/deserialize integration tests.
 * Tests the side-channel API: getSerializedText, setExternalClipboard, entriesToStore.
 */
// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createCommandEngine } from '../engine/createCommandEngine'
import { createStore, getChildren } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { CommandHandler, Plugin } from '../engine/types'
import {
  clipboard,
  clipboardCommands,
  resetClipboard,
  getSerializedText,
  setExternalClipboard,
} from '../plugins/clipboard'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      a: { id: 'a', data: { type: 'heading', content: 'Alpha', level: 1 } },
      b: { id: 'b', data: { type: 'paragraph', content: 'Bravo' } },
      c: { id: 'c', data: { type: 'heading', content: 'Charlie', level: 2 } },
    },
    relationships: {
      [ROOT_ID]: ['a', 'b', 'c'],
    },
  })
}

function mockSerialize(subtree: NormalizedData): string {
  const ids = subtree.relationships[ROOT_ID] ?? []
  return ids.map(id => {
    const d = subtree.entities[id]?.data as Record<string, unknown>
    return `${d.type}:${d.content}`
  }).join('\n')
}

function mockDeserialize(text: string): NormalizedData | null {
  if (!text.trim()) return null
  const lines = text.trim().split('\n')
  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const rootChildren: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const [type, content] = lines[i].split(':')
    const id = `ext-${i}`
    entities[id] = { id, data: { type, content } }
    rootChildren.push(id)
  }
  return createStore({ entities, relationships: { [ROOT_ID]: rootChildren } })
}

function createEngine(plugins: Plugin[], data?: NormalizedData) {
  const middlewares = plugins.map(p => p.middleware).filter((m): m is NonNullable<typeof m> => m != null)
  const registry = new Map<string, CommandHandler>()
  for (const plugin of plugins) {
    for (const creator of Object.values(plugin.commands ?? {})) {
      if (creator != null && 'type' in creator && 'handler' in creator) {
        registry.set(creator.type as string, creator.handler as CommandHandler)
      }
    }
  }
  return createCommandEngine(data ?? fixtureData(), middlewares, registry, vi.fn(), { logger: false })
}

describe('clipboard serialize/deserialize', () => {
  beforeEach(() => resetClipboard())

  // V1: 2026-04-04-clipboard-serialize-prd.md
  it('V1: copy with serialize → getSerializedText returns serialized text', () => {
    const plugin = clipboard({ serialize: mockSerialize, deserialize: mockDeserialize })
    const engine = createEngine([plugin])

    engine.dispatch(clipboardCommands.copy(['a', 'b']))

    const text = getSerializedText()
    expect(text).toBe('heading:Alpha\nparagraph:Bravo')
  })

  // V5: 2026-04-04-clipboard-serialize-prd.md
  it('V5: copy without serialize → getSerializedText returns null', () => {
    const plugin = clipboard()
    const engine = createEngine([plugin])

    engine.dispatch(clipboardCommands.copy(['a']))

    expect(getSerializedText()).toBeNull()
  })

  // V2: 2026-04-04-clipboard-serialize-prd.md
  it('V2: setExternalClipboard deserializes text into buffer → paste inserts', () => {
    const plugin = clipboard({ serialize: mockSerialize, deserialize: mockDeserialize })
    const engine = createEngine([plugin])

    const success = setExternalClipboard('heading:External\nparagraph:Text')
    expect(success).toBe(true)

    engine.dispatch(clipboardCommands.paste('c'))
    const result = engine.getStore()
    const rootChildren = getChildren(result, ROOT_ID)
    expect(rootChildren.length).toBe(5)
  })

  // V3: 2026-04-04-clipboard-serialize-prd.md
  it('V3: internal copy → paste uses buffer (preserves original ids pattern)', () => {
    const plugin = clipboard({ serialize: mockSerialize, deserialize: mockDeserialize })
    const engine = createEngine([plugin])

    engine.dispatch(clipboardCommands.copy(['a']))
    engine.dispatch(clipboardCommands.paste('c'))

    const result = engine.getStore()
    const rootChildren = getChildren(result, ROOT_ID)
    expect(rootChildren.length).toBe(4)
    expect(rootChildren[3]).toMatch(/^a-copy-/)
  })

  // V4: 2026-04-04-clipboard-serialize-prd.md
  it('V4: internal copy then setExternalClipboard → paste uses external', () => {
    const plugin = clipboard({ serialize: mockSerialize, deserialize: mockDeserialize })
    const engine = createEngine([plugin])

    engine.dispatch(clipboardCommands.copy(['a']))
    expect(getSerializedText()).toBe('heading:Alpha')

    setExternalClipboard('paragraph:FromOutside')
    engine.dispatch(clipboardCommands.paste('c'))

    const result = engine.getStore()
    const rootChildren = getChildren(result, ROOT_ID)
    expect(rootChildren.length).toBe(4)
    // External data gets new IDs (copy mode generates new IDs)
    expect(rootChildren[3]).toMatch(/^ext-0/)
  })

  // V6: 2026-04-04-clipboard-serialize-prd.md
  it('V6: serialize throws → getSerializedText returns null, buffer intact', () => {
    const plugin = clipboard({
      serialize: () => { throw new Error('fail') },
      deserialize: mockDeserialize,
    })
    const engine = createEngine([plugin])

    engine.dispatch(clipboardCommands.copy(['a']))

    expect(getSerializedText()).toBeNull()
    engine.dispatch(clipboardCommands.paste('c'))
    const result = engine.getStore()
    expect(getChildren(result, ROOT_ID).length).toBe(4)
  })

  // V7: 2026-04-04-clipboard-serialize-prd.md
  it('V7: deserialize returns null → setExternalClipboard returns false', () => {
    clipboard({ serialize: mockSerialize, deserialize: () => null })
    expect(setExternalClipboard('garbage data')).toBe(false)
  })

  // V8: 2026-04-04-clipboard-serialize-prd.md
  it('V8: empty text → setExternalClipboard returns false', () => {
    clipboard({ serialize: mockSerialize, deserialize: mockDeserialize })
    expect(setExternalClipboard('')).toBe(false)
  })

})
