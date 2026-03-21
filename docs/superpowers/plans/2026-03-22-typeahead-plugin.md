# Typeahead Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add APG-standard typeahead (type-a-character) to the interactive-os plugin system so any list/tree/grid can support character-based focus jumping.

**Architecture:** Three layers of change: (1) extend Plugin interface with `onUnhandledKey`, (2) create `typeahead.ts` plugin with pure search logic + per-instance buffer in closure, (3) wire the fallback into useAria's three onKeyDown sites. Pure search function is tested via unit tests; full keyboard flow via integration tests using ListBox.

**Tech Stack:** TypeScript, React, Vitest, @testing-library/react, @testing-library/user-event

**PRD:** `docs/superpowers/specs/2026-03-22-typeahead-plugin-prd.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/interactive-os/core/types.ts` | Modify:47-53 | Add `onUnhandledKey` to Plugin interface |
| `src/interactive-os/plugins/typeahead.ts` | Create | Pure search logic (`findTypeaheadMatch`) + plugin factory (`typeahead()`) |
| `src/interactive-os/hooks/useAria.ts` | Modify:303-314, 326-335, 342-354 | Wire onUnhandledKey fallback into 3 onKeyDown sites |
| `src/interactive-os/__tests__/typeahead.test.ts` | Create | Unit tests for `findTypeaheadMatch` pure function |
| `src/interactive-os/__tests__/typeahead-keyboard.integration.test.tsx` | Create | Integration tests: user.keyboard → DOM focus verification |

---

### Task 1: Extend Plugin interface with onUnhandledKey

**Files:**
- Modify: `src/interactive-os/core/types.ts:47-53`

- [ ] **Step 1: Add onUnhandledKey to Plugin interface**

In `src/interactive-os/core/types.ts`, add the optional property to Plugin:

```typescript
export interface Plugin {
  middleware?: Middleware
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  commands?: Record<string, (...args: any[]) => Command>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyMap?: Record<string, (ctx: any) => Command | void>
  /** Fallback handler for keyboard events not matched by keyMap.
   *  Receives the raw KeyboardEvent. Return true to preventDefault. */
  onUnhandledKey?: (event: KeyboardEvent, engine: CommandEngine) => boolean
}
```

Note: `CommandEngine` import is needed. Add:
```typescript
import type { CommandEngine } from './createCommandEngine'
```

- [ ] **Step 2: Verify existing tests still pass**

Run: `pnpm vitest run src/interactive-os/__tests__/ --reporter=verbose 2>&1 | tail -5`
Expected: All existing tests pass (optional property, no breaking change)

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/core/types.ts
git commit -m "feat(os): add onUnhandledKey to Plugin interface"
```

---

### Task 2: Write pure search function with unit tests (RED → GREEN)

**Files:**
- Create: `src/interactive-os/__tests__/typeahead.test.ts`
- Create: `src/interactive-os/plugins/typeahead.ts`

- [ ] **Step 1: Write failing unit tests for findTypeaheadMatch**

Create `src/interactive-os/__tests__/typeahead.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { findTypeaheadMatch, isPrintableKey } from '../plugins/typeahead'

describe('isPrintableKey', () => {
  function makeEvent(overrides: Partial<KeyboardEvent>): KeyboardEvent {
    return { key: 'a', ctrlKey: false, metaKey: false, altKey: false, isComposing: false, ...overrides } as KeyboardEvent
  }

  it('returns true for single printable char without modifiers', () => {
    expect(isPrintableKey(makeEvent({ key: 'a' }))).toBe(true)
  })

  it('returns false for modifier combos (F4)', () => {
    expect(isPrintableKey(makeEvent({ key: 'a', ctrlKey: true }))).toBe(false)
    expect(isPrintableKey(makeEvent({ key: 'a', metaKey: true }))).toBe(false)
    expect(isPrintableKey(makeEvent({ key: 'a', altKey: true }))).toBe(false)
  })

  it('returns false during IME composing (F3/V8)', () => {
    expect(isPrintableKey(makeEvent({ key: 'a', isComposing: true }))).toBe(false)
  })

  it('returns false for non-single-char keys', () => {
    expect(isPrintableKey(makeEvent({ key: 'ArrowDown' }))).toBe(false)
    expect(isPrintableKey(makeEvent({ key: 'Enter' }))).toBe(false)
    expect(isPrintableKey(makeEvent({ key: 'Escape' }))).toBe(false)
  })

  it('returns true for numbers and special chars', () => {
    expect(isPrintableKey(makeEvent({ key: '1' }))).toBe(true)
    expect(isPrintableKey(makeEvent({ key: '.' }))).toBe(true)
  })
})

describe('findTypeaheadMatch', () => {
  const nodes = [
    { id: 'apple', label: 'Apple' },
    { id: 'banana', label: 'Banana' },
    { id: 'blueberry', label: 'Blueberry' },
    { id: 'cherry', label: 'Cherry' },
    { id: 'date', label: 'Date' },
  ]

  it('finds first item matching single character', () => {
    const result = findTypeaheadMatch(nodes, 'b', '')
    expect(result).toBe('banana')
  })

  it('is case-insensitive', () => {
    const result = findTypeaheadMatch(nodes, 'B', '')
    expect(result).toBe('banana')
  })

  it('multi-char narrows search', () => {
    const result = findTypeaheadMatch(nodes, 'bl', '')
    expect(result).toBe('blueberry')
  })

  it('cycles to next match when searching from current focus', () => {
    // currently on banana, searching "b" → should find blueberry
    const result = findTypeaheadMatch(nodes, 'b', 'banana')
    expect(result).toBe('blueberry')
  })

  it('wraps around to beginning when no match after current', () => {
    // currently on blueberry, searching "b" → wraps to banana
    const result = findTypeaheadMatch(nodes, 'b', 'blueberry')
    expect(result).toBe('banana')
  })

  it('returns null when no match found', () => {
    const result = findTypeaheadMatch(nodes, 'z', '')
    expect(result).toBeNull()
  })

  it('returns null for empty nodes list', () => {
    const result = findTypeaheadMatch([], 'a', '')
    expect(result).toBeNull()
  })

  it('skips nodes with empty labels', () => {
    const withEmpty = [
      { id: 'no-label', label: '' },
      { id: 'banana', label: 'Banana' },
    ]
    const result = findTypeaheadMatch(withEmpty, 'b', '')
    expect(result).toBe('banana')
  })

  it('matches numbers', () => {
    const withNumbers = [{ id: 'item1', label: '123 File' }]
    const result = findTypeaheadMatch(withNumbers, '1', '')
    expect(result).toBe('item1')
  })

  it('stays on current if only match and single char buffer', () => {
    const single = [{ id: 'banana', label: 'Banana' }]
    const result = findTypeaheadMatch(single, 'b', 'banana')
    expect(result).toBe('banana')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/interactive-os/__tests__/typeahead.test.ts --reporter=verbose 2>&1 | tail -5`
Expected: FAIL — `findTypeaheadMatch` does not exist

- [ ] **Step 3: Implement findTypeaheadMatch and typeahead plugin**

Create `src/interactive-os/plugins/typeahead.ts`:

```typescript
import type { Entity, Plugin } from '../core/types'
import { ROOT_ID } from '../core/types'
import type { CommandEngine } from '../core/createCommandEngine'
import { focusCommands, FOCUS_ID, EXPANDED_ID } from './core'

export type GetLabelFn = (entity: Entity) => string

export interface TypeaheadNode {
  id: string
  label: string
}

/**
 * Pure function: find the best typeahead match.
 *
 * Search strategy:
 * - Case-insensitive prefix match against buffer
 * - Start searching from the node AFTER currentFocusId (wrap-around)
 * - If buffer is multi-char, search from beginning (not cycling)
 */
export function findTypeaheadMatch(
  nodes: TypeaheadNode[],
  buffer: string,
  currentFocusId: string,
): string | null {
  if (nodes.length === 0 || buffer.length === 0) return null

  const search = buffer.toLowerCase()
  const isMultiChar = search.length > 1

  // For multi-char buffer, search from the start (narrowing, not cycling)
  // For single-char, search from AFTER current focus (cycling behavior)
  let startIdx = 0
  if (!isMultiChar && currentFocusId) {
    const currentIdx = nodes.findIndex((n) => n.id === currentFocusId)
    if (currentIdx >= 0) startIdx = currentIdx + 1
  }

  for (let i = 0; i < nodes.length; i++) {
    const idx = (startIdx + i) % nodes.length
    const node = nodes[idx]!
    if (node.label && node.label.toLowerCase().startsWith(search)) {
      return node.id
    }
  }

  return null
}

export function isPrintableKey(event: KeyboardEvent): boolean {
  if (event.key.length !== 1) return false
  if (event.ctrlKey || event.metaKey || event.altKey) return false
  if (event.isComposing) return false
  return true
}

const DEFAULT_TIMEOUT = 500

export interface TypeaheadOptions {
  getLabel: GetLabelFn
  timeout?: number
}

// Per-instance state holder for resetTypeahead access in tests
let activeReset: (() => void) | null = null

/** Reset the active typeahead buffer — use in tests to isolate state between cases */
export function resetTypeahead(): void {
  activeReset?.()
}

export function typeahead(options: TypeaheadOptions): Plugin {
  const { getLabel, timeout = DEFAULT_TIMEOUT } = options

  // Per-instance state (NOT module-level) — each typeahead() call gets its own buffer
  let buffer = ''
  let timer: ReturnType<typeof setTimeout> | null = null

  const reset = () => {
    buffer = ''
    if (timer) clearTimeout(timer)
    timer = null
  }

  // Register as active instance for resetTypeahead()
  activeReset = reset

  return {
    onUnhandledKey(event: KeyboardEvent, engine: CommandEngine): boolean {
      if (!isPrintableKey(event)) return false

      // Accumulate buffer
      buffer += event.key.toLowerCase()

      // Reset timer
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        buffer = ''
        timer = null
      }, timeout)

      // Build searchable node list from visible entities
      const store = engine.getStore()
      const focusedId = (store.entities[FOCUS_ID]?.focusedId as string) ?? ''

      // Get visible nodes (non-meta entities that exist in relationships)
      const nodes: TypeaheadNode[] = []
      const collectVisible = (parentId: string) => {
        const children = store.relationships[parentId] ?? []
        for (const childId of children) {
          const entity = store.entities[childId]
          if (entity && !childId.startsWith('__')) {
            nodes.push({ id: childId, label: getLabel(entity) })
          }
          // Descend into expanded nodes only
          const expandedIds = (store.entities[EXPANDED_ID]?.expandedIds as string[]) ?? []
          if (expandedIds.includes(childId)) {
            collectVisible(childId)
          }
        }
      }
      collectVisible(ROOT_ID)

      const matchId = findTypeaheadMatch(nodes, buffer, focusedId)
      if (matchId && matchId !== focusedId) {
        engine.dispatch(focusCommands.setFocus(matchId))
      }

      return true // always consume printable chars to prevent browser default
    },
  }
}
```

- [ ] **Step 4: Run unit tests to verify they pass**

Run: `pnpm vitest run src/interactive-os/__tests__/typeahead.test.ts --reporter=verbose 2>&1 | tail -5`
Expected: All 10 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/plugins/typeahead.ts src/interactive-os/__tests__/typeahead.test.ts
git commit -m "feat(os): add typeahead plugin with pure search function"
```

---

### Task 3: Wire onUnhandledKey into useAria's onKeyDown

**Files:**
- Modify: `src/interactive-os/hooks/useAria.ts:148-163, 303-314, 326-335, 342-354`

- [ ] **Step 1: Collect onUnhandledKey handlers from plugins**

In `useAria.ts`, after the `pluginKeyMaps` memo (around line 148), add a memo for onUnhandledKey handlers:

```typescript
const pluginUnhandledKeyHandlers = useMemo(
  () => {
    if (!plugins.length) return undefined
    const handlers = plugins
      .map((p) => p.onUnhandledKey)
      .filter((h): h is NonNullable<typeof h> => h != null)
    return handlers.length > 0 ? handlers : undefined
  },
  [plugins],
)
```

- [ ] **Step 2: Add fallback to roving tabindex onKeyDown (line ~303)**

In `getNodeProps`, change the onKeyDown handler. After `if (!matchedKey) return`, replace `return` with the fallback:

```typescript
baseProps.onKeyDown = (event: KeyboardEvent) => {
  if (event.defaultPrevented) return
  if (event.target !== event.currentTarget) return
  const matchedKey = findMatchingKey(event, mergedKeyMap)
  if (matchedKey) {
    const ctx = createBehaviorContext(engine, behaviorCtxOptions)
    const handler = mergedKeyMap[matchedKey]
    if (!handler) return
    const handled = dispatchKeyAction(ctx, handler, engine, onActivateRef.current)
    if (handled) event.preventDefault()
  } else if (pluginUnhandledKeyHandlers) {
    for (const handler of pluginUnhandledKeyHandlers) {
      if (handler(event, engine)) {
        event.preventDefault()
        break
      }
    }
  }
}
```

- [ ] **Step 3: Add fallback to keyMap-only onKeyDown (line ~326)**

Same pattern in the isKeyMapOnly branch of `containerProps`:

```typescript
onKeyDown: (event: KeyboardEvent) => {
  if (event.defaultPrevented) return
  const matchedKey = findMatchingKey(event, mergedKeyMap)
  if (matchedKey) {
    const ctx = createBehaviorContext(engine, behaviorCtxOptions)
    const handler = mergedKeyMap[matchedKey]
    if (!handler) return
    const handled = dispatchKeyAction(ctx, handler, engine, onActivateRef.current)
    if (handled) event.preventDefault()
  } else if (pluginUnhandledKeyHandlers) {
    for (const handler of pluginUnhandledKeyHandlers) {
      if (handler(event, engine)) {
        event.preventDefault()
        break
      }
    }
  }
},
```

- [ ] **Step 4: Add fallback to aria-activedescendant onKeyDown (line ~342)**

Same pattern:

```typescript
onKeyDown: (event: KeyboardEvent) => {
  if (event.defaultPrevented) return
  if (event.target !== event.currentTarget && isEditableElement(event.target as Element)) return
  const matchedKey = findMatchingKey(event, mergedKeyMap)
  if (matchedKey) {
    const ctx = createBehaviorContext(engine, behaviorCtxOptions)
    const handler = mergedKeyMap[matchedKey]
    if (!handler) return
    const handled = dispatchKeyAction(ctx, handler, engine, onActivateRef.current)
    if (handled) event.preventDefault()
  } else if (pluginUnhandledKeyHandlers) {
    for (const handler of pluginUnhandledKeyHandlers) {
      if (handler(event, engine)) {
        event.preventDefault()
        break
      }
    }
  }
},
```

- [ ] **Step 5: Add pluginUnhandledKeyHandlers to dependency arrays**

Update the dependency arrays of `getNodeProps` (line ~319) and `containerProps` (line ~355) to include `pluginUnhandledKeyHandlers`.

- [ ] **Step 6: Verify existing tests still pass**

Run: `pnpm vitest run src/interactive-os/__tests__/ --reporter=verbose 2>&1 | tail -10`
Expected: All existing tests pass

- [ ] **Step 7: Commit**

```bash
git add src/interactive-os/hooks/useAria.ts
git commit -m "feat(os): wire onUnhandledKey fallback into useAria onKeyDown"
```

---

### Task 4: Integration tests — keyboard → DOM focus verification

**Files:**
- Create: `src/interactive-os/__tests__/typeahead-keyboard.integration.test.tsx`

- [ ] **Step 1: Write integration tests**

Create `src/interactive-os/__tests__/typeahead-keyboard.integration.test.tsx`:

```tsx
/**
 * Integration test: Typeahead keyboard interactions
 *
 * Tests the full user flow: render ListBox → keyboard input → focus moves to matching item.
 * Follows project convention: userEvent → DOM/ARIA state verification.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListBox } from '../ui/ListBox'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData, Entity } from '../core/types'
import { core } from '../plugins/core'
import { typeahead, resetTypeahead } from '../plugins/typeahead'
import type { NodeState } from '../behaviors/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      apple: { id: 'apple', data: { name: 'Apple' } },
      banana: { id: 'banana', data: { name: 'Banana' } },
      blueberry: { id: 'blueberry', data: { name: 'Blueberry' } },
      cherry: { id: 'cherry', data: { name: 'Cherry' } },
      date: { id: 'date', data: { name: 'Date' } },
    },
    relationships: {
      [ROOT_ID]: ['apple', 'banana', 'blueberry', 'cherry', 'date'],
    },
  })
}

const getLabel = (entity: Entity) =>
  (entity.data as Record<string, unknown>)?.name as string ?? ''

function renderListBox(data: NormalizedData) {
  return render(
    <ListBox
      data={data}
      plugins={[core(), typeahead({ getLabel })]}
      renderItem={(item, state: NodeState) => (
        <span>{(item.data as Record<string, unknown>)?.name as string}</span>
      )}
    />
  )
}

function getFocusedNodeId(container: HTMLElement): string | null {
  const focused = container.querySelector('[tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

function getNodeElement(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

describe('Typeahead keyboard integration', () => {
  beforeEach(() => {
    resetTypeahead()
  })

  // V1: M1 — single character typeahead
  it('typing "b" moves focus to first B item', async () => {
    const user = userEvent.setup()
    const { container } = renderListBox(fixtureData())

    getNodeElement(container, 'apple')!.focus()
    expect(getFocusedNodeId(container)).toBe('apple')

    await user.keyboard('b')
    expect(getFocusedNodeId(container)).toBe('banana')
  })

  // V7: E4 — case insensitive
  it('typing "B" (uppercase) also matches "Banana"', async () => {
    const user = userEvent.setup()
    const { container } = renderListBox(fixtureData())

    getNodeElement(container, 'apple')!.focus()
    await user.keyboard('B')
    expect(getFocusedNodeId(container)).toBe('banana')
  })

  // V2: M2 — multi-char typeahead
  it('typing "bl" quickly narrows to "Blueberry"', async () => {
    const user = userEvent.setup()
    const { container } = renderListBox(fixtureData())

    getNodeElement(container, 'apple')!.focus()
    await user.keyboard('b')
    expect(getFocusedNodeId(container)).toBe('banana')

    await user.keyboard('l')
    expect(getFocusedNodeId(container)).toBe('blueberry')
  })

  // V5: M5 — no match
  it('typing "z" with no match does not move focus', async () => {
    const user = userEvent.setup()
    const { container } = renderListBox(fixtureData())

    getNodeElement(container, 'apple')!.focus()
    await user.keyboard('z')
    expect(getFocusedNodeId(container)).toBe('apple')
  })

  // V9: E9 — wrap-around
  it('typing same character cycles through matches', async () => {
    const user = userEvent.setup()
    const { container } = renderListBox(fixtureData())

    getNodeElement(container, 'apple')!.focus()

    // First "b" → banana
    await user.keyboard('b')
    expect(getFocusedNodeId(container)).toBe('banana')

    // Wait for buffer reset (simulate by resetting manually)
    resetTypeahead()

    // Second "b" from banana → blueberry
    await user.keyboard('b')
    expect(getFocusedNodeId(container)).toBe('blueberry')

    resetTypeahead()

    // Third "b" from blueberry → wraps to banana
    await user.keyboard('b')
    expect(getFocusedNodeId(container)).toBe('banana')
  })

  // V3: M3 — timer-based buffer reset
  it('buffer resets after timeout, next same-char cycles', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { container } = renderListBox(fixtureData())

    getNodeElement(container, 'apple')!.focus()

    // First "b" → banana
    await user.keyboard('b')
    expect(getFocusedNodeId(container)).toBe('banana')

    // Advance past timeout
    vi.advanceTimersByTime(600)

    // Second "b" from banana → blueberry (buffer was reset)
    await user.keyboard('b')
    expect(getFocusedNodeId(container)).toBe('blueberry')

    vi.useRealTimers()
  })

  // V4: M4 — rename mode blocks typeahead
  it('typeahead does not fire during rename mode', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <ListBox
        data={fixtureData()}
        plugins={[core(), typeahead({ getLabel })]}
        enableEditing
        renderItem={(item, state: NodeState) => (
          <span>{(item.data as Record<string, unknown>)?.name as string}</span>
        )}
      />
    )

    getNodeElement(container, 'apple')!.focus()
    expect(getFocusedNodeId(container)).toBe('apple')

    // Enter rename mode (F2 key)
    await user.keyboard('{F2}')

    // Type a character — should go to contenteditable, NOT trigger typeahead
    await user.keyboard('b')

    // Focus should still be on apple (rename mode, not typeahead)
    expect(getFocusedNodeId(container)).toBe('apple')
  })

  // V6: E1 — empty list
  it('typing in empty list does nothing', async () => {
    const user = userEvent.setup()
    const emptyData = createStore({
      entities: {},
      relationships: { [ROOT_ID]: [] },
    })

    const { container } = render(
      <ListBox
        data={emptyData}
        plugins={[core(), typeahead({ getLabel })]}
      />
    )

    // No focusable items, so nothing to test beyond no crash
    expect(container.querySelector('[tabindex="0"]')).toBeNull()
  })
})
```

- [ ] **Step 2: Run integration tests to verify they pass**

Run: `pnpm vitest run src/interactive-os/__tests__/typeahead-keyboard.integration.test.tsx --reporter=verbose 2>&1 | tail -10`
Expected: All tests PASS

- [ ] **Step 3: Run full test suite to check for regressions**

Run: `pnpm vitest run src/interactive-os/__tests__/ --reporter=verbose 2>&1 | tail -10`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/interactive-os/__tests__/typeahead-keyboard.integration.test.tsx
git commit -m "test(os): add typeahead integration tests"
```

---

### Task 5: Update Area docs and PROGRESS.md

**Files:**
- Modify: `docs/2-areas/plugins.mdx`
- Create: `docs/2-areas/plugins/typeahead.mdx`
- Modify: `docs/PROGRESS.md`

- [ ] **Step 1: Create typeahead Area doc**

Create `docs/2-areas/plugins/typeahead.mdx` following the pattern of existing plugin docs (see `docs/2-areas/plugins/clipboard.mdx` for reference).

Key content:
- Commands: none (typeahead doesn't add commands to the engine)
- Mechanism: `onUnhandledKey` — keyMap fallback for printable characters
- Options: `getLabel(entity) → string`, `timeout? = 500ms`
- Exports: `findTypeaheadMatch`, `resetTypeahead`, `typeahead`
- Dependencies: core (focusCommands)
- Design: per-instance buffer in closure (unlike clipboard which shares), no store state (F2 금지)

- [ ] **Step 2: Add typeahead to plugins.mdx overview**

Add `typeahead` to the plugin list in `docs/2-areas/plugins.mdx`.

- [ ] **Step 3: Update PROGRESS.md**

Add typeahead plugin entry to the plugins section.

- [ ] **Step 4: Commit**

```bash
git add docs/2-areas/plugins/typeahead.mdx docs/2-areas/plugins.mdx docs/PROGRESS.md
git commit -m "docs: add typeahead plugin Area doc and update PROGRESS"
```
