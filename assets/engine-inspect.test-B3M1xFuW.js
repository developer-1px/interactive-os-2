var e=`// ② 2026-04-03-app-inspector-prd.md
import { describe, it, expect } from 'vitest'
import { createCommandEngine } from '../engine/createCommandEngine'
import { buildRegistry } from '../engine/types'
import type { InspectResult, Plugin } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import { focusCommands } from '../core'
import { selectionCommands } from '../axis/select'
import { expandCommands } from '../axis/expand'
import { history } from '../plugins/history'
import { zodSchema } from '../plugins/zodSchema'
import { z } from 'zod'
import { inspectToTree } from '../engine/inspectToTree'

const emptyStore: NormalizedData = { entities: {}, relationships: {} }

function noop() {}

// V1: 2026-04-03-app-inspector-prd.md
describe('engine.inspect()', () => {
  it('V1: returns commands, keyMap, plugins, state, extras', () => {
    const historyPlugin = history()
    const registry = buildRegistry(focusCommands, selectionCommands, expandCommands)
    // Add plugin commands to registry
    if (historyPlugin.commands) {
      for (const creator of Object.values(historyPlugin.commands)) {
        if (creator && 'type' in creator && 'handler' in creator) {
          registry.set(creator.type as string, creator.handler as (s: NormalizedData, p?: unknown) => NormalizedData)
        }
      }
    }

    const keyMap: Record<string, import('../engine/types').KeyMapEntry> = { ArrowDown: { owner: 'navigate' }, ArrowUp: { owner: 'navigate' } }
    const engine = createCommandEngine(emptyStore, historyPlugin.middleware ? [historyPlugin.middleware] : [], registry, noop, {
      keyMap,
      plugins: [historyPlugin],
    })

    const result = engine.inspect()

    expect(result.commands).toContain('core:focus')
    expect(result.commands.length).toBeGreaterThan(0)
    expect(result.keyMap).toEqual(keyMap)
    expect(result.plugins).toContain('history')
    expect(result.state).toEqual(emptyStore)
    expect(result.extras).toHaveProperty('history')
  })

  // V2: 2026-04-03-app-inspector-prd.md
  it('V2: zodSchema plugin inspect returns schemas, childRules, rootTypes', () => {
    const itemSchema = z.object({ type: z.literal('item'), label: z.string() })
    const plugin = zodSchema({
      childRules: { container: z.array(itemSchema) },
      rootTypes: [itemSchema],
    })

    const registry = buildRegistry(focusCommands)
    const engine = createCommandEngine(emptyStore, plugin.middleware ? [plugin.middleware] : [], registry, noop, {
      plugins: [plugin],
    })

    const result = engine.inspect()
    const zodExtras = result.extras['zodSchema']!

    expect(zodExtras).toHaveProperty('schemas')
    expect(zodExtras.schemas).toEqual(['container'])
    expect(zodExtras.childRules).toEqual({ container: 'collection' })
    expect(zodExtras.rootTypes).toBe(1)
  })

  // V3: 2026-04-03-app-inspector-prd.md
  it('V3: history plugin inspect returns undoCount/redoCount after command execution', () => {
    const historyPlugin = history()
    const registry = buildRegistry(focusCommands)
    if (historyPlugin.commands) {
      for (const creator of Object.values(historyPlugin.commands)) {
        if (creator && 'type' in creator && 'handler' in creator) {
          registry.set(creator.type as string, creator.handler as (s: NormalizedData, p?: unknown) => NormalizedData)
        }
      }
    }

    // Seed store with an entity so focus change creates a content diff... actually focus is meta, skipped by history.
    // We need a real content command. Let's use a store with an entity and dispatch a non-meta command.
    const store: NormalizedData = {
      entities: { a: { id: 'a', data: { label: 'A' } } },
      relationships: { [ROOT_ID]: ['a'] },
    }

    // history only tracks content diffs (non-meta). We need a handler that modifies entities.
    const testHandler = (s: NormalizedData, payload?: unknown) => {
      const p = payload as { id: string; label: string }
      return {
        ...s,
        entities: { ...s.entities, [p.id]: { id: p.id, data: { label: p.label } } },
      }
    }
    registry.set('test:update', testHandler)

    const engine = createCommandEngine(store, historyPlugin.middleware ? [historyPlugin.middleware] : [], registry, noop, {
      plugins: [historyPlugin],
    })

    // Before any command
    expect(engine.inspect().extras['history']).toEqual({ undoCount: 0, redoCount: 0 })

    // Execute a content command
    engine.dispatch({ type: 'test:update', payload: { id: 'a', label: 'B' } })
    expect(engine.inspect().extras['history']).toEqual({ undoCount: 1, redoCount: 0 })

    // Undo
    engine.dispatch({ type: 'history:undo' })
    expect(engine.inspect().extras['history']).toEqual({ undoCount: 0, redoCount: 1 })
  })

  // V4: 2026-04-03-app-inspector-prd.md
  it('V4: bare engine (no plugins) returns axis commands only, empty keyMap/plugins/extras', () => {
    const registry = buildRegistry(focusCommands, expandCommands)
    const engine = createCommandEngine(emptyStore, [], registry, noop)

    const result = engine.inspect()

    expect(result.commands).toContain('core:focus')
    expect(result.commands).toContain('core:expand')
    expect(result.keyMap).toEqual({})
    expect(result.plugins).toEqual([])
    expect(result.extras).toEqual({})
  })

  // V5: 2026-04-03-app-inspector-prd.md
  it('V5: plugin.inspect() that throws → extras has error, rest normal', () => {
    const badPlugin: Plugin = {
      name: 'bad',
      inspect: () => { throw new Error('boom') },
    }

    const registry = buildRegistry(focusCommands)
    const engine = createCommandEngine(emptyStore, [], registry, noop, {
      plugins: [badPlugin],
    })

    const result = engine.inspect()

    expect(result.extras['bad']).toEqual({ error: 'boom' })
    expect(result.commands).toContain('core:focus')
    expect(result.plugins).toContain('bad')
  })

  // V6: 2026-04-03-app-inspector-prd.md
  it('V6: empty store → state is empty NormalizedData, commands/keyMap normal', () => {
    const registry = buildRegistry(focusCommands)
    const engine = createCommandEngine(emptyStore, [], registry, noop)

    const result = engine.inspect()

    expect(result.state).toEqual({ entities: {}, relationships: {} })
    expect(result.commands.length).toBeGreaterThan(0)
  })
})

// V7: 2026-04-03-app-inspector-prd.md
describe('inspectToTree', () => {
  it('V7: converts InspectResult to NormalizedData with 6 groups', () => {
    const input: InspectResult = {
      commands: ['core:focus', 'core:expand'],
      keyMap: { ArrowDown: { owner: 'navigate' } },
      plugins: ['history'],
      state: {
        entities: { a: { id: 'a', data: { label: 'A' } } },
        relationships: { [ROOT_ID]: ['a'] },
      },
      extras: { history: { undoCount: 1, redoCount: 0 } },
    }

    const tree = inspectToTree(input)

    // 6 groups under root
    const rootChildren = tree.relationships[ROOT_ID]!
    expect(rootChildren).toHaveLength(6)
    expect(rootChildren).toContain('_group:commands')
    expect(rootChildren).toContain('_group:keyMap')
    expect(rootChildren).toContain('_group:bindings')
    expect(rootChildren).toContain('_group:plugins')
    expect(rootChildren).toContain('_group:state')
    expect(rootChildren).toContain('_group:extras')

    // Commands group has 2 children
    expect(tree.relationships['_group:commands']).toHaveLength(2)
    expect(tree.entities['_cmd:core:focus']).toBeDefined()

    // KeyMap group has 1 child
    expect(tree.relationships['_group:keyMap']).toHaveLength(1)
    expect(tree.entities['_key:ArrowDown']!.data).toMatchObject({ label: 'ArrowDown', value: 'navigate' })

    // Plugins group has 1 child
    expect(tree.relationships['_group:plugins']).toHaveLength(1)

    // State group has 2 children (entities summary + relationships summary)
    expect(tree.relationships['_group:state']).toHaveLength(2)

    // Extras group has 1 plugin child with 2 fields
    expect(tree.relationships['_group:extras']).toHaveLength(1)
    expect(tree.relationships['_extra:history']).toHaveLength(2)
  })
})
`;export{e as default};