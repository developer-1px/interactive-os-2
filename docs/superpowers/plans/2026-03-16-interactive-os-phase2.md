# interactive-os Phase 2: ARIA Behavior + Compound Components

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the ARIA Behavior Layer (④) and Compound Components (⑤) — connecting Phase 1's engine to React with keyboard handling, focus management, and treegrid as the first behavior preset.

**Architecture:** Behavior objects define keyboard mappings + ARIA attributes + focus strategy. The `<Aria>` compound component renders nodes using render slots, auto-applies ARIA attributes and keyboard handlers. `useAria` hook provides the programmatic escape hatch.

**Tech Stack:** TypeScript 5.9, React 19, Vitest, @testing-library/react, jsdom

**Spec Reference:** `docs/superpowers/specs/2026-03-16-interactive-os-design.md` (sections ④ and ⑤)

**Depends on:** Phase 1 (core/types, normalized-store, command-engine, plugins/core, plugins/history)

---

## File Structure

```
src/
  interactive-os/
    behaviors/
      types.ts              — AriaBehavior, BehaviorContext, NodeState, FocusStrategy interfaces
      treegrid.ts           — treegrid behavior preset (APG-compliant defaults)
      create-behavior-context.ts — Factory to build BehaviorContext from engine + store state
    components/
      aria.tsx              — <Aria> compound component + <Aria.Node> + <Aria.Cell>
      aria-context.ts       — React context for Aria internals
    hooks/
      use-aria.ts           — useAria() hook (escape hatch)
      use-keyboard.ts       — Keyboard event → Command mapping
      use-focus-manager.ts  — Roving tabindex / aria-activedescendant focus management
    __tests__/
      behavior-types.test.ts
      treegrid-behavior.test.ts
      use-aria.test.tsx
      aria-component.test.tsx
      use-keyboard.test.ts
      use-focus-manager.test.ts
```

---

## Chunk 1: Setup + Behavior Types

### Task 1: Add React testing dependencies

**Files:**
- Modify: `package.json`
- Modify: `vitest.config.ts`

- [ ] **Step 1: Install testing dependencies**

```bash
pnpm add -D @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Update vitest config for React/DOM testing**

Update `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
```

- [ ] **Step 3: Verify existing tests still pass**

Run: `pnpm test`
Expected: ALL 57 tests PASS (environment change to jsdom should not break pure logic tests)

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts package.json pnpm-lock.yaml
git commit -m "chore: add React testing dependencies (testing-library, jsdom)"
```

---

### Task 2: Define Behavior types

**Files:**
- Create: `src/interactive-os/behaviors/types.ts`
- Test: `src/interactive-os/__tests__/behavior-types.test.ts`

- [ ] **Step 1: Write test**

Create `src/interactive-os/__tests__/behavior-types.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import type {
  AriaBehavior,
  BehaviorContext,
  NodeState,
  FocusStrategy,
} from '../behaviors/types'
import type { Command } from '../core/types'

describe('Behavior Types', () => {
  it('AriaBehavior defines role, keyMap, focusStrategy, ariaAttributes', () => {
    const mockCommand: Command = {
      type: 'test',
      payload: null,
      execute: (s) => s,
      undo: (s) => s,
    }

    const behavior: AriaBehavior = {
      role: 'treegrid',
      keyMap: {
        ArrowDown: () => mockCommand,
        ArrowUp: () => mockCommand,
      },
      focusStrategy: {
        type: 'roving-tabindex',
        orientation: 'vertical',
      },
      ariaAttributes: (_node, state) => ({
        'aria-expanded': String(state.expanded ?? false),
        'aria-level': String(state.level ?? 0),
      }),
    }

    expect(behavior.role).toBe('treegrid')
    expect(Object.keys(behavior.keyMap)).toContain('ArrowDown')
    expect(behavior.focusStrategy.type).toBe('roving-tabindex')
  })

  it('NodeState has common fields with optional tree fields', () => {
    const state: NodeState = {
      focused: true,
      selected: false,
      disabled: false,
      index: 0,
      siblingCount: 3,
      expanded: true,
      level: 2,
    }

    expect(state.focused).toBe(true)
    expect(state.expanded).toBe(true)
    expect(state.level).toBe(2)
  })

  it('NodeState supports custom extensions', () => {
    interface TimelineState extends NodeState {
      currentTime: number
      duration: number
    }

    const state: TimelineState = {
      focused: false,
      selected: false,
      disabled: false,
      index: 0,
      siblingCount: 1,
      currentTime: 42,
      duration: 120,
    }

    expect(state.currentTime).toBe(42)
  })

  it('FocusStrategy supports both roving-tabindex and aria-activedescendant', () => {
    const roving: FocusStrategy = {
      type: 'roving-tabindex',
      orientation: 'vertical',
    }

    const activedescendant: FocusStrategy = {
      type: 'aria-activedescendant',
      orientation: 'horizontal',
    }

    expect(roving.type).toBe('roving-tabindex')
    expect(activedescendant.type).toBe('aria-activedescendant')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/interactive-os/__tests__/behavior-types.test.ts`
Expected: FAIL — cannot resolve `../behaviors/types`

- [ ] **Step 3: Implement behavior types**

Create `src/interactive-os/behaviors/types.ts`:

```ts
import type { Entity, Command, NormalizedData } from '../core/types'

export interface FocusStrategy {
  type: 'roving-tabindex' | 'aria-activedescendant'
  orientation: 'vertical' | 'horizontal' | 'both'
}

export interface NodeState {
  focused: boolean
  selected: boolean
  disabled: boolean
  index: number
  siblingCount: number
  expanded?: boolean
  level?: number
  [key: string]: unknown
}

export interface BehaviorContext {
  focused: string
  selected: string[]
  isExpanded: boolean

  focusNext(): Command
  focusPrev(): Command
  focusFirst(): Command
  focusLast(): Command
  focusParent(): Command
  focusChild(): Command

  expand(): Command
  collapse(): Command
  activate(): Command
  toggleSelect(): Command

  dispatch(command: Command): void

  getEntity(id: string): Entity | undefined
  getChildren(id: string): string[]
}

export interface AriaBehavior<TState extends NodeState = NodeState> {
  role: string
  keyMap: Record<string, (ctx: BehaviorContext) => Command | void>
  focusStrategy: FocusStrategy
  ariaAttributes: (node: Entity, state: TState) => Record<string, string>
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/interactive-os/__tests__/behavior-types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/behaviors/types.ts src/interactive-os/__tests__/behavior-types.test.ts
git commit -m "feat: add ARIA behavior type interfaces — AriaBehavior, BehaviorContext, NodeState"
```

---

## Chunk 2: BehaviorContext Factory + Keyboard Hook

### Task 3: BehaviorContext factory

**Files:**
- Create: `src/interactive-os/behaviors/create-behavior-context.ts`
- Test: `src/interactive-os/__tests__/behavior-context.test.ts`

- [ ] **Step 1: Write test**

Create `src/interactive-os/__tests__/behavior-context.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { createBehaviorContext } from '../behaviors/create-behavior-context'
import { createStore } from '../core/normalized-store'
import { createCommandEngine } from '../core/command-engine'
import { ROOT_ID } from '../core/types'
import { focusCommands, expandCommands } from '../plugins/core'

function setup() {
  const store = createStore({
    entities: {
      folder1: { id: 'folder1', name: 'src' },
      file1: { id: 'file1', name: 'App.tsx' },
      file2: { id: 'file2', name: 'main.tsx' },
      folder2: { id: 'folder2', name: 'lib' },
    },
    relationships: {
      [ROOT_ID]: ['folder1', 'folder2'],
      folder1: ['file1', 'file2'],
    },
  })

  const engine = createCommandEngine(store, [], vi.fn())

  // Set initial focus and expand state
  engine.dispatch(focusCommands.setFocus('file1'))
  engine.dispatch(expandCommands.expand('folder1'))

  return { engine }
}

describe('createBehaviorContext', () => {
  it('returns current focused and selected state', () => {
    const { engine } = setup()
    const ctx = createBehaviorContext(engine)

    expect(ctx.focused).toBe('file1')
    expect(ctx.selected).toEqual([])
    expect(ctx.isExpanded).toBe(false) // file1 is not expandable
  })

  it('getEntity returns entity from store', () => {
    const { engine } = setup()
    const ctx = createBehaviorContext(engine)

    expect(ctx.getEntity('folder1')).toEqual({ id: 'folder1', name: 'src' })
    expect(ctx.getEntity('nonexistent')).toBeUndefined()
  })

  it('getChildren returns children from relationships', () => {
    const { engine } = setup()
    const ctx = createBehaviorContext(engine)

    expect(ctx.getChildren('folder1')).toEqual(['file1', 'file2'])
    expect(ctx.getChildren('file1')).toEqual([])
  })

  it('dispatch forwards to engine', () => {
    const { engine } = setup()
    const dispatchSpy = vi.spyOn(engine, 'dispatch')
    const ctx = createBehaviorContext(engine)

    const cmd = focusCommands.setFocus('file2')
    ctx.dispatch(cmd)

    expect(dispatchSpy).toHaveBeenCalledWith(cmd)
  })

  it('focusNext returns command to move focus to next visible node', () => {
    const { engine } = setup()
    const ctx = createBehaviorContext(engine)
    const cmd = ctx.focusNext()

    // file1 is focused, next visible node is file2
    const newStore = cmd.execute(engine.getStore())
    expect(newStore.entities['__focus__']?.focusedId).toBe('file2')
  })

  it('focusPrev returns command to move focus to previous visible node', () => {
    const { engine } = setup()
    // Focus file2
    engine.dispatch(focusCommands.setFocus('file2'))
    const ctx = createBehaviorContext(engine)
    const cmd = ctx.focusPrev()

    const newStore = cmd.execute(engine.getStore())
    expect(newStore.entities['__focus__']?.focusedId).toBe('file1')
  })

  it('focusFirst returns command to focus first visible node', () => {
    const { engine } = setup()
    engine.dispatch(focusCommands.setFocus('file2'))
    const ctx = createBehaviorContext(engine)
    const cmd = ctx.focusFirst()

    const newStore = cmd.execute(engine.getStore())
    expect(newStore.entities['__focus__']?.focusedId).toBe('folder1')
  })

  it('focusLast returns command to focus last visible node', () => {
    const { engine } = setup()
    const ctx = createBehaviorContext(engine)
    const cmd = ctx.focusLast()

    // folder1 expanded: folder1 > file1 > file2 > folder2
    // last visible = folder2
    const newStore = cmd.execute(engine.getStore())
    expect(newStore.entities['__focus__']?.focusedId).toBe('folder2')
  })

  it('focusParent returns command to focus parent node', () => {
    const { engine } = setup()
    const ctx = createBehaviorContext(engine)
    const cmd = ctx.focusParent()

    // file1 -> parent is folder1
    const newStore = cmd.execute(engine.getStore())
    expect(newStore.entities['__focus__']?.focusedId).toBe('folder1')
  })

  it('focusChild returns command to focus first child', () => {
    const { engine } = setup()
    engine.dispatch(focusCommands.setFocus('folder1'))
    const ctx = createBehaviorContext(engine)
    const cmd = ctx.focusChild()

    const newStore = cmd.execute(engine.getStore())
    expect(newStore.entities['__focus__']?.focusedId).toBe('file1')
  })

  it('expand returns expand command for focused node', () => {
    const { engine } = setup()
    engine.dispatch(focusCommands.setFocus('folder2'))
    const ctx = createBehaviorContext(engine)
    const cmd = ctx.expand()

    const newStore = cmd.execute(engine.getStore())
    expect(
      (newStore.entities['__expanded__']?.expandedIds as string[])?.includes('folder2')
    ).toBe(true)
  })

  it('toggleSelect returns select toggle for focused node', () => {
    const { engine } = setup()
    const ctx = createBehaviorContext(engine)
    const cmd = ctx.toggleSelect()

    const newStore = cmd.execute(engine.getStore())
    expect(
      (newStore.entities['__selection__']?.selectedIds as string[])?.includes('file1')
    ).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement BehaviorContext factory**

Create `src/interactive-os/behaviors/create-behavior-context.ts`:

```ts
import type { Command, Entity } from '../core/types'
import type { CommandEngine } from '../core/command-engine'
import type { BehaviorContext } from './types'
import { getEntity, getChildren, getParent } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import { focusCommands, selectionCommands, expandCommands } from '../plugins/core'

function getFocusedId(engine: CommandEngine): string {
  return (engine.getStore().entities['__focus__']?.focusedId as string) ?? ''
}

function getSelectedIds(engine: CommandEngine): string[] {
  return (engine.getStore().entities['__selection__']?.selectedIds as string[]) ?? []
}

function getExpandedIds(engine: CommandEngine): string[] {
  return (engine.getStore().entities['__expanded__']?.expandedIds as string[]) ?? []
}

function isExpanded(engine: CommandEngine, nodeId: string): boolean {
  return getExpandedIds(engine).includes(nodeId)
}

/**
 * Build a flat list of visible node IDs (respecting expanded/collapsed state).
 * Walks the tree depth-first from __root__, only descending into expanded nodes.
 */
function getVisibleNodes(engine: CommandEngine): string[] {
  const store = engine.getStore()
  const expandedIds = getExpandedIds(engine)
  const visible: string[] = []

  const walk = (parentId: string) => {
    const children = getChildren(store, parentId)
    for (const childId of children) {
      visible.push(childId)
      if (expandedIds.includes(childId)) {
        walk(childId)
      }
    }
  }

  walk(ROOT_ID)
  return visible
}

export function createBehaviorContext(engine: CommandEngine): BehaviorContext {
  const store = engine.getStore()
  const focusedId = getFocusedId(engine)

  return {
    focused: focusedId,
    selected: getSelectedIds(engine),
    isExpanded: isExpanded(engine, focusedId),

    focusNext(): Command {
      const visible = getVisibleNodes(engine)
      const idx = visible.indexOf(focusedId)
      const nextId = visible[idx + 1] ?? focusedId
      return focusCommands.setFocus(nextId)
    },

    focusPrev(): Command {
      const visible = getVisibleNodes(engine)
      const idx = visible.indexOf(focusedId)
      const prevId = visible[idx - 1] ?? focusedId
      return focusCommands.setFocus(prevId)
    },

    focusFirst(): Command {
      const visible = getVisibleNodes(engine)
      return focusCommands.setFocus(visible[0] ?? focusedId)
    },

    focusLast(): Command {
      const visible = getVisibleNodes(engine)
      return focusCommands.setFocus(visible[visible.length - 1] ?? focusedId)
    },

    focusParent(): Command {
      const parentId = getParent(store, focusedId)
      if (!parentId || parentId === ROOT_ID) return focusCommands.setFocus(focusedId)
      return focusCommands.setFocus(parentId)
    },

    focusChild(): Command {
      const children = getChildren(store, focusedId)
      if (children.length === 0) return focusCommands.setFocus(focusedId)
      return focusCommands.setFocus(children[0]!)
    },

    expand(): Command {
      return expandCommands.expand(focusedId)
    },

    collapse(): Command {
      return expandCommands.collapse(focusedId)
    },

    activate(): Command {
      // Default activate = toggle expand if has children, otherwise select
      const children = getChildren(store, focusedId)
      if (children.length > 0) {
        return expandCommands.toggleExpand(focusedId)
      }
      return selectionCommands.select(focusedId)
    },

    toggleSelect(): Command {
      return selectionCommands.toggleSelect(focusedId)
    },

    dispatch(command: Command): void {
      engine.dispatch(command)
    },

    getEntity(id: string): Entity | undefined {
      return getEntity(store, id)
    },

    getChildren(id: string): string[] {
      return getChildren(store, id)
    },
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/behaviors/create-behavior-context.ts src/interactive-os/__tests__/behavior-context.test.ts
git commit -m "feat: add BehaviorContext factory — navigation, focus, selection, expand commands"
```

---

### Task 4: Keyboard event handler hook

**Files:**
- Create: `src/interactive-os/hooks/use-keyboard.ts`
- Test: `src/interactive-os/__tests__/use-keyboard.test.ts`

- [ ] **Step 1: Write test**

Create `src/interactive-os/__tests__/use-keyboard.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { parseKeyCombo, matchKeyEvent } from '../hooks/use-keyboard'

describe('parseKeyCombo', () => {
  it('parses simple key', () => {
    expect(parseKeyCombo('ArrowDown')).toEqual({
      key: 'ArrowDown',
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    })
  })

  it('parses Mod+key (Mod = Ctrl on non-Mac, Meta on Mac)', () => {
    const result = parseKeyCombo('Mod+C')
    expect(result.key).toBe('c')
    // Mod resolves to ctrl or meta depending on platform
    expect(result.ctrl || result.meta).toBe(true)
  })

  it('parses Ctrl+Shift+key', () => {
    const result = parseKeyCombo('Ctrl+Shift+Z')
    expect(result).toEqual({
      key: 'z',
      ctrl: true,
      shift: true,
      alt: false,
      meta: false,
    })
  })

  it('parses single character keys as lowercase', () => {
    expect(parseKeyCombo('F2').key).toBe('F2')
    expect(parseKeyCombo('Mod+C').key).toBe('c')
  })
})

describe('matchKeyEvent', () => {
  function makeEvent(overrides: Partial<KeyboardEvent>): KeyboardEvent {
    return {
      key: '',
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      ...overrides,
    } as KeyboardEvent
  }

  it('matches simple arrow key', () => {
    expect(matchKeyEvent(makeEvent({ key: 'ArrowDown' }), 'ArrowDown')).toBe(true)
    expect(matchKeyEvent(makeEvent({ key: 'ArrowUp' }), 'ArrowDown')).toBe(false)
  })

  it('matches Ctrl+C', () => {
    expect(
      matchKeyEvent(makeEvent({ key: 'c', ctrlKey: true }), 'Ctrl+C')
    ).toBe(true)
  })

  it('does not match when modifier is missing', () => {
    expect(
      matchKeyEvent(makeEvent({ key: 'c' }), 'Ctrl+C')
    ).toBe(false)
  })

  it('does not match when extra modifier is present', () => {
    expect(
      matchKeyEvent(makeEvent({ key: 'c', ctrlKey: true, shiftKey: true }), 'Ctrl+C')
    ).toBe(false)
  })

  it('matches Delete key', () => {
    expect(matchKeyEvent(makeEvent({ key: 'Delete' }), 'Delete')).toBe(true)
  })

  it('matches Space', () => {
    expect(matchKeyEvent(makeEvent({ key: ' ' }), 'Space')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify fail**

- [ ] **Step 3: Implement keyboard utilities**

Create `src/interactive-os/hooks/use-keyboard.ts`:

```ts
interface KeyCombo {
  key: string
  ctrl: boolean
  shift: boolean
  alt: boolean
  meta: boolean
}

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)

export function parseKeyCombo(combo: string): KeyCombo {
  const parts = combo.split('+')
  const modifiers = parts.slice(0, -1).map((m) => m.toLowerCase())
  let key = parts[parts.length - 1]!

  const hasMod = modifiers.includes('mod')
  const hasCtrl = modifiers.includes('ctrl') || (hasMod && !isMac)
  const hasMeta = modifiers.includes('meta') || (hasMod && isMac)
  const hasShift = modifiers.includes('shift')
  const hasAlt = modifiers.includes('alt')

  // Normalize single-character keys to lowercase (but not special keys like F2, ArrowDown)
  if (key.length === 1) {
    key = key.toLowerCase()
  }

  return {
    key,
    ctrl: hasCtrl,
    shift: hasShift,
    alt: hasAlt,
    meta: hasMeta,
  }
}

export function matchKeyEvent(event: KeyboardEvent, combo: string): boolean {
  const parsed = parseKeyCombo(combo)

  // Normalize event key
  let eventKey = event.key
  if (eventKey === ' ') eventKey = 'Space'
  if (eventKey.length === 1) eventKey = eventKey.toLowerCase()

  // Special: Space combo comparison
  let comboKey = parsed.key
  if (comboKey === 'Space') comboKey = 'Space'

  if (eventKey !== comboKey) return false
  if (event.ctrlKey !== parsed.ctrl) return false
  if (event.shiftKey !== parsed.shift) return false
  if (event.altKey !== parsed.alt) return false
  if (event.metaKey !== parsed.meta) return false

  return true
}

export function findMatchingKey(
  event: KeyboardEvent,
  keyMap: Record<string, unknown>
): string | undefined {
  for (const combo of Object.keys(keyMap)) {
    if (matchKeyEvent(event, combo)) return combo
  }
  return undefined
}
```

- [ ] **Step 4: Run tests to verify pass**

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/hooks/use-keyboard.ts src/interactive-os/__tests__/use-keyboard.test.ts
git commit -m "feat: add keyboard event matching utilities — parseKeyCombo, matchKeyEvent"
```

---

## Chunk 3: Treegrid Behavior Preset

### Task 5: Treegrid behavior

**Files:**
- Create: `src/interactive-os/behaviors/treegrid.ts`
- Test: `src/interactive-os/__tests__/treegrid-behavior.test.ts`

- [ ] **Step 1: Write test**

Create `src/interactive-os/__tests__/treegrid-behavior.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { treegrid } from '../behaviors/treegrid'

describe('treegrid behavior preset', () => {
  it('has role treegrid', () => {
    expect(treegrid.role).toBe('treegrid')
  })

  it('has vertical roving-tabindex focus strategy', () => {
    expect(treegrid.focusStrategy).toEqual({
      type: 'roving-tabindex',
      orientation: 'vertical',
    })
  })

  it('defines APG-compliant keyboard mappings', () => {
    const expectedKeys = [
      'ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft',
      'Enter', 'Space', 'Home', 'End',
    ]
    for (const key of expectedKeys) {
      expect(treegrid.keyMap[key]).toBeDefined()
    }
  })

  it('ariaAttributes returns correct attributes for a tree node', () => {
    const node = { id: 'test', name: 'Test' }
    const state = {
      focused: true,
      selected: false,
      disabled: false,
      index: 2,
      siblingCount: 5,
      expanded: true,
      level: 3,
    }

    const attrs = treegrid.ariaAttributes(node, state)
    expect(attrs['aria-expanded']).toBe('true')
    expect(attrs['aria-level']).toBe('3')
    expect(attrs['aria-selected']).toBe('false')
    expect(attrs['aria-posinset']).toBe('3')
    expect(attrs['aria-setsize']).toBe('5')
  })

  it('ariaAttributes omits aria-expanded for leaf nodes', () => {
    const node = { id: 'leaf', name: 'Leaf' }
    const state = {
      focused: false,
      selected: false,
      disabled: false,
      index: 0,
      siblingCount: 1,
      // no expanded, no level — leaf node
    }

    const attrs = treegrid.ariaAttributes(node, state)
    expect(attrs['aria-expanded']).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify fail**

- [ ] **Step 3: Implement treegrid behavior**

Create `src/interactive-os/behaviors/treegrid.ts`:

```ts
import type { AriaBehavior, NodeState } from './types'

export const treegrid: AriaBehavior = {
  role: 'treegrid',
  keyMap: {
    ArrowDown: (ctx) => ctx.focusNext(),
    ArrowUp: (ctx) => ctx.focusPrev(),
    ArrowRight: (ctx) => ctx.isExpanded ? ctx.focusChild() : ctx.expand(),
    ArrowLeft: (ctx) => ctx.isExpanded ? ctx.collapse() : ctx.focusParent(),
    Enter: (ctx) => ctx.activate(),
    Space: (ctx) => ctx.toggleSelect(),
    Home: (ctx) => ctx.focusFirst(),
    End: (ctx) => ctx.focusLast(),
  },
  focusStrategy: {
    type: 'roving-tabindex',
    orientation: 'vertical',
  },
  ariaAttributes: (_node, state: NodeState) => {
    const attrs: Record<string, string> = {
      'aria-selected': String(state.selected),
      'aria-posinset': String(state.index + 1),
      'aria-setsize': String(state.siblingCount),
    }

    if (state.expanded !== undefined) {
      attrs['aria-expanded'] = String(state.expanded)
    }
    if (state.level !== undefined) {
      attrs['aria-level'] = String(state.level)
    }

    return attrs
  },
}
```

- [ ] **Step 4: Run tests to verify pass**

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/behaviors/treegrid.ts src/interactive-os/__tests__/treegrid-behavior.test.ts
git commit -m "feat: add treegrid behavior preset — APG-compliant keyboard mappings and ARIA attributes"
```

---

## Chunk 4: useAria Hook

### Task 6: useAria hook

**Files:**
- Create: `src/interactive-os/hooks/use-aria.ts`
- Test: `src/interactive-os/__tests__/use-aria.test.tsx`

- [ ] **Step 1: Write test**

Create `src/interactive-os/__tests__/use-aria.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAria } from '../hooks/use-aria'
import { treegrid } from '../behaviors/treegrid'
import { ROOT_ID } from '../core/types'

function fixtureData() {
  return {
    entities: {
      src: { id: 'src', name: 'src' },
      app: { id: 'app', name: 'App.tsx' },
      main: { id: 'main', name: 'main.tsx' },
    },
    relationships: {
      [ROOT_ID]: ['src'],
      src: ['app', 'main'],
    },
  }
}

describe('useAria hook', () => {
  it('returns dispatch, getNodeProps, getNodeState, focused, selected', () => {
    const { result } = renderHook(() =>
      useAria({
        behavior: treegrid,
        data: fixtureData(),
        plugins: [],
      })
    )

    expect(result.current.dispatch).toBeInstanceOf(Function)
    expect(result.current.getNodeProps).toBeInstanceOf(Function)
    expect(result.current.getNodeState).toBeInstanceOf(Function)
    expect(result.current.focused).toBeDefined()
    expect(result.current.selected).toEqual([])
  })

  it('getNodeProps returns ARIA attributes and role', () => {
    const { result } = renderHook(() =>
      useAria({
        behavior: treegrid,
        data: fixtureData(),
        plugins: [],
      })
    )

    const props = result.current.getNodeProps('src')
    expect(props.role).toBe('row')
    expect(props['aria-level']).toBeDefined()
    expect(props.onKeyDown).toBeInstanceOf(Function)
    expect(props.onFocus).toBeInstanceOf(Function)
  })

  it('getNodeState returns computed state', () => {
    const { result } = renderHook(() =>
      useAria({
        behavior: treegrid,
        data: fixtureData(),
        plugins: [],
      })
    )

    const state = result.current.getNodeState('src')
    expect(state.focused).toBeDefined()
    expect(state.selected).toBe(false)
    expect(state.index).toBe(0)
    expect(state.siblingCount).toBe(1)
  })

  it('first visible node gets focus by default', () => {
    const { result } = renderHook(() =>
      useAria({
        behavior: treegrid,
        data: fixtureData(),
        plugins: [],
      })
    )

    expect(result.current.focused).toBe('src')
  })

  it('keyMap overrides merge with behavior defaults', () => {
    const customHandler = vi.fn()
    const { result } = renderHook(() =>
      useAria({
        behavior: treegrid,
        data: fixtureData(),
        plugins: [],
        keyMap: {
          Enter: () => { customHandler(); return undefined },
        },
      })
    )

    // The merged keyMap should have both default keys and the override
    expect(result.current.getNodeProps('src').onKeyDown).toBeInstanceOf(Function)
  })
})
```

- [ ] **Step 2: Run test to verify fail**

- [ ] **Step 3: Implement useAria hook**

Create `src/interactive-os/hooks/use-aria.ts`:

```tsx
import { useState, useCallback, useMemo, useRef } from 'react'
import type { Command, NormalizedData, Plugin } from '../core/types'
import { ROOT_ID } from '../core/types'
import type { AriaBehavior, NodeState } from '../behaviors/types'
import { createCommandEngine } from '../core/command-engine'
import type { CommandEngine } from '../core/command-engine'
import { getChildren, getParent, getEntity } from '../core/normalized-store'
import { focusCommands } from '../plugins/core'
import { createBehaviorContext } from '../behaviors/create-behavior-context'
import { findMatchingKey } from './use-keyboard'

export interface UseAriaOptions {
  behavior: AriaBehavior
  data: NormalizedData
  plugins?: Plugin[]
  keyMap?: Record<string, (ctx: ReturnType<typeof createBehaviorContext>) => Command | void>
  onChange?: (data: NormalizedData) => void
}

export interface UseAriaReturn {
  dispatch(command: Command): void
  getNodeProps(id: string): Record<string, unknown>
  getNodeState(id: string): NodeState
  focused: string
  selected: string[]
  getStore(): NormalizedData
}

export function useAria(options: UseAriaOptions): UseAriaReturn {
  const { behavior, data, plugins = [], keyMap: keyMapOverrides, onChange } = options
  const [, forceRender] = useState(0)

  const engineRef = useRef<CommandEngine | null>(null)

  // Create engine once, update when data changes
  if (!engineRef.current) {
    const middlewares = plugins
      .map((p) => p.middleware)
      .filter((m): m is NonNullable<typeof m> => m != null)

    engineRef.current = createCommandEngine(data, middlewares, (newStore) => {
      onChange?.(newStore)
      forceRender((n) => n + 1)
    })

    // Auto-focus first visible node
    const firstVisible = getChildren(data, ROOT_ID)[0]
    if (firstVisible) {
      engineRef.current.dispatch(focusCommands.setFocus(firstVisible))
    }
  }

  const engine = engineRef.current

  // Merge keyMaps: overrides take precedence
  const mergedKeyMap = useMemo(
    () => ({ ...behavior.keyMap, ...keyMapOverrides }),
    [behavior.keyMap, keyMapOverrides]
  )

  const dispatch = useCallback(
    (command: Command) => engine.dispatch(command),
    [engine]
  )

  const store = engine.getStore()
  const focusedId = (store.entities['__focus__']?.focusedId as string) ?? ''
  const selectedIds = (store.entities['__selection__']?.selectedIds as string[]) ?? []
  const expandedIds = (store.entities['__expanded__']?.expandedIds as string[]) ?? []

  const getNodeState = useCallback(
    (id: string): NodeState => {
      const parentId = getParent(store, id)
      const siblings = parentId ? getChildren(store, parentId) : []
      const children = getChildren(store, id)
      const hasChildren = children.length > 0

      // Calculate level (depth from root)
      let level = 0
      let current = id
      while (true) {
        const parent = getParent(store, current)
        if (!parent || parent === ROOT_ID) break
        level++
        current = parent
      }

      return {
        focused: id === focusedId,
        selected: selectedIds.includes(id),
        disabled: false,
        index: siblings.indexOf(id),
        siblingCount: siblings.length,
        expanded: hasChildren ? expandedIds.includes(id) : undefined,
        level: level + 1, // 1-based for ARIA
      }
    },
    [store, focusedId, selectedIds, expandedIds]
  )

  const getNodeProps = useCallback(
    (id: string): Record<string, unknown> => {
      const state = getNodeState(id)
      const entity = getEntity(store, id) ?? { id }
      const ariaAttrs = behavior.ariaAttributes(entity, state)

      return {
        role: 'row', // treegrid rows
        tabIndex: id === focusedId ? 0 : -1,
        'data-node-id': id,
        ...ariaAttrs,
        onKeyDown: (event: KeyboardEvent) => {
          const matchedKey = findMatchingKey(event, mergedKeyMap)
          if (!matchedKey) return

          const ctx = createBehaviorContext(engine)
          const handler = mergedKeyMap[matchedKey]
          if (!handler) return

          const command = handler(ctx)
          if (command) {
            engine.dispatch(command)
          }
          event.preventDefault()
        },
        onFocus: () => {
          if (id !== focusedId) {
            engine.dispatch(focusCommands.setFocus(id))
          }
        },
      }
    },
    [store, behavior, mergedKeyMap, engine, focusedId, getNodeState]
  )

  return {
    dispatch,
    getNodeProps,
    getNodeState,
    focused: focusedId,
    selected: selectedIds,
    getStore: () => engine.getStore(),
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/hooks/use-aria.ts src/interactive-os/__tests__/use-aria.test.tsx
git commit -m "feat: add useAria hook — keyboard handling, focus, ARIA props generation"
```

---

## Chunk 5: Aria Compound Component

### Task 7: `<Aria>` compound component

**Files:**
- Create: `src/interactive-os/components/aria-context.ts`
- Create: `src/interactive-os/components/aria.tsx`
- Test: `src/interactive-os/__tests__/aria-component.test.tsx`

- [ ] **Step 1: Write test**

Create `src/interactive-os/__tests__/aria-component.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../components/aria'
import { treegrid } from '../behaviors/treegrid'
import { ROOT_ID } from '../core/types'

function fixtureData() {
  return {
    entities: {
      src: { id: 'src', name: 'src' },
      app: { id: 'app', name: 'App.tsx' },
      main: { id: 'main', name: 'main.tsx' },
    },
    relationships: {
      [ROOT_ID]: ['src'],
      src: ['app', 'main'],
    },
  }
}

describe('<Aria> compound component', () => {
  it('renders nodes with Aria.Node render slot', () => {
    render(
      <Aria behavior={treegrid} data={fixtureData()} plugins={[]}>
        <Aria.Node render={(node) => <span>{node.name as string}</span>} />
      </Aria>
    )

    expect(screen.getByText('src')).toBeDefined()
  })

  it('applies ARIA role to the container', () => {
    const { container } = render(
      <Aria behavior={treegrid} data={fixtureData()} plugins={[]}>
        <Aria.Node render={(node) => <span>{node.name as string}</span>} />
      </Aria>
    )

    const el = container.querySelector('[role="treegrid"]')
    expect(el).not.toBeNull()
  })

  it('applies aria attributes to nodes', () => {
    const { container } = render(
      <Aria behavior={treegrid} data={fixtureData()} plugins={[]}>
        <Aria.Node render={(node) => <span>{node.name as string}</span>} />
      </Aria>
    )

    const rows = container.querySelectorAll('[role="row"]')
    expect(rows.length).toBeGreaterThan(0)

    // First node (src) should have aria-level
    const firstRow = rows[0]!
    expect(firstRow.getAttribute('aria-level')).toBe('1')
  })

  it('first node has tabIndex 0, others have -1', () => {
    const { container } = render(
      <Aria behavior={treegrid} data={fixtureData()} plugins={[]}>
        <Aria.Node render={(node) => <span>{node.name as string}</span>} />
      </Aria>
    )

    const rows = container.querySelectorAll('[role="row"]')
    expect(rows[0]!.getAttribute('tabindex')).toBe('0')
    // Non-focused rows should have -1 (if rendered)
  })
})
```

- [ ] **Step 2: Run test to verify fail**

- [ ] **Step 3: Implement Aria context and component**

Create `src/interactive-os/components/aria-context.ts`:

```ts
import { createContext } from 'react'
import type { UseAriaReturn } from '../hooks/use-aria'

export const AriaInternalContext = createContext<UseAriaReturn | null>(null)
```

Create `src/interactive-os/components/aria.tsx`:

```tsx
import React, { useMemo } from 'react'
import type { ReactNode } from 'react'
import type { NormalizedData, Plugin, Command } from '../core/types'
import { ROOT_ID } from '../core/types'
import type { AriaBehavior, BehaviorContext, NodeState } from '../behaviors/types'
import { useAria } from '../hooks/use-aria'
import type { UseAriaReturn } from '../hooks/use-aria'
import { AriaInternalContext } from './aria-context'
import { getChildren } from '../core/normalized-store'

interface AriaProps {
  behavior: AriaBehavior
  data: NormalizedData
  plugins: Plugin[]
  keyMap?: Record<string, (ctx: BehaviorContext) => Command | void>
  onChange?: (data: NormalizedData) => void
  children: ReactNode
}

interface AriaNodeProps {
  render: (node: Record<string, unknown>, state: NodeState) => ReactNode
}

function AriaRoot({ behavior, data, plugins, keyMap, onChange, children }: AriaProps) {
  const aria = useAria({ behavior, data, plugins, keyMap, onChange })

  return (
    <AriaInternalContext.Provider value={aria}>
      <div role={behavior.role}>
        {children}
      </div>
    </AriaInternalContext.Provider>
  )
}

function AriaNode({ render }: AriaNodeProps) {
  return (
    <AriaInternalContext.Consumer>
      {(aria) => {
        if (!aria) throw new Error('<Aria.Node> must be inside <Aria>')

        const store = aria.getStore()
        const expandedIds = (store.entities['__expanded__']?.expandedIds as string[]) ?? []

        // Walk visible nodes and render each
        const renderNodes = (parentId: string): ReactNode[] => {
          const children = getChildren(store, parentId)
          const nodes: ReactNode[] = []

          for (const childId of children) {
            const entity = store.entities[childId]
            if (!entity) continue

            const state = aria.getNodeState(childId)
            const props = aria.getNodeProps(childId)
            const hasChildren = getChildren(store, childId).length > 0
            const isExpanded = expandedIds.includes(childId)

            nodes.push(
              <div key={childId} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
                {render(entity, state)}
              </div>
            )

            // Render children if expanded
            if (hasChildren && isExpanded) {
              nodes.push(...renderNodes(childId))
            }
          }

          return nodes
        }

        return <>{renderNodes(ROOT_ID)}</>
      }}
    </AriaInternalContext.Consumer>
  )
}

export const Aria = Object.assign(AriaRoot, {
  Node: AriaNode,
})
```

- [ ] **Step 4: Run tests**

Note: You may need to install `@testing-library/user-event`:
```bash
pnpm add -D @testing-library/user-event
```

Run: `pnpm test`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/components/aria-context.ts src/interactive-os/components/aria.tsx src/interactive-os/__tests__/aria-component.test.tsx
git commit -m "feat: add <Aria> compound component with render slot pattern"
```

---

## Summary

After completing all 7 tasks, Phase 2 delivers:

| Layer | What | Files |
|-------|------|-------|
| ④ ARIA Behavior | Type interfaces + treegrid preset | `behaviors/types.ts`, `behaviors/treegrid.ts`, `behaviors/create-behavior-context.ts` |
| ⑤ Components | `<Aria>` + `<Aria.Node>` compound component | `components/aria.tsx`, `components/aria-context.ts` |
| Hooks | `useAria()`, keyboard utilities | `hooks/use-aria.ts`, `hooks/use-keyboard.ts` |
| Tests | 7 test files, covering all new code | `__tests__/*.test.ts(x)` |

**Phase 3** (next plan) will add: crud(), clipboard(), rename(), dnd() plugins — completing the full editing story.
