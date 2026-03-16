# interactive-os Phase 1: Core Engine Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundational layers — Normalized Store, Command Engine, and Plugin System — with full test coverage, validated by a working treegrid integration test.

**Architecture:** Three layers stacked bottom-up: NormalizedData types and utilities (①), CommandEngine with middleware pipeline (②), Plugin interface with core() plugin (③). External state integration via transform adapters. All pure functions, immutable updates, fully testable without React.

**Tech Stack:** TypeScript 5.9, Vitest (test runner), React 19 (peer dep for hooks only), pnpm

**Spec Reference:** `docs/superpowers/specs/2026-03-16-interactive-os-design.md`

---

## File Structure

```
src/
  interactive-os/
    core/
      types.ts              — NormalizedData, Entity, Command, BatchCommand, TransformAdapter, Middleware, Plugin
      normalized-store.ts   — Store helper functions: getEntity, getChildren, addEntity, removeEntity, moveNode
      command-engine.ts     — createCommandEngine: dispatch, middleware pipeline, store management
    plugins/
      core.ts               — core() plugin: focus state, selection state, expand/collapse commands
      history.ts            — history() plugin: undo/redo middleware, command stack
    __tests__/
      types.test.ts
      normalized-store.test.ts
      command-engine.test.ts
      plugin-core.test.ts
      plugin-history.test.ts
      integration.test.ts   — Full pipeline: store + engine + plugins working together
```

Note: `behaviors/types.ts` (AriaBehavior, BehaviorContext, NodeState) is deferred to Phase 2.
Note: No barrel export (`index.ts`). Consumers import directly from specific modules (project convention: never barrel export).

---

## Chunk 1: Project Setup + Types

### Task 1: Add Vitest and testing infrastructure

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install vitest**

```bash
pnpm add -D vitest
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
})
```

- [ ] **Step 3: Add test script to package.json**

Add to `scripts` in `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify vitest works**

Run: `pnpm test`
Expected: "No test files found" (not an error, just no tests yet)

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json pnpm-lock.yaml
git commit -m "chore: add vitest testing infrastructure"
```

---

### Task 2: Define core type interfaces

**Files:**
- Create: `src/interactive-os/core/types.ts`
- Test: `src/interactive-os/__tests__/types.test.ts`

- [ ] **Step 1: Write type validation test**

Create `src/interactive-os/__tests__/types.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import type {
  Entity,
  NormalizedData,
  Command,
  BatchCommand,
  TransformAdapter,
  Middleware,
  Plugin,
} from '../core/types'
import { createBatchCommand } from '../core/types'

describe('Core Types', () => {
  it('NormalizedData has entities and relationships', () => {
    const data: NormalizedData = {
      entities: {
        'node-1': { id: 'node-1', name: 'src' },
        'node-2': { id: 'node-2', name: 'App.tsx' },
      },
      relationships: {
        __root__: ['node-1'],
        'node-1': ['node-2'],
      },
    }

    expect(data.entities['node-1']?.id).toBe('node-1')
    expect(data.relationships['__root__']).toEqual(['node-1'])
    expect(data.relationships['node-1']).toEqual(['node-2'])
  })

  it('Entity supports arbitrary fields', () => {
    const entity: Entity = {
      id: 'file-1',
      name: 'README.md',
      size: 1024,
      tags: ['docs'],
    }

    expect(entity.id).toBe('file-1')
    expect(entity['name']).toBe('README.md')
  })

  it('Command has execute and undo that return new store', () => {
    const addEntity: Command = {
      type: 'crud:add',
      payload: { id: 'new-1', name: 'New' },
      execute(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            'new-1': { id: 'new-1', name: 'New' },
          },
        }
      },
      undo(store) {
        const { 'new-1': _, ...rest } = store.entities
        return { ...store, entities: rest }
      },
    }

    const initial: NormalizedData = { entities: {}, relationships: {} }
    const after = addEntity.execute(initial)
    expect(after.entities['new-1']).toEqual({ id: 'new-1', name: 'New' })

    const reverted = addEntity.undo(after)
    expect(reverted.entities['new-1']).toBeUndefined()
  })

  it('createBatchCommand executes commands in order, undoes in reverse', () => {
    const cmd1: Command = {
      type: 'test:add-a',
      payload: null,
      execute: (s) => ({
        ...s,
        entities: { ...s.entities, a: { id: 'a' } },
      }),
      undo: (s) => {
        const { a: _, ...rest } = s.entities
        return { ...s, entities: rest }
      },
    }

    const cmd2: Command = {
      type: 'test:add-b',
      payload: null,
      execute: (s) => ({
        ...s,
        entities: { ...s.entities, b: { id: 'b' } },
      }),
      undo: (s) => {
        const { b: _, ...rest } = s.entities
        return { ...s, entities: rest }
      },
    }

    const batch = createBatchCommand([cmd1, cmd2])

    const initial: NormalizedData = { entities: {}, relationships: {} }
    const after = batch.execute(initial)
    expect(Object.keys(after.entities)).toEqual(['a', 'b'])

    const reverted = batch.undo(after)
    expect(Object.keys(reverted.entities)).toEqual([])
  })

  it('createBatchCommand methods work when destructured', () => {
    const cmd: Command = {
      type: 'test:add-x',
      payload: null,
      execute: (s) => ({ ...s, entities: { ...s.entities, x: { id: 'x' } } }),
      undo: (s) => {
        const { x: _, ...rest } = s.entities
        return { ...s, entities: rest }
      },
    }

    const batch = createBatchCommand([cmd])
    const { execute, undo } = batch  // destructured — must not break
    const initial: NormalizedData = { entities: {}, relationships: {} }

    const after = execute(initial)
    expect(after.entities['x']).toBeDefined()

    const reverted = undo(after)
    expect(reverted.entities['x']).toBeUndefined()
  })

  it('TransformAdapter normalizes and denormalizes', () => {
    interface FileNode { name: string; children?: FileNode[] }

    const adapter: TransformAdapter<FileNode[]> = {
      normalize(files) {
        const entities: Record<string, Entity> = {}
        const relationships: Record<string, string[]> = { __root__: [] }
        let counter = 0

        const walk = (nodes: FileNode[], parentId: string) => {
          for (const node of nodes) {
            const id = `node-${counter++}`
            entities[id] = { id, name: node.name }
            if (!relationships[parentId]) relationships[parentId] = []
            relationships[parentId]!.push(id)
            if (node.children) walk(node.children, id)
          }
        }
        walk(files, '__root__')
        return { entities, relationships }
      },
      denormalize(data) {
        const build = (parentId: string): FileNode[] => {
          return (data.relationships[parentId] ?? []).map((id) => {
            const entity = data.entities[id]!
            const children = build(id)
            return children.length
              ? { name: entity.name as string, children }
              : { name: entity.name as string }
          })
        }
        return build('__root__')
      },
    }

    const input: FileNode[] = [{ name: 'src', children: [{ name: 'App.tsx' }] }]
    const normalized = adapter.normalize(input)

    expect(Object.keys(normalized.entities)).toHaveLength(2)
    expect(normalized.relationships['__root__']).toHaveLength(1)

    const denormalized = adapter.denormalize(normalized)
    expect(denormalized).toEqual(input)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/interactive-os/__tests__/types.test.ts`
Expected: FAIL — cannot resolve `../core/types`

- [ ] **Step 3: Implement core types**

Create `src/interactive-os/core/types.ts`:

```ts
export interface Entity {
  id: string
  [key: string]: unknown
}

export interface NormalizedData {
  entities: Record<string, Entity>
  relationships: Record<string, string[]>
}

export const ROOT_ID = '__root__' as const

export interface Command {
  type: string
  payload: unknown
  execute(store: NormalizedData): NormalizedData
  undo(store: NormalizedData): NormalizedData
}

export interface BatchCommand extends Command {
  type: 'batch'
  commands: Command[]
}

export interface TransformAdapter<TExternal> {
  normalize(external: TExternal): NormalizedData
  denormalize(internal: NormalizedData): TExternal
}

export function createBatchCommand(cmds: Command[]): BatchCommand {
  return {
    type: 'batch',
    payload: null,
    commands: cmds,
    execute: (store: NormalizedData): NormalizedData =>
      cmds.reduce((s, c) => c.execute(s), store),
    undo: (store: NormalizedData): NormalizedData =>
      [...cmds].reverse().reduce((s, c) => c.undo(s), store),
  }
}

export type Middleware = (
  next: (command: Command) => void
) => (command: Command) => void

export interface Plugin {
  middleware?: Middleware
  commands?: Record<string, (...args: unknown[]) => Command>
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/interactive-os/__tests__/types.test.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/core/types.ts src/interactive-os/__tests__/types.test.ts
git commit -m "feat: add core type interfaces — Entity, NormalizedData, Command, Plugin"
```

---

## Chunk 2: Normalized Store Utilities

### Task 3: Normalized store helper functions

**Files:**
- Create: `src/interactive-os/core/normalized-store.ts`
- Test: `src/interactive-os/__tests__/normalized-store.test.ts`

- [ ] **Step 1: Write failing tests for store utilities**

Create `src/interactive-os/__tests__/normalized-store.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  createStore,
  getEntity,
  getChildren,
  getParent,
  addEntity,
  removeEntity,
  updateEntity,
  moveNode,
  insertNode,
} from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'

// Shared fixture
function fixtureStore(): NormalizedData {
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

describe('createStore', () => {
  it('creates an empty store with __root__', () => {
    const store = createStore()
    expect(store.entities).toEqual({})
    expect(store.relationships).toEqual({ [ROOT_ID]: [] })
  })

  it('creates a store from initial data', () => {
    const store = fixtureStore()
    expect(Object.keys(store.entities)).toHaveLength(3)
    expect(store.relationships[ROOT_ID]).toEqual(['folder1'])
  })
})

describe('getEntity', () => {
  it('returns entity by id', () => {
    const store = fixtureStore()
    expect(getEntity(store, 'folder1')).toEqual({ id: 'folder1', name: 'src' })
  })

  it('returns undefined for missing id', () => {
    const store = fixtureStore()
    expect(getEntity(store, 'nope')).toBeUndefined()
  })
})

describe('getChildren', () => {
  it('returns child ids', () => {
    const store = fixtureStore()
    expect(getChildren(store, 'folder1')).toEqual(['file1', 'file2'])
  })

  it('returns empty array for leaf node', () => {
    const store = fixtureStore()
    expect(getChildren(store, 'file1')).toEqual([])
  })
})

describe('getParent', () => {
  it('returns parent id', () => {
    const store = fixtureStore()
    expect(getParent(store, 'file1')).toBe('folder1')
  })

  it('returns __root__ for top-level node', () => {
    const store = fixtureStore()
    expect(getParent(store, 'folder1')).toBe(ROOT_ID)
  })

  it('returns undefined for unknown node', () => {
    const store = fixtureStore()
    expect(getParent(store, 'nope')).toBeUndefined()
  })
})

describe('addEntity', () => {
  it('adds entity and relationship', () => {
    const store = fixtureStore()
    const next = addEntity(store, { id: 'file3', name: 'index.ts' }, 'folder1')

    expect(getEntity(next, 'file3')).toEqual({ id: 'file3', name: 'index.ts' })
    expect(getChildren(next, 'folder1')).toEqual(['file1', 'file2', 'file3'])
  })

  it('adds to root when no parent specified', () => {
    const store = fixtureStore()
    const next = addEntity(store, { id: 'folder2', name: 'lib' })

    expect(getChildren(next, ROOT_ID)).toEqual(['folder1', 'folder2'])
  })

  it('adds at specific index', () => {
    const store = fixtureStore()
    const next = addEntity(store, { id: 'file3', name: 'index.ts' }, 'folder1', 0)

    expect(getChildren(next, 'folder1')).toEqual(['file3', 'file1', 'file2'])
  })

  it('does not mutate original store', () => {
    const store = fixtureStore()
    addEntity(store, { id: 'file3', name: 'index.ts' }, 'folder1')

    expect(getChildren(store, 'folder1')).toEqual(['file1', 'file2'])
  })
})

describe('removeEntity', () => {
  it('removes entity and relationship', () => {
    const store = fixtureStore()
    const next = removeEntity(store, 'file1')

    expect(getEntity(next, 'file1')).toBeUndefined()
    expect(getChildren(next, 'folder1')).toEqual(['file2'])
  })

  it('removes entity with children recursively', () => {
    const store = fixtureStore()
    const next = removeEntity(store, 'folder1')

    expect(getEntity(next, 'folder1')).toBeUndefined()
    expect(getEntity(next, 'file1')).toBeUndefined()
    expect(getEntity(next, 'file2')).toBeUndefined()
    expect(getChildren(next, ROOT_ID)).toEqual([])
  })
})

describe('updateEntity', () => {
  it('updates entity fields immutably', () => {
    const store = fixtureStore()
    const next = updateEntity(store, 'file1', { name: 'App.test.tsx' })

    expect(getEntity(next, 'file1')).toEqual({ id: 'file1', name: 'App.test.tsx' })
    expect(getEntity(store, 'file1')?.name).toBe('App.tsx') // original unchanged
  })
})

describe('moveNode', () => {
  it('moves node to new parent', () => {
    let store = fixtureStore()
    store = addEntity(store, { id: 'folder2', name: 'lib' })

    const next = moveNode(store, 'file1', 'folder2')

    expect(getChildren(next, 'folder1')).toEqual(['file2'])
    expect(getChildren(next, 'folder2')).toEqual(['file1'])
  })

  it('moves node to specific index', () => {
    const store = fixtureStore()
    const next = moveNode(store, 'file2', 'folder1', 0)

    expect(getChildren(next, 'folder1')).toEqual(['file2', 'file1'])
  })
})

describe('insertNode', () => {
  it('inserts at specific position in relationship', () => {
    const store = fixtureStore()
    const next = insertNode(store, { id: 'file3', name: 'new.ts' }, 'folder1', 1)

    expect(getChildren(next, 'folder1')).toEqual(['file1', 'file3', 'file2'])
  })
})

describe('edge cases', () => {
  it('removeEntity on non-existent id returns store unchanged', () => {
    const store = fixtureStore()
    const next = removeEntity(store, 'nonexistent')
    expect(next.entities).toEqual(store.entities)
  })

  it('updateEntity on non-existent id returns store unchanged', () => {
    const store = fixtureStore()
    const next = updateEntity(store, 'nonexistent', { name: 'nope' })
    expect(next).toBe(store)
  })

  it('addEntity with duplicate id overwrites entity', () => {
    const store = fixtureStore()
    const next = addEntity(store, { id: 'file1', name: 'Overwritten.tsx' }, 'folder1')
    expect(getEntity(next, 'file1')?.name).toBe('Overwritten.tsx')
  })

  it('getParent returns undefined for __root__ children sentinel', () => {
    const store = createStore()
    expect(getParent(store, 'nonexistent')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/interactive-os/__tests__/normalized-store.test.ts`
Expected: FAIL — cannot resolve `../core/normalized-store`

- [ ] **Step 3: Implement normalized store**

Create `src/interactive-os/core/normalized-store.ts`:

```ts
import type { Entity, NormalizedData } from './types'
import { ROOT_ID } from './types'

export function createStore(
  initial?: Partial<NormalizedData>
): NormalizedData {
  return {
    entities: initial?.entities ?? {},
    relationships: {
      [ROOT_ID]: [],
      ...initial?.relationships,
    },
  }
}

export function getEntity(
  store: NormalizedData,
  id: string
): Entity | undefined {
  return store.entities[id]
}

export function getChildren(
  store: NormalizedData,
  parentId: string
): string[] {
  return store.relationships[parentId] ?? []
}

export function getParent(
  store: NormalizedData,
  nodeId: string
): string | undefined {
  for (const [parentId, children] of Object.entries(store.relationships)) {
    if (children.includes(nodeId)) return parentId
  }
  return undefined
}

export function addEntity(
  store: NormalizedData,
  entity: Entity,
  parentId: string = ROOT_ID,
  index?: number
): NormalizedData {
  const currentChildren = getChildren(store, parentId)
  const newChildren =
    index !== undefined
      ? [...currentChildren.slice(0, index), entity.id, ...currentChildren.slice(index)]
      : [...currentChildren, entity.id]

  return {
    entities: { ...store.entities, [entity.id]: entity },
    relationships: { ...store.relationships, [parentId]: newChildren },
  }
}

export function removeEntity(
  store: NormalizedData,
  nodeId: string
): NormalizedData {
  // Collect all descendants recursively
  const toRemove = new Set<string>()
  const collect = (id: string) => {
    toRemove.add(id)
    for (const childId of getChildren(store, id)) {
      collect(childId)
    }
  }
  collect(nodeId)

  // Remove from entities
  const entities: Record<string, Entity> = {}
  for (const [id, entity] of Object.entries(store.entities)) {
    if (!toRemove.has(id)) entities[id] = entity
  }

  // Remove from relationships
  const relationships: Record<string, string[]> = {}
  for (const [parentId, children] of Object.entries(store.relationships)) {
    if (!toRemove.has(parentId)) {
      relationships[parentId] = children.filter((id) => !toRemove.has(id))
    }
  }

  return { entities, relationships }
}

export function updateEntity(
  store: NormalizedData,
  nodeId: string,
  updates: Partial<Entity>
): NormalizedData {
  const existing = store.entities[nodeId]
  if (!existing) return store

  return {
    ...store,
    entities: {
      ...store.entities,
      [nodeId]: { ...existing, ...updates, id: nodeId },
    },
  }
}

export function moveNode(
  store: NormalizedData,
  nodeId: string,
  newParentId: string,
  index?: number
): NormalizedData {
  const oldParentId = getParent(store, nodeId)
  if (!oldParentId) return store

  // Remove from old parent
  const oldChildren = getChildren(store, oldParentId).filter(
    (id) => id !== nodeId
  )

  // Add to new parent
  const newChildren = getChildren(store, newParentId)
  const insertAt = index !== undefined ? index : newChildren.length
  const updatedNewChildren =
    oldParentId === newParentId
      ? // Same parent: remove first, then insert
        (() => {
          const without = oldChildren
          return [
            ...without.slice(0, insertAt),
            nodeId,
            ...without.slice(insertAt),
          ]
        })()
      : [
          ...newChildren.slice(0, insertAt),
          nodeId,
          ...newChildren.slice(insertAt),
        ]

  const relationships = {
    ...store.relationships,
    [oldParentId]: oldParentId === newParentId ? updatedNewChildren : oldChildren,
    ...(oldParentId !== newParentId
      ? { [newParentId]: updatedNewChildren }
      : {}),
  }

  return { ...store, relationships }
}

export function insertNode(
  store: NormalizedData,
  entity: Entity,
  parentId: string,
  index: number
): NormalizedData {
  return addEntity(store, entity, parentId, index)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- src/interactive-os/__tests__/normalized-store.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/core/normalized-store.ts src/interactive-os/__tests__/normalized-store.test.ts
git commit -m "feat: add normalized store utilities — CRUD operations for entities and relationships"
```

---

## Chunk 3: Command Engine

### Task 4: Command Engine with middleware pipeline

**Files:**
- Create: `src/interactive-os/core/command-engine.ts`
- Test: `src/interactive-os/__tests__/command-engine.test.ts`

- [ ] **Step 1: Write failing tests for command engine**

Create `src/interactive-os/__tests__/command-engine.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { createCommandEngine } from '../core/command-engine'
import { createStore } from '../core/normalized-store'
import type { Command, Middleware, NormalizedData } from '../core/types'

function makeAddCommand(id: string, name: string): Command {
  return {
    type: 'test:add',
    payload: { id, name },
    execute(store) {
      return {
        ...store,
        entities: { ...store.entities, [id]: { id, name } },
      }
    },
    undo(store) {
      const { [id]: _, ...rest } = store.entities
      return { ...store, entities: rest }
    },
  }
}

describe('createCommandEngine', () => {
  it('dispatches a command and updates store', () => {
    const onChange = vi.fn()
    const engine = createCommandEngine(createStore(), [], onChange)

    engine.dispatch(makeAddCommand('a', 'Alpha'))

    expect(engine.getStore().entities['a']).toEqual({ id: 'a', name: 'Alpha' })
    expect(onChange).toHaveBeenCalledOnce()
  })

  it('calls onStoreChange with new store state', () => {
    const onChange = vi.fn()
    const engine = createCommandEngine(createStore(), [], onChange)

    engine.dispatch(makeAddCommand('a', 'Alpha'))

    const newStore = onChange.mock.calls[0]![0] as NormalizedData
    expect(newStore.entities['a']).toEqual({ id: 'a', name: 'Alpha' })
  })

  it('middleware can intercept commands', () => {
    const log: string[] = []
    const logger: Middleware = (next) => (command) => {
      log.push(`before:${command.type}`)
      next(command)
      log.push(`after:${command.type}`)
    }

    const engine = createCommandEngine(createStore(), [logger], vi.fn())
    engine.dispatch(makeAddCommand('a', 'Alpha'))

    expect(log).toEqual(['before:test:add', 'after:test:add'])
  })

  it('middleware can block commands', () => {
    const blocker: Middleware = (_next) => (_command) => {
      // don't call next — command is blocked
    }

    const onChange = vi.fn()
    const engine = createCommandEngine(createStore(), [blocker], onChange)
    engine.dispatch(makeAddCommand('a', 'Alpha'))

    expect(engine.getStore().entities['a']).toBeUndefined()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('middleware chain runs outside-in', () => {
    const order: number[] = []

    const first: Middleware = (next) => (cmd) => {
      order.push(1)
      next(cmd)
    }
    const second: Middleware = (next) => (cmd) => {
      order.push(2)
      next(cmd)
    }

    const engine = createCommandEngine(createStore(), [first, second], vi.fn())
    engine.dispatch(makeAddCommand('a', 'Alpha'))

    expect(order).toEqual([1, 2])
  })

  it('multiple dispatches accumulate state', () => {
    const engine = createCommandEngine(createStore(), [], vi.fn())

    engine.dispatch(makeAddCommand('a', 'Alpha'))
    engine.dispatch(makeAddCommand('b', 'Beta'))

    expect(Object.keys(engine.getStore().entities)).toEqual(['a', 'b'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/interactive-os/__tests__/command-engine.test.ts`
Expected: FAIL — cannot resolve `../core/command-engine`

- [ ] **Step 3: Implement command engine**

Create `src/interactive-os/core/command-engine.ts`:

```ts
import type { Command, Middleware, NormalizedData } from './types'

export interface CommandEngine {
  dispatch(command: Command): void
  getStore(): NormalizedData
}

export function createCommandEngine(
  initialStore: NormalizedData,
  middlewares: Middleware[],
  onStoreChange: (store: NormalizedData) => void
): CommandEngine {
  let store = initialStore

  const executor = (command: Command) => {
    store = command.execute(store)
    onStoreChange(store)
  }

  const chain = middlewares.reduceRight<(command: Command) => void>(
    (next, mw) => mw(next),
    executor
  )

  return {
    dispatch: (command) => chain(command),
    getStore: () => store,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- src/interactive-os/__tests__/command-engine.test.ts`
Expected: PASS (all 6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/core/command-engine.ts src/interactive-os/__tests__/command-engine.test.ts
git commit -m "feat: add command engine with middleware pipeline"
```

---

## Chunk 4: History Plugin

### Task 5: History plugin (undo/redo)

**Files:**
- Create: `src/interactive-os/plugins/history.ts`
- Test: `src/interactive-os/__tests__/plugin-history.test.ts`

- [ ] **Step 1: Write failing tests for history plugin**

Create `src/interactive-os/__tests__/plugin-history.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { createCommandEngine } from '../core/command-engine'
import { createStore } from '../core/normalized-store'
import { history, undoCommand, redoCommand } from '../plugins/history'
import type { Command } from '../core/types'

function makeAddCommand(id: string): Command {
  return {
    type: 'test:add',
    payload: { id },
    execute(store) {
      return {
        ...store,
        entities: { ...store.entities, [id]: { id } },
      }
    },
    undo(store) {
      const { [id]: _, ...rest } = store.entities
      return { ...store, entities: rest }
    },
  }
}

describe('history plugin', () => {
  function setup() {
    const onChange = vi.fn()
    const historyPlugin = history()
    const engine = createCommandEngine(
      createStore(),
      [historyPlugin.middleware!],
      onChange
    )
    return { engine, onChange }
  }

  it('undo reverts last command', () => {
    const { engine } = setup()

    engine.dispatch(makeAddCommand('a'))
    expect(engine.getStore().entities['a']).toBeDefined()

    engine.dispatch(undoCommand())
    expect(engine.getStore().entities['a']).toBeUndefined()
  })

  it('redo re-applies undone command', () => {
    const { engine } = setup()

    engine.dispatch(makeAddCommand('a'))
    engine.dispatch(undoCommand())
    engine.dispatch(redoCommand())

    expect(engine.getStore().entities['a']).toBeDefined()
  })

  it('redo stack is cleared on new command', () => {
    const { engine } = setup()

    engine.dispatch(makeAddCommand('a'))
    engine.dispatch(undoCommand())
    engine.dispatch(makeAddCommand('b'))
    engine.dispatch(redoCommand()) // should be no-op

    expect(engine.getStore().entities['a']).toBeUndefined()
    expect(engine.getStore().entities['b']).toBeDefined()
  })

  it('undo with empty history is no-op', () => {
    const { engine } = setup()
    engine.dispatch(undoCommand()) // should not throw
    expect(Object.keys(engine.getStore().entities)).toHaveLength(0)
  })

  it('multiple undo steps', () => {
    const { engine } = setup()

    engine.dispatch(makeAddCommand('a'))
    engine.dispatch(makeAddCommand('b'))
    engine.dispatch(makeAddCommand('c'))

    engine.dispatch(undoCommand())
    expect(engine.getStore().entities['c']).toBeUndefined()

    engine.dispatch(undoCommand())
    expect(engine.getStore().entities['b']).toBeUndefined()

    engine.dispatch(undoCommand())
    expect(engine.getStore().entities['a']).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/interactive-os/__tests__/plugin-history.test.ts`
Expected: FAIL — cannot resolve `../plugins/history`

- [ ] **Step 3: Implement history plugin**

Create `src/interactive-os/plugins/history.ts`:

```ts
import type { Command, Plugin, NormalizedData } from '../core/types'

export function undoCommand(): Command {
  return {
    type: 'history:undo',
    payload: null,
    execute: (s) => s, // no-op — handled by middleware
    undo: (s) => s,
  }
}

export function redoCommand(): Command {
  return {
    type: 'history:redo',
    payload: null,
    execute: (s) => s,
    undo: (s) => s,
  }
}

export function history(): Plugin {
  const past: Array<{ command: Command; storeBefore: NormalizedData }> = []
  const future: Array<{ command: Command; storeAfter: NormalizedData }> = []

  return {
    middleware: (next) => (command) => {
      if (command.type === 'history:undo') {
        const entry = past.pop()
        if (!entry) return

        // We need access to the engine's store, but middleware doesn't have it.
        // Instead, we stored the storeBefore, so we can undo by re-executing
        // command.undo on the current store.
        // Actually, we just dispatch a synthetic command that sets store to storeBefore.
        const restoreCommand: Command = {
          type: 'history:__restore',
          payload: null,
          execute: () => entry.storeBefore,
          undo: () => entry.storeBefore, // not used
        }
        future.push({
          command: entry.command,
          storeAfter: entry.command.execute(entry.storeBefore),
        })
        next(restoreCommand)
      } else if (command.type === 'history:redo') {
        const entry = future.pop()
        if (!entry) return

        const restoreCommand: Command = {
          type: 'history:__restore',
          payload: null,
          execute: () => entry.storeAfter,
          undo: () => entry.storeAfter,
        }
        past.push({
          command: entry.command,
          storeBefore: entry.command.undo(entry.storeAfter),
        })
        next(restoreCommand)
      } else if (command.type === 'history:__restore') {
        next(command) // let engine apply
      } else {
        // Normal command — snapshot storeBefore, then execute
        // We need the current store. We'll get it after next() via a trick:
        // Capture store state before execution by reading from the engine.
        // But middleware doesn't have engine ref...
        // Solution: use a wrapper that captures pre-state.
        let storeBefore: NormalizedData | null = null

        const wrappedCommand: Command = {
          ...command,
          execute(store) {
            storeBefore = store
            return command.execute(store)
          },
        }

        next(wrappedCommand)

        if (storeBefore !== null) {
          past.push({ command, storeBefore })
          future.length = 0
        }
      }
    },
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- src/interactive-os/__tests__/plugin-history.test.ts`
Expected: PASS (all 5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/plugins/history.ts src/interactive-os/__tests__/plugin-history.test.ts
git commit -m "feat: add history plugin — undo/redo via command stack middleware"
```

---

## Chunk 5: Core Plugin + Integration

### Task 6: Core plugin (focus, selection, expand/collapse)

**Files:**
- Create: `src/interactive-os/plugins/core.ts`
- Test: `src/interactive-os/__tests__/plugin-core.test.ts`

- [ ] **Step 1: Write failing tests for core plugin**

Create `src/interactive-os/__tests__/plugin-core.test.ts`:

```ts
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

    // Manually undo — should restore file1, not delete focus
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

    expect(
      engine.getStore().entities['__selection__']?.selectedIds
    ).toEqual(['file1', 'file2'])
  })

  it('deselects on toggle', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())

    engine.dispatch(selectionCommands.select('file1'))
    engine.dispatch(selectionCommands.toggleSelect('file1'))

    expect(
      engine.getStore().entities['__selection__']?.selectedIds
    ).toEqual([])
  })

  it('clears selection', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())

    engine.dispatch(selectionCommands.select('file1'))
    engine.dispatch(selectionCommands.clearSelection())

    expect(
      engine.getStore().entities['__selection__']?.selectedIds
    ).toEqual([])
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
    expect(
      (engine.getStore().entities['__expanded__']?.expandedIds as string[])?.includes('folder1')
    ).toBe(true)

    engine.dispatch(expandCommands.toggleExpand('folder1'))
    expect(
      (engine.getStore().entities['__expanded__']?.expandedIds as string[])?.includes('folder1')
    ).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/interactive-os/__tests__/plugin-core.test.ts`
Expected: FAIL — cannot resolve `../plugins/core`

- [ ] **Step 3: Implement core plugin**

Create `src/interactive-os/plugins/core.ts`:

```ts
import type { Command, Plugin, NormalizedData } from '../core/types'

const FOCUS_ID = '__focus__'
const SELECTION_ID = '__selection__'
const EXPANDED_ID = '__expanded__'

// --- Focus Commands ---

export const focusCommands = {
  setFocus(nodeId: string): Command {
    let previousFocusedId: string | undefined

    return {
      type: 'core:focus',
      payload: { nodeId },
      execute(store) {
        previousFocusedId = store.entities[FOCUS_ID]?.focusedId as string | undefined
        return {
          ...store,
          entities: {
            ...store.entities,
            [FOCUS_ID]: { id: FOCUS_ID, focusedId: nodeId },
          },
        }
      },
      undo(store) {
        if (previousFocusedId === undefined) {
          const { [FOCUS_ID]: _, ...rest } = store.entities
          return { ...store, entities: rest }
        }
        return {
          ...store,
          entities: {
            ...store.entities,
            [FOCUS_ID]: { id: FOCUS_ID, focusedId: previousFocusedId },
          },
        }
      },
    }
  },
}

// --- Selection Commands ---

function getSelectedIds(store: NormalizedData): string[] {
  return (store.entities[SELECTION_ID]?.selectedIds as string[]) ?? []
}

export const selectionCommands = {
  select(nodeId: string): Command {
    let previousSelectedIds: string[] | undefined

    return {
      type: 'core:select',
      payload: { nodeId },
      execute(store) {
        previousSelectedIds = getSelectedIds(store)
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ID]: { id: SELECTION_ID, selectedIds: [nodeId] },
          },
        }
      },
      undo(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ID]: {
              id: SELECTION_ID,
              selectedIds: previousSelectedIds ?? [],
            },
          },
        }
      },
    }
  },

  toggleSelect(nodeId: string): Command {
    return {
      type: 'core:toggle-select',
      payload: { nodeId },
      execute(store) {
        const current = getSelectedIds(store)
        const selectedIds = current.includes(nodeId)
          ? current.filter((id) => id !== nodeId)
          : [...current, nodeId]
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ID]: { id: SELECTION_ID, selectedIds },
          },
        }
      },
      undo(store) {
        // Toggle is its own inverse
        const current = getSelectedIds(store)
        const selectedIds = current.includes(nodeId)
          ? current.filter((id) => id !== nodeId)
          : [...current, nodeId]
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ID]: { id: SELECTION_ID, selectedIds },
          },
        }
      },
    }
  },

  clearSelection(): Command {
    let previousSelectedIds: string[] | undefined

    return {
      type: 'core:clear-selection',
      payload: null,
      execute(store) {
        previousSelectedIds = getSelectedIds(store)
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ID]: { id: SELECTION_ID, selectedIds: [] },
          },
        }
      },
      undo(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ID]: {
              id: SELECTION_ID,
              selectedIds: previousSelectedIds ?? [],
            },
          },
        }
      },
    }
  },
}

// --- Expand/Collapse Commands ---

function getExpandedIds(store: NormalizedData): string[] {
  return (store.entities[EXPANDED_ID]?.expandedIds as string[]) ?? []
}

export const expandCommands = {
  expand(nodeId: string): Command {
    return {
      type: 'core:expand',
      payload: { nodeId },
      execute(store) {
        const current = getExpandedIds(store)
        if (current.includes(nodeId)) return store
        return {
          ...store,
          entities: {
            ...store.entities,
            [EXPANDED_ID]: {
              id: EXPANDED_ID,
              expandedIds: [...current, nodeId],
            },
          },
        }
      },
      undo(store) {
        const current = getExpandedIds(store)
        return {
          ...store,
          entities: {
            ...store.entities,
            [EXPANDED_ID]: {
              id: EXPANDED_ID,
              expandedIds: current.filter((id) => id !== nodeId),
            },
          },
        }
      },
    }
  },

  collapse(nodeId: string): Command {
    return {
      type: 'core:collapse',
      payload: { nodeId },
      execute(store) {
        const current = getExpandedIds(store)
        return {
          ...store,
          entities: {
            ...store.entities,
            [EXPANDED_ID]: {
              id: EXPANDED_ID,
              expandedIds: current.filter((id) => id !== nodeId),
            },
          },
        }
      },
      undo(store) {
        const current = getExpandedIds(store)
        if (current.includes(nodeId)) return store
        return {
          ...store,
          entities: {
            ...store.entities,
            [EXPANDED_ID]: {
              id: EXPANDED_ID,
              expandedIds: [...current, nodeId],
            },
          },
        }
      },
    }
  },

  toggleExpand(nodeId: string): Command {
    return {
      type: 'core:toggle-expand',
      payload: { nodeId },
      execute(store) {
        const current = getExpandedIds(store)
        const expandedIds = current.includes(nodeId)
          ? current.filter((id) => id !== nodeId)
          : [...current, nodeId]
        return {
          ...store,
          entities: {
            ...store.entities,
            [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds },
          },
        }
      },
      undo(store) {
        const current = getExpandedIds(store)
        const expandedIds = current.includes(nodeId)
          ? current.filter((id) => id !== nodeId)
          : [...current, nodeId]
        return {
          ...store,
          entities: {
            ...store.entities,
            [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds },
          },
        }
      },
    }
  },
}

// --- Core Plugin ---

export function core(): Plugin {
  return {
    commands: {
      focus: focusCommands.setFocus,
      select: selectionCommands.select,
      toggleSelect: selectionCommands.toggleSelect,
      clearSelection: selectionCommands.clearSelection,
      expand: expandCommands.expand,
      collapse: expandCommands.collapse,
      toggleExpand: expandCommands.toggleExpand,
    },
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- src/interactive-os/__tests__/plugin-core.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/plugins/core.ts src/interactive-os/__tests__/plugin-core.test.ts
git commit -m "feat: add core plugin — focus, selection, expand/collapse commands"
```

---

### Task 7: Integration test — full pipeline

**Files:**
- Create: `src/interactive-os/__tests__/integration.test.ts`

- [ ] **Step 1: Write integration test**

Create `src/interactive-os/__tests__/integration.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { createCommandEngine } from '../core/command-engine'
import { createStore, getEntity, getChildren } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import { history, undoCommand, redoCommand } from '../plugins/history'
import { focusCommands, selectionCommands, expandCommands } from '../plugins/core'
import type { Command, Middleware } from '../core/types'

describe('Integration: Store + Engine + Plugins', () => {
  function setup() {
    const onChange = vi.fn()
    const historyPlugin = history()

    const store = createStore({
      entities: {
        src: { id: 'src', name: 'src', type: 'folder' },
        app: { id: 'app', name: 'App.tsx', type: 'file' },
        main: { id: 'main', name: 'main.tsx', type: 'file' },
        lib: { id: 'lib', name: 'lib', type: 'folder' },
        utils: { id: 'utils', name: 'utils.ts', type: 'file' },
      },
      relationships: {
        [ROOT_ID]: ['src', 'lib'],
        src: ['app', 'main'],
        lib: ['utils'],
      },
    })

    const engine = createCommandEngine(
      store,
      [historyPlugin.middleware!],
      onChange
    )

    return { engine, onChange }
  }

  it('focus + expand + select workflow', () => {
    const { engine } = setup()

    engine.dispatch(focusCommands.setFocus('src'))
    engine.dispatch(expandCommands.expand('src'))
    engine.dispatch(selectionCommands.select('app'))

    const store = engine.getStore()
    expect(store.entities['__focus__']?.focusedId).toBe('src')
    expect(
      (store.entities['__expanded__']?.expandedIds as string[])?.includes('src')
    ).toBe(true)
    expect(store.entities['__selection__']?.selectedIds).toEqual(['app'])
  })

  it('undo/redo works with core commands', () => {
    const { engine } = setup()

    engine.dispatch(expandCommands.expand('src'))
    expect(
      (engine.getStore().entities['__expanded__']?.expandedIds as string[])?.includes('src')
    ).toBe(true)

    engine.dispatch(undoCommand())
    expect(
      (engine.getStore().entities['__expanded__']?.expandedIds as string[] | undefined)?.includes('src')
    ).toBeFalsy()

    engine.dispatch(redoCommand())
    expect(
      (engine.getStore().entities['__expanded__']?.expandedIds as string[])?.includes('src')
    ).toBe(true)
  })

  it('permissions middleware blocks commands', () => {
    const onChange = vi.fn()
    const historyPlugin = history()

    const noDeleteRoot: Middleware = (next) => (command) => {
      if (
        command.type === 'core:collapse' &&
        (command.payload as { nodeId: string })?.nodeId === 'src'
      ) {
        return // blocked
      }
      next(command)
    }

    const store = createStore({
      entities: {
        src: { id: 'src', name: 'src' },
      },
      relationships: { [ROOT_ID]: ['src'] },
    })

    const engine = createCommandEngine(
      store,
      [noDeleteRoot, historyPlugin.middleware!],
      onChange
    )

    engine.dispatch(expandCommands.expand('src'))
    engine.dispatch(expandCommands.collapse('src')) // blocked!

    expect(
      (engine.getStore().entities['__expanded__']?.expandedIds as string[])?.includes('src')
    ).toBe(true)
  })

  it('original entity data is preserved through operations', () => {
    const { engine } = setup()

    engine.dispatch(focusCommands.setFocus('src'))
    engine.dispatch(expandCommands.expand('src'))

    // User entities are not affected by internal state entities
    const store = engine.getStore()
    expect(getEntity(store, 'src')).toEqual({ id: 'src', name: 'src', type: 'folder' })
    expect(getEntity(store, 'app')).toEqual({ id: 'app', name: 'App.tsx', type: 'file' })
    expect(getChildren(store, 'src')).toEqual(['app', 'main'])
  })
})
```

- [ ] **Step 2: Run all tests**

Run: `pnpm test`
Expected: ALL PASS — types, normalized-store, command-engine, plugin-history, plugin-core, integration

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/__tests__/integration.test.ts
git commit -m "test: add integration test — full store + engine + plugins pipeline"
```

---

### Task 8: Add getParent performance note

**Files:**
- Modify: `src/interactive-os/core/normalized-store.ts`

- [ ] **Step 1: Add TODO comment to getParent**

Add a comment above `getParent` noting the O(n*m) complexity:

```ts
// TODO: O(n*m) — for large stores, consider adding a reverse index (childId → parentId)
export function getParent(
```

- [ ] **Step 2: Run all tests to confirm nothing is broken**

Run: `pnpm test`
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/core/normalized-store.ts
git commit -m "chore: document getParent performance limitation"
```

---

**Import convention (no barrel exports):**

Consumers import directly from specific modules:

```ts
// Types
import type { Entity, NormalizedData, Command } from './interactive-os/core/types'

// Store utilities
import { createStore, getEntity } from './interactive-os/core/normalized-store'

// Engine
import { createCommandEngine } from './interactive-os/core/command-engine'

// Plugins
import { core } from './interactive-os/plugins/core'
import { history, undoCommand, redoCommand } from './interactive-os/plugins/history'
```

---

## Summary

After completing all 8 tasks, Phase 1 delivers:

| Layer | What | Files |
|-------|------|-------|
| ① Normalized Store | Entity/Relationship CRUD, TransformAdapter type | `core/types.ts`, `core/normalized-store.ts` |
| ② Command Engine | dispatch + middleware pipeline | `core/command-engine.ts` |
| ③ Plugin System | core() + history() plugins | `plugins/core.ts`, `plugins/history.ts` |
| Tests | 5 test files, full coverage | `__tests__/*.test.ts` |
| Imports | Direct module imports (no barrel) | consumers import from specific paths |

**Phase 2** (next plan) will add: Behavior types, treegrid behavior preset, `<Aria>` compound component, `useAria` hook.
