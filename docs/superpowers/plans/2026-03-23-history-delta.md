# History Delta-Based Undo/Redo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace snapshot-based history with delta-based undo/redo. View-only meta changes (focus, selection, expand) are auto-skipped; only content deltas are recorded.

**Architecture:** Upgrade `computeStoreDiff` to track relationship order changes and content entity before/after. Add `applyDelta` to reverse/forward-apply diffs. Replace history middleware to store `StoreDiff[]` instead of full snapshots, using `isContentDelta` to filter.

**Tech Stack:** TypeScript, Vitest, happy-dom

**PRD:** `docs/superpowers/prds/2026-03-23-history-delta-prd.md`

---

### Task 1: Fix computeStoreDiff — relationship order + content entity before/after

**Files:**
- Modify: `src/interactive-os/core/computeStoreDiff.ts`
- Modify: `src/interactive-os/__tests__/dispatch-logger.test.ts`

The current `computeStoreDiff` has two bugs/gaps:
1. Relationship comparison uses Set — misses order changes like `[a,b]` → `[b,a]` (DnD moveUp)
2. Content entity diffs only store the entity id, not the entity object — `applyDelta` needs `before`/`after` entity objects to restore

**Current relationship diff (L89-97):**
```ts
const prevSet = new Set(pArr)
const nextSet = new Set(nArr)
for (const id of nArr) {
  if (!prevSet.has(id)) diffs.push({ path: key, kind: 'added', after: id })
}
for (const id of pArr) {
  if (!nextSet.has(id)) diffs.push({ path: key, kind: 'removed', before: id })
}
```

**Current content entity diff (L37-38, L46-47, L69-70):**
```ts
// added: only stores id
diffs.push({ path: 'entities', kind: 'added', after: id })
// removed: only stores id
diffs.push({ path: 'entities', kind: 'removed', before: id })
// changed: stores id twice
diffs.push({ path: 'entities', kind: 'changed', before: id, after: id })
```

- [ ] **Step 1: Write failing tests for relationship order change**

Add to `dispatch-logger.test.ts` in the `computeStoreDiff` describe block:

```ts
it('detects relationship order change', () => {
  const next = {
    ...base,
    relationships: { __root__: ['item2', 'item1'] },
  }
  const diff = computeStoreDiff(base, next)
  expect(diff).toEqual([
    { path: '__root__', kind: 'changed', before: ['item1', 'item2'], after: ['item2', 'item1'] },
  ])
})
```

- [ ] **Step 2: Write failing test for content entity before/after objects**

Add to `dispatch-logger.test.ts`:

```ts
it('stores full entity object in content entity added diff', () => {
  const next = {
    ...base,
    entities: {
      ...base.entities,
      item3: { id: 'item3', data: { name: 'Item 3' } },
    },
  }
  const diff = computeStoreDiff(base, next)
  expect(diff).toEqual([
    { path: 'entities', kind: 'added', after: { id: 'item3', data: { name: 'Item 3' } } },
  ])
})

it('stores full entity object in content entity removed diff', () => {
  const { item2: removed, ...rest } = base.entities
  const next = { ...base, entities: rest }
  const diff = computeStoreDiff(base, next)
  expect(diff).toEqual([
    { path: 'entities', kind: 'removed', before: { id: 'item2', data: { name: 'Item 2' } } },
  ])
})

it('stores full entity objects in content entity changed diff', () => {
  const next = {
    ...base,
    entities: {
      ...base.entities,
      item1: { id: 'item1', data: { name: 'Updated' } },
    },
  }
  const diff = computeStoreDiff(base, next)
  expect(diff).toEqual([
    { path: 'entities', kind: 'changed', before: { id: 'item1', data: { name: 'Item 1' } }, after: { id: 'item1', data: { name: 'Updated' } } },
  ])
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/interactive-os/__tests__/dispatch-logger.test.ts`
Expected: 4 new tests FAIL (order change returns empty, entity diffs store id not object)

- [ ] **Step 4: Fix computeStoreDiff**

In `computeStoreDiff.ts`:

**Relationship fix (replace L85-98):** Compare arrays for deep equality. If different, emit single `changed` diff with before/after arrays:

```ts
if (!pArr && nArr) {
  diffs.push({ path: key, kind: 'added', after: [...nArr] })
} else if (pArr && !nArr) {
  diffs.push({ path: key, kind: 'removed', before: [...pArr] })
} else if (pArr && nArr) {
  if (pArr.length !== nArr.length || pArr.some((id, i) => id !== nArr[i])) {
    diffs.push({ path: key, kind: 'changed', before: [...pArr], after: [...nArr] })
  }
}
```

**Content entity fix (replace L37-38, L46-47, L69-70):** Store full entity objects:

```ts
// added (L37-38):
diffs.push({ path: 'entities', kind: 'added', after: nextEntity })
// removed (L46-47):
diffs.push({ path: 'entities', kind: 'removed', before: prevEntity })
// changed (L69-70):
diffs.push({ path: 'entities', kind: 'changed', before: prevEntity, after: nextEntity })
```

- [ ] **Step 5: Update existing tests that assert old entity diff format**

The existing test `detects user entity added` (L42-53) expects `after: 'item3'` — update to `after: { id: 'item3', data: { name: 'Item 3' } }`.

Same for `detects user entity removed` (L56-63): `before: 'item2'` → `before: { id: 'item2', data: { name: 'Item 2' } }`.

Same for `detects user entity changed` (L65-77): `before: 'item1', after: 'item1'` → `before: { id: 'item1', data: { name: 'Item 1' } }, after: { id: 'item1', data: { name: 'Updated' } }`.

The existing test `detects relationship added ids` (L79-88) expects per-id diffs — update to expect single `added` with full array:
```ts
expect(diff).toEqual([
  { path: '__root__', kind: 'added', after: ['item1', 'item2', 'item3'] },
])
```

Same for `detects relationship removed ids` (L90-98):
```ts
expect(diff).toEqual([
  { path: '__root__', kind: 'removed', before: ['item1', 'item2'] },
])
```

Wait — these relationship changes are add/remove, not just order. Let's reconsider the relationship diff strategy. For `applyDelta` to work simply, relationships should always store the full before/after arrays when the arrays differ. The kind should be:
- `added`: relationship key didn't exist before → `after: array`
- `removed`: relationship key doesn't exist after → `before: array`
- `changed`: both exist but differ → `before: array, after: array`

Update tests to match this pattern.

- [ ] **Step 6: Update dispatchLogger formatDiff for new diff shapes**

In `dispatchLogger.ts`, the `formatDiff` function (L28-37) currently does `JSON.stringify(d.after)` which works for any value. However, content entity objects will be verbose. Add a summarizer:

```ts
function summarizeValue(val: unknown): string {
  if (val && typeof val === 'object' && 'id' in val) return JSON.stringify((val as { id: string }).id)
  if (Array.isArray(val) && val.length > 5) return `[${val.slice(0, 3).map(v => JSON.stringify(v)).join(', ')}, ...(${val.length})]`
  return JSON.stringify(val)
}
```

Use `summarizeValue` instead of `JSON.stringify` in `formatDiff`.

- [ ] **Step 7: Run all tests to verify**

Run: `npx vitest run src/interactive-os/__tests__/dispatch-logger.test.ts`
Expected: ALL PASS

- [ ] **Step 8: Commit**

```bash
git add src/interactive-os/core/computeStoreDiff.ts src/interactive-os/core/dispatchLogger.ts src/interactive-os/__tests__/dispatch-logger.test.ts
git commit -m "fix: computeStoreDiff — track relationship order + full entity before/after"
```

---

### Task 2: Implement applyDelta

**Files:**
- Modify: `src/interactive-os/core/computeStoreDiff.ts` (add `applyDelta` export)
- Modify: `src/interactive-os/__tests__/dispatch-logger.test.ts` (add `applyDelta` tests)

`applyDelta` takes a store, an array of `StoreDiff`, and a direction (`'forward'` or `'reverse'`). It produces a new store with those diffs applied.

- [ ] **Step 1: Write failing tests for applyDelta**

Add a new describe block in `dispatch-logger.test.ts`:

```ts
describe('applyDelta', () => {
  const base: NormalizedData = {
    entities: {
      __focus__: { id: '__focus__', focusedId: 'a' },
      item1: { id: 'item1', data: { name: 'Item 1' } },
      item2: { id: 'item2', data: { name: 'Item 2' } },
    },
    relationships: { __root__: ['item1', 'item2'] },
  }

  it('reverse: undoes entity add (removes entity)', () => {
    const diff: StoreDiff[] = [
      { path: 'entities', kind: 'added', after: { id: 'item3', data: { name: 'New' } } },
    ]
    const storeWithItem3 = {
      ...base,
      entities: { ...base.entities, item3: { id: 'item3', data: { name: 'New' } } },
    }
    const result = applyDelta(storeWithItem3, diff, 'reverse')
    expect(result.entities['item3']).toBeUndefined()
  })

  it('reverse: undoes entity remove (restores entity)', () => {
    const diff: StoreDiff[] = [
      { path: 'entities', kind: 'removed', before: { id: 'item2', data: { name: 'Item 2' } } },
    ]
    const storeWithoutItem2 = {
      ...base,
      entities: { __focus__: base.entities.__focus__!, item1: base.entities.item1! },
    }
    const result = applyDelta(storeWithoutItem2, diff, 'reverse')
    expect(result.entities['item2']).toEqual({ id: 'item2', data: { name: 'Item 2' } })
  })

  it('reverse: undoes entity change (restores before)', () => {
    const diff: StoreDiff[] = [
      { path: 'entities', kind: 'changed', before: { id: 'item1', data: { name: 'Item 1' } }, after: { id: 'item1', data: { name: 'Updated' } } },
    ]
    const storeUpdated = {
      ...base,
      entities: { ...base.entities, item1: { id: 'item1', data: { name: 'Updated' } } },
    }
    const result = applyDelta(storeUpdated, diff, 'reverse')
    expect(result.entities['item1']).toEqual({ id: 'item1', data: { name: 'Item 1' } })
  })

  it('reverse: undoes relationship change (restores order)', () => {
    const diff: StoreDiff[] = [
      { path: '__root__', kind: 'changed', before: ['item1', 'item2'], after: ['item2', 'item1'] },
    ]
    const reordered = { ...base, relationships: { __root__: ['item2', 'item1'] } }
    const result = applyDelta(reordered, diff, 'reverse')
    expect(result.relationships['__root__']).toEqual(['item1', 'item2'])
  })

  it('reverse: undoes meta field change', () => {
    const diff: StoreDiff[] = [
      { path: '__focus__.focusedId', kind: 'changed', before: 'a', after: 'b' },
    ]
    const focused = {
      ...base,
      entities: { ...base.entities, __focus__: { id: '__focus__', focusedId: 'b' } },
    }
    const result = applyDelta(focused, diff, 'reverse')
    expect((result.entities['__focus__'] as Record<string, unknown>)?.focusedId).toBe('a')
  })

  it('forward: re-applies diffs', () => {
    const diff: StoreDiff[] = [
      { path: 'entities', kind: 'added', after: { id: 'item3', data: { name: 'New' } } },
      { path: '__root__', kind: 'changed', before: ['item1', 'item2'], after: ['item1', 'item2', 'item3'] },
    ]
    const result = applyDelta(base, diff, 'forward')
    expect(result.entities['item3']).toEqual({ id: 'item3', data: { name: 'New' } })
    expect(result.relationships['__root__']).toEqual(['item1', 'item2', 'item3'])
  })

  it('reverse: undoes relationship add (removes key)', () => {
    const diff: StoreDiff[] = [
      { path: 'item3', kind: 'added', after: ['child1'] },
    ]
    const withRel = { ...base, relationships: { ...base.relationships, item3: ['child1'] } }
    const result = applyDelta(withRel, diff, 'reverse')
    expect(result.relationships['item3']).toBeUndefined()
  })

  it('reverse: undoes relationship remove (restores key)', () => {
    const diff: StoreDiff[] = [
      { path: '__root__', kind: 'removed', before: ['item1', 'item2'] },
    ]
    const withoutRoot = { ...base, relationships: {} }
    const result = applyDelta(withoutRoot, diff, 'reverse')
    expect(result.relationships['__root__']).toEqual(['item1', 'item2'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/interactive-os/__tests__/dispatch-logger.test.ts`
Expected: `applyDelta` tests FAIL (function not found)

- [ ] **Step 3: Implement applyDelta**

Add to `computeStoreDiff.ts`:

```ts
export function applyDelta(
  store: NormalizedData,
  diffs: StoreDiff[],
  direction: 'forward' | 'reverse'
): NormalizedData {
  let entities = { ...store.entities }
  let relationships = { ...store.relationships }

  for (const diff of diffs) {
    const value = direction === 'forward' ? diff.after : diff.before
    const antiValue = direction === 'forward' ? diff.before : diff.after
    const effectiveKind = direction === 'forward' ? diff.kind
      : diff.kind === 'added' ? 'removed'
      : diff.kind === 'removed' ? 'added'
      : 'changed'

    // Meta entity field diff (path like "__focus__.focusedId")
    if (diff.path.includes('.')) {
      const [entityId, field] = diff.path.split('.')
      const entity = entities[entityId!] ?? { id: entityId! }
      if (effectiveKind === 'removed') {
        const { [field!]: _, ...rest } = entity
        entities = { ...entities, [entityId!]: { ...rest, id: entityId! } }
      } else {
        entities = { ...entities, [entityId!]: { ...entity, [field!]: value } }
      }
      continue
    }

    // Content entity diff (path === 'entities')
    if (diff.path === 'entities') {
      if (effectiveKind === 'added') {
        const entity = value as Entity
        entities = { ...entities, [entity.id]: entity }
      } else if (effectiveKind === 'removed') {
        const entity = antiValue as Entity
        const { [entity.id]: _, ...rest } = entities
        entities = rest
      } else {
        // changed: replace entity
        const entity = value as Entity
        entities = { ...entities, [entity.id]: entity }
      }
      continue
    }

    // Relationship diff (path is a relationship key like "__root__" or "parent-id")
    if (effectiveKind === 'added') {
      relationships = { ...relationships, [diff.path]: value as string[] }
    } else if (effectiveKind === 'removed') {
      const { [diff.path]: _, ...rest } = relationships
      relationships = rest
    } else {
      // changed: replace array
      relationships = { ...relationships, [diff.path]: value as string[] }
    }
  }

  return { entities, relationships }
}
```

Import `Entity` type at the top of `computeStoreDiff.ts`:
```ts
import type { NormalizedData, Entity } from './types'
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/interactive-os/__tests__/dispatch-logger.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/core/computeStoreDiff.ts src/interactive-os/__tests__/dispatch-logger.test.ts
git commit -m "feat: add applyDelta for forward/reverse store diff application"
```

---

### Task 3: Replace history.ts with delta-based middleware

**Files:**
- Modify: `src/interactive-os/plugins/history.ts`

The history middleware currently stores full `storeBefore: NormalizedData` snapshots. Replace with `StoreDiff[]` deltas. Add `isContentDelta` filter to skip view-only meta changes.

`SKIP_META` IDs: `__focus__`, `__selection__`, `__selection_anchor__`, `__expanded__`, `__grid_col__`, `__spatial_parent__`

- [ ] **Step 1: Rewrite history.ts**

Key design: capture both `storeBefore` and `storeAfter` inside the wrapped execute to avoid re-executing the command.

```ts
import type { Command, Plugin, NormalizedData } from '../core/types'
import { computeStoreDiff, applyDelta } from '../core/computeStoreDiff'
import type { StoreDiff } from '../core/computeStoreDiff'

const SKIP_META = new Set([
  '__focus__',
  '__selection__',
  '__selection_anchor__',
  '__expanded__',
  '__grid_col__',
  '__spatial_parent__',
])

function isContentDelta(diffs: StoreDiff[]): boolean {
  return diffs.some((d) => {
    if (d.path === 'entities') return true
    if (d.path.includes('.')) {
      const entityId = d.path.split('.')[0]!
      return !SKIP_META.has(entityId)
    }
    return !SKIP_META.has(d.path)
  })
}

export function undoCommand(): Command {
  return { type: 'history:undo', payload: null, execute: (s) => s, undo: (s) => s }
}

export function redoCommand(): Command {
  return { type: 'history:redo', payload: null, execute: (s) => s, undo: (s) => s }
}

export const historyCommands = { undo: undoCommand, redo: redoCommand }

export function history(): Plugin {
  const past: StoreDiff[][] = []
  const future: StoreDiff[][] = []

  return {
    middleware: (next) => (command) => {
      if (command.type === 'history:undo') {
        const diffs = past.pop()
        if (!diffs) return
        future.push(diffs)
        next({ type: 'history:__restore', payload: null, execute: (store) => applyDelta(store, diffs, 'reverse'), undo: (s) => s })
      } else if (command.type === 'history:redo') {
        const diffs = future.pop()
        if (!diffs) return
        past.push(diffs)
        next({ type: 'history:__restore', payload: null, execute: (store) => applyDelta(store, diffs, 'forward'), undo: (s) => s })
      } else if (command.type === 'history:__restore') {
        next(command)
      } else {
        let storeBefore: NormalizedData | null = null
        let storeAfter: NormalizedData | null = null

        const wrappedCommand: Command = {
          ...command,
          execute(store) {
            storeBefore = store
            const result = command.execute(store)
            storeAfter = result
            return result
          },
        }

        next(wrappedCommand)

        if (storeBefore !== null && storeAfter !== null) {
          const diffs = computeStoreDiff(storeBefore, storeAfter)
          if (diffs.length > 0 && isContentDelta(diffs)) {
            past.push(diffs)
            future.length = 0
          }
        }
      }
    },
    keyMap: {
      'Mod+Z': () => historyCommands.undo(),
      'Mod+Shift+Z': () => historyCommands.redo(),
    },
  }
}
```

- [ ] **Step 2: Run existing tests to check regression**

Run: `npx vitest run`
Expected: Most tests should pass. The test "Mod+Z undoes expand and restores collapsed state" in `treegrid-keyboard.integration.test.tsx:449` will NOW FAIL because expand is no longer undoable (it's SKIP_META). This is correct new behavior.

- [ ] **Step 3: Update the expand-undo test**

In `src/interactive-os/__tests__/treegrid-keyboard.integration.test.tsx`, change the test "Mod+Z undoes expand and restores collapsed state" to verify the NEW expected behavior: expand is not undoable, Mod+Z on expand-only history is a no-op.

```ts
it('Mod+Z does not undo expand (expand is view state, not content)', async () => {
  const user = userEvent.setup()
  const { container } = renderTree(fixtureData())

  expect(getAllVisibleNodeIds(container)).toEqual(['src', 'lib'])

  // Expand src
  getNodeElement(container, 'src')!.focus()
  await user.keyboard('{ArrowRight}')
  expect(getAllVisibleNodeIds(container)).toContain('app')

  // Mod+Z — expand is view state, nothing to undo
  await user.keyboard('{Control>}z{/Control}')
  // Folder stays expanded — expand is not history content
  expect(getAllVisibleNodeIds(container)).toContain('app')
})
```

- [ ] **Step 4: Update the redo test**

The existing redo test (line 466) tests "expand -> undo -> redo" which will now be all no-ops since expand is SKIP_META. Rewrite to test redo on a content change:

```ts
it('Mod+Shift+Z redoes after undo', async () => {
  const user = userEvent.setup()
  const { container } = render(<StatefulTree />)

  // Delete src (content change)
  getNodeElement(container, 'src')!.focus()
  await user.keyboard('{Delete}')
  expect(getNodeElement(container, 'src')).toBeNull()

  // Undo
  getNodeElement(container, 'lib')!.focus()
  await user.keyboard('{Control>}z{/Control}')
  expect(getNodeElement(container, 'src')).not.toBeNull()

  // Redo
  getNodeElement(container, 'src')!.focus()
  await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}')
  expect(getNodeElement(container, 'src')).toBeNull()
})
```

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/plugins/history.ts src/interactive-os/__tests__/treegrid-keyboard.integration.test.tsx
git commit -m "refactor: history plugin — snapshot to delta-based undo/redo, skip view-only meta"
```

---

### Task 4: Add navigation-skip integration tests

**Files:**
- Modify: `src/interactive-os/__tests__/treegrid-keyboard.integration.test.tsx`

Add tests from PRD ⑧ Verification that verify the core value: focus/selection/expand changes are skipped by undo.

- [ ] **Step 1: Add navigation-skip tests**

Add to the `undo scenarios` describe block:

```ts
it('Mod+Z skips focus-only changes and undoes content change (V1/V9)', async () => {
  const user = userEvent.setup()
  const { container } = render(<StatefulTree />)

  // Focus src, expand, navigate to app (3 focus changes)
  getNodeElement(container, 'src')!.focus()
  await user.keyboard('{ArrowRight}') // expand
  await user.keyboard('{ArrowRight}') // focus app
  await user.keyboard('{ArrowDown}') // focus main

  expect(getFocusedNodeId(container)).toBe('main')

  // Delete main (content change)
  await user.keyboard('{Delete}')
  expect(getNodeElement(container, 'main')).toBeNull()

  // Mod+Z — should undo delete, skipping all focus moves
  await user.keyboard('{Control>}z{/Control}')
  expect(getNodeElement(container, 'main')).not.toBeNull()
})

it('Mod+Z after only focus/selection changes is no-op (V6)', async () => {
  const user = userEvent.setup()
  const { container } = render(<StatefulTree />)

  const visibleBefore = getAllVisibleNodeIds(container)

  // Focus moves + selection (all view state)
  getNodeElement(container, 'src')!.focus()
  await user.keyboard('{ArrowDown}') // focus lib
  await user.keyboard('{ }') // select lib

  // Mod+Z — nothing to undo (focus and selection are view state)
  await user.keyboard('{Control>}z{/Control}')
  expect(getAllVisibleNodeIds(container)).toEqual(visibleBefore)
})

it('undo then new command clears redo future (V7/E4)', async () => {
  const user = userEvent.setup()
  const { container } = render(<StatefulTree />)

  // Delete src
  getNodeElement(container, 'src')!.focus()
  await user.keyboard('{Delete}')
  expect(getNodeElement(container, 'src')).toBeNull()

  // Undo
  getNodeElement(container, 'lib')!.focus()
  await user.keyboard('{Control>}z{/Control}')
  expect(getNodeElement(container, 'src')).not.toBeNull()

  // New command (delete lib) — should clear redo future
  getNodeElement(container, 'lib')!.focus()
  await user.keyboard('{Delete}')
  expect(getNodeElement(container, 'lib')).toBeNull()

  // Redo should NOT restore src deletion — future was cleared
  await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}')
  expect(getNodeElement(container, 'src')).not.toBeNull()
})

it('expand then delete — undo restores file, folder stays expanded (V4)', async () => {
  const user = userEvent.setup()
  const { container } = render(<StatefulTree />)

  // Expand src
  getNodeElement(container, 'src')!.focus()
  await user.keyboard('{ArrowRight}') // expand
  await user.keyboard('{ArrowRight}') // focus app

  // Delete app
  await user.keyboard('{Delete}')
  expect(getNodeElement(container, 'app')).toBeNull()

  // Undo — file restored, folder stays expanded
  await user.keyboard('{Control>}z{/Control}')
  expect(getNodeElement(container, 'app')).not.toBeNull()
  expect(getAllVisibleNodeIds(container)).toContain('app')
  expect(getAllVisibleNodeIds(container)).toContain('main')
})
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/interactive-os/__tests__/treegrid-keyboard.integration.test.tsx`
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/__tests__/treegrid-keyboard.integration.test.tsx
git commit -m "test: add navigation-skip undo integration tests"
```

---

### Task 5: Verify all existing tests pass (full regression)

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS (618+ tests)

Key tests to watch:
- `treegrid-keyboard.integration.test.tsx` — undo scenarios (updated)
- `kanban-keyboard.integration.test.tsx` — Mod+Z undoes cross-column move (DnD)
- `slider-keyboard.integration.test.tsx` — Mod+Z restores previous value
- `dispatch-logger.test.ts` — computeStoreDiff + applyDelta

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Run lint**

Run: `npx eslint src/interactive-os/core/computeStoreDiff.ts src/interactive-os/plugins/history.ts src/interactive-os/core/dispatchLogger.ts`
Expected: 0 errors
