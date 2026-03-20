# Kanban Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a keyboard-first kanban board to the Collection layer, validating cross-container movement with existing plugins.

**Architecture:** Kanban = new behavior + new UI component + Collection page. Store structure uses existing normalized tree: columns are 1-depth entities under ROOT, cards are 2-depth entities under columns. All existing plugins (crud, clipboard, rename, dnd, history, focusRecovery) are reused without modification. The kanban behavior implements custom cross-column navigation in its keyMap using `ctx.getChildren(ROOT_ID)` to discover columns and their cards.

**Tech Stack:** React, TypeScript, Vitest, interactive-os (behaviors, plugins, `<Aria>` component)

**Spec:** `docs/superpowers/specs/2026-03-19-kanban-showcase-prd.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/pages/shared-kanban-data.ts` | Create | Demo data: 4 columns, 10 cards, pre-expanded columns |
| `src/interactive-os/behaviors/kanban.ts` | Create | Kanban behavior: custom cross-column keyMap, ARIA attributes |
| `src/interactive-os/__tests__/kanban.test.ts` | Create | Behavior tests: navigation + cross-column move + edge cases |
| `src/interactive-os/ui/kanban.css` | Create | Kanban visual layout: horizontal columns, vertical cards |
| `src/interactive-os/ui/Kanban.tsx` | Create | Kanban UI component: `<Aria>` + level-aware rendering |
| `src/pages/PageKanban.tsx` | Create | Collection page: header + key hints + Kanban + keyboard table |
| `src/App.tsx` | Modify | Add kanban route to Collection group (line ~164) |

---

### Task 1: Demo Data

**Files:**
- Create: `src/pages/shared-kanban-data.ts`

- [ ] **Step 1: Create kanban demo data**

```typescript
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'

export const kanbanInitialData = createStore({
  entities: {
    '__expanded__': { id: '__expanded__', expandedIds: ['col-todo', 'col-progress', 'col-review', 'col-done'] },
    'col-todo':     { id: 'col-todo',     data: { title: 'To Do' } },
    'col-progress': { id: 'col-progress', data: { title: 'In Progress' } },
    'col-review':   { id: 'col-review',   data: { title: 'Review' } },
    'col-done':     { id: 'col-done',     data: { title: 'Done' } },
    'card-1':  { id: 'card-1',  data: { title: 'Set up project scaffolding' } },
    'card-2':  { id: 'card-2',  data: { title: 'Design data model' } },
    'card-3':  { id: 'card-3',  data: { title: 'Write API endpoints' } },
    'card-4':  { id: 'card-4',  data: { title: 'Implement auth flow' } },
    'card-5':  { id: 'card-5',  data: { title: 'Build dashboard UI' } },
    'card-6':  { id: 'card-6',  data: { title: 'Add keyboard shortcuts' } },
    'card-7':  { id: 'card-7',  data: { title: 'Write integration tests' } },
    'card-8':  { id: 'card-8',  data: { title: 'Deploy staging environment' } },
    'card-9':  { id: 'card-9',  data: { title: 'Review accessibility audit' } },
    'card-10': { id: 'card-10', data: { title: 'Update documentation' } },
  },
  relationships: {
    [ROOT_ID]: ['col-todo', 'col-progress', 'col-review', 'col-done'],
    'col-todo':     ['card-1', 'card-2', 'card-3'],
    'col-progress': ['card-4', 'card-5'],
    'col-review':   ['card-6', 'card-7'],
    'col-done':     ['card-8', 'card-9', 'card-10'],
  },
})
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit src/pages/shared-kanban-data.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/shared-kanban-data.ts
git commit -m "feat: add kanban demo data — 4 columns, 10 cards"
```

---

### Task 2: Kanban Behavior — Tests (Navigation)

**Files:**
- Create: `src/interactive-os/__tests__/kanban.test.ts`

**Context:** The kanban behavior needs custom cross-column navigation. The standard `focusNext/focusPrev` from `createBehaviorContext` walks a flat depth-first list, which doesn't respect column boundaries. The behavior's keyMap must implement column-aware navigation using `ctx.getChildren(ROOT_ID)` to discover columns and `ctx.getChildren(columnId)` to get cards within each column.

**Store structure for tests:**
```
__root__ → [col-a, col-b, col-c]
col-a → [a1, a2, a3]
col-b → [b1]
col-c → [c1, c2]
```

All columns must be pre-expanded in `__expanded__` so cards are visible to `getVisibleNodes()`.

- [ ] **Step 1: Write navigation test scaffold**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createStore } from '../core/createStore'
import { createCommandEngine } from '../core/createCommandEngine'
import { ROOT_ID } from '../core/types'
import { core, focusCommands, expandCommands, FOCUS_ID } from '../plugins/core'
import { dnd } from '../plugins/dnd'
import { history } from '../plugins/history'
import { kanban } from '../behaviors/kanban'
import { createBehaviorContext } from '../behaviors/createBehaviorContext'

function setup(focusedId = 'a1') {
  const store = createStore({
    entities: {
      'col-a': { id: 'col-a', data: { title: 'A' } },
      'col-b': { id: 'col-b', data: { title: 'B' } },
      'col-c': { id: 'col-c', data: { title: 'C' } },
      'a1': { id: 'a1', data: { title: 'A1' } },
      'a2': { id: 'a2', data: { title: 'A2' } },
      'a3': { id: 'a3', data: { title: 'A3' } },
      'b1': { id: 'b1', data: { title: 'B1' } },
      'c1': { id: 'c1', data: { title: 'C1' } },
      'c2': { id: 'c2', data: { title: 'C2' } },
    },
    relationships: {
      [ROOT_ID]: ['col-a', 'col-b', 'col-c'],
      'col-a': ['a1', 'a2', 'a3'],
      'col-b': ['b1'],
      'col-c': ['c1', 'c2'],
    },
  })

  const onChange = vi.fn()
  const engine = createCommandEngine(store, [core(), dnd(), history()], onChange)
  // Pre-expand all columns so cards are visible
  engine.dispatch(expandCommands.expand('col-a'))
  engine.dispatch(expandCommands.expand('col-b'))
  engine.dispatch(expandCommands.expand('col-c'))
  engine.dispatch(focusCommands.setFocus(focusedId))
  return { engine, onChange }
}

function getFocused(engine: ReturnType<typeof createCommandEngine>): string {
  return (engine.getStore().entities[FOCUS_ID]?.focusedId as string) ?? ''
}

function pressKey(engine: ReturnType<typeof createCommandEngine>, key: string) {
  const ctx = createBehaviorContext(engine)
  const handler = kanban.keyMap[key]
  if (!handler) return
  const cmd = handler(ctx)
  if (cmd) engine.dispatch(cmd)
}
```

- [ ] **Step 2: Write ArrowDown/ArrowUp tests (within column)**

```typescript
describe('kanban behavior — vertical navigation', () => {
  it('ArrowDown moves to next card in same column', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'ArrowDown')
    expect(getFocused(engine)).toBe('a2')
  })

  it('ArrowDown at last card in column stays put', () => {
    const { engine } = setup('a3')
    pressKey(engine, 'ArrowDown')
    expect(getFocused(engine)).toBe('a3')
  })

  it('ArrowUp moves to previous card in same column', () => {
    const { engine } = setup('a2')
    pressKey(engine, 'ArrowUp')
    expect(getFocused(engine)).toBe('a1')
  })

  it('ArrowUp at first card in column stays put', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'ArrowUp')
    expect(getFocused(engine)).toBe('a1')
  })
})
```

- [ ] **Step 3: Write ArrowRight/ArrowLeft tests (cross-column)**

```typescript
describe('kanban behavior — horizontal navigation', () => {
  it('ArrowRight moves to same-index card in next column', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'ArrowRight')
    expect(getFocused(engine)).toBe('b1') // index 0 in col-b
  })

  it('ArrowRight clamps to last card when target column is shorter', () => {
    const { engine } = setup('a3')
    pressKey(engine, 'ArrowRight')
    expect(getFocused(engine)).toBe('b1') // col-b has only 1 card, clamp to last
  })

  it('ArrowLeft moves to same-index card in previous column', () => {
    const { engine } = setup('b1')
    pressKey(engine, 'ArrowLeft')
    expect(getFocused(engine)).toBe('a1') // index 0 in col-a
  })

  it('ArrowRight at last column stays put', () => {
    const { engine } = setup('c1')
    pressKey(engine, 'ArrowRight')
    expect(getFocused(engine)).toBe('c1')
  })

  it('ArrowLeft at first column stays put', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'ArrowLeft')
    expect(getFocused(engine)).toBe('a1')
  })
})
```

- [ ] **Step 4: Write empty column navigation tests**

```typescript
describe('kanban behavior — empty column', () => {
  function setupWithEmpty(focusedId = 'a1') {
    const store = createStore({
      entities: {
        'col-a': { id: 'col-a', data: { title: 'A' } },
        'col-empty': { id: 'col-empty', data: { title: 'Empty' } },
        'col-c': { id: 'col-c', data: { title: 'C' } },
        'a1': { id: 'a1', data: { title: 'A1' } },
        'c1': { id: 'c1', data: { title: 'C1' } },
      },
      relationships: {
        [ROOT_ID]: ['col-a', 'col-empty', 'col-c'],
        'col-a': ['a1'],
        'col-empty': [],
        'col-c': ['c1'],
      },
    })
    const onChange = vi.fn()
    const engine = createCommandEngine(store, [core(), dnd(), history()], onChange)
    engine.dispatch(expandCommands.expand('col-a'))
    engine.dispatch(expandCommands.expand('col-empty'))
    engine.dispatch(expandCommands.expand('col-c'))
    engine.dispatch(focusCommands.setFocus(focusedId))
    return { engine, onChange }
  }

  it('ArrowRight into empty column focuses column header', () => {
    const { engine } = setupWithEmpty('a1')
    pressKey(engine, 'ArrowRight')
    expect(getFocused(engine)).toBe('col-empty')
  })

  it('ArrowRight from empty column header focuses card in next column', () => {
    const { engine } = setupWithEmpty('a1')
    engine.dispatch(focusCommands.setFocus('col-empty'))
    pressKey(engine, 'ArrowRight')
    expect(getFocused(engine)).toBe('c1')
  })
})
```

- [ ] **Step 5: Write ArrowDown from column header test**

```typescript
describe('kanban behavior — column header navigation', () => {
  it('ArrowDown from column header focuses first card', () => {
    const { engine } = setup('a1')
    engine.dispatch(focusCommands.setFocus('col-a'))
    pressKey(engine, 'ArrowDown')
    expect(getFocused(engine)).toBe('a1')
  })
})
```

- [ ] **Step 6: Write Home/End tests**

```typescript
describe('kanban behavior — Home/End', () => {
  it('Home focuses first card in current column', () => {
    const { engine } = setup('a3')
    pressKey(engine, 'Home')
    expect(getFocused(engine)).toBe('a1')
  })

  it('End focuses last card in current column', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'End')
    expect(getFocused(engine)).toBe('a3')
  })

  it('Mod+Home focuses first card in first column', () => {
    const { engine } = setup('c2')
    pressKey(engine, 'Mod+Home')
    expect(getFocused(engine)).toBe('a1')
  })

  it('Mod+End focuses last card in last column', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'Mod+End')
    expect(getFocused(engine)).toBe('c2')
  })
})
```

- [ ] **Step 7: Run tests to verify they fail**

Run: `pnpm test src/interactive-os/__tests__/kanban.test.ts`
Expected: FAIL — `kanban` import not found

- [ ] **Step 8: Commit failing tests**

```bash
git add src/interactive-os/__tests__/kanban.test.ts
git commit -m "test: kanban behavior — navigation tests (red)"
```

---

### Task 3: Kanban Behavior — Tests (Cross-Column Move)

**Files:**
- Modify: `src/interactive-os/__tests__/kanban.test.ts`

- [ ] **Step 1: Write Alt+Arrow cross-column move tests**

```typescript
describe('kanban behavior — cross-column move', () => {
  it('Alt+ArrowRight moves card to next column at same index', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'Alt+ArrowRight')
    // card a1 should now be in col-b at index 0
    const colBCards = engine.getStore().relationships['col-b'] ?? []
    expect(colBCards[0]).toBe('a1')
    expect(getFocused(engine)).toBe('a1') // focus follows
  })

  it('Alt+ArrowLeft moves card to previous column at same index', () => {
    const { engine } = setup('b1')
    pressKey(engine, 'Alt+ArrowLeft')
    const colACards = engine.getStore().relationships['col-a'] ?? []
    expect(colACards[0]).toBe('b1') // inserted at index 0
    expect(getFocused(engine)).toBe('b1')
  })

  it('Alt+ArrowRight at last column does nothing', () => {
    const { engine } = setup('c1')
    const storeBefore = engine.getStore()
    pressKey(engine, 'Alt+ArrowRight')
    expect(engine.getStore().relationships).toEqual(storeBefore.relationships)
  })

  it('Alt+ArrowRight preserves index (reversible motion)', () => {
    const { engine } = setup('a2') // index 1 in col-a
    pressKey(engine, 'Alt+ArrowRight') // move to col-b at index 1
    const colBCards = engine.getStore().relationships['col-b'] ?? []
    expect(colBCards[1]).toBe('a2')
    // Move back
    pressKey(engine, 'Alt+ArrowLeft')
    const colACards = engine.getStore().relationships['col-a'] ?? []
    expect(colACards[1]).toBe('a2') // back at original index
  })

  it('Alt+ArrowRight clamps index when target column is shorter', () => {
    const { engine } = setup('a3') // index 2 in col-a (3 cards)
    pressKey(engine, 'Alt+ArrowRight') // col-b has 1 card, clamp to index 1 (end)
    const colBCards = engine.getStore().relationships['col-b'] ?? []
    expect(colBCards).toContain('a3')
    expect(colBCards.indexOf('a3')).toBe(colBCards.length - 1) // at end
  })
})
```

- [ ] **Step 2: Write Alt+ArrowUp/Down reorder tests**

```typescript
describe('kanban behavior — within-column reorder', () => {
  it('Alt+ArrowDown reorders card down within column', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'Alt+ArrowDown')
    const colACards = engine.getStore().relationships['col-a'] ?? []
    expect(colACards).toEqual(['a2', 'a1', 'a3'])
  })

  it('Alt+ArrowUp reorders card up within column', () => {
    const { engine } = setup('a2')
    pressKey(engine, 'Alt+ArrowUp')
    const colACards = engine.getStore().relationships['col-a'] ?? []
    expect(colACards).toEqual(['a2', 'a1', 'a3'])
  })
})
```

- [ ] **Step 3: Write batch move test (multi-select + Alt+Arrow)**

```typescript
describe('kanban behavior — batch move', () => {
  it('Alt+ArrowRight moves all selected cards to next column', () => {
    const { engine } = setup('a1')
    // Select a1 and a2
    pressKey(engine, 'Space') // select a1
    engine.dispatch(focusCommands.setFocus('a2'))
    pressKey(engine, 'Space') // select a2
    pressKey(engine, 'Alt+ArrowRight')
    const colBCards = engine.getStore().relationships['col-b'] ?? []
    expect(colBCards).toContain('a1')
    expect(colBCards).toContain('a2')
  })
})
```

- [ ] **Step 4: Write Escape + Mod+A tests**

```typescript
describe('kanban behavior — selection', () => {
  it('Mod+A selects all cards in current column', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'Mod+A')
    const selected = (engine.getStore().entities['__selection__']?.selectedIds as string[]) ?? []
    expect(selected).toEqual(['a1', 'a2', 'a3'])
  })

  it('Escape clears selection', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'Space') // select a1
    pressKey(engine, 'Escape')
    const selected = (engine.getStore().entities['__selection__']?.selectedIds as string[]) ?? []
    expect(selected).toEqual([])
  })
})
```

- [ ] **Step 5: Write N (create card) test**

```typescript
describe('kanban behavior — create card', () => {
  it('N creates new card after focused card', () => {
    const { engine } = setup('a1')
    const cardsBefore = engine.getStore().relationships['col-a']?.length ?? 0
    pressKey(engine, 'N')
    const cardsAfter = engine.getStore().relationships['col-a']?.length ?? 0
    expect(cardsAfter).toBe(cardsBefore + 1)
  })

  it('N on column header creates first card in empty column', () => {
    // Use setupWithEmpty from Task 2 Step 4
    const store = createStore({
      entities: {
        'col-a': { id: 'col-a', data: { title: 'A' } },
        'col-empty': { id: 'col-empty', data: { title: 'Empty' } },
        'a1': { id: 'a1', data: { title: 'A1' } },
      },
      relationships: {
        [ROOT_ID]: ['col-a', 'col-empty'],
        'col-a': ['a1'],
        'col-empty': [],
      },
    })
    const engine = createCommandEngine(store, [core(), dnd(), history()], vi.fn())
    engine.dispatch(expandCommands.expand('col-a'))
    engine.dispatch(expandCommands.expand('col-empty'))
    engine.dispatch(focusCommands.setFocus('col-empty'))
    pressKey(engine, 'N')
    const emptyCards = engine.getStore().relationships['col-empty'] ?? []
    expect(emptyCards.length).toBe(1)
  })
})
```

- [ ] **Step 6: Write undo test**

```typescript
describe('kanban behavior — undo cross-column move', () => {
  it('Mod+Z undoes cross-column move', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'Alt+ArrowRight') // move a1 to col-b
    expect(engine.getStore().relationships['col-b']).toContain('a1')

    pressKey(engine, 'Mod+Z')
    expect(engine.getStore().relationships['col-a']).toContain('a1')
    expect(engine.getStore().relationships['col-b']).not.toContain('a1')
  })
})
```

- [ ] **Step 7: Commit**

```bash
git add src/interactive-os/__tests__/kanban.test.ts
git commit -m "test: kanban behavior — cross-column move + undo tests (red)"
```

---

### Task 4: Kanban Behavior — Implementation

**Files:**
- Create: `src/interactive-os/behaviors/kanban.ts`

**Context:**

The kanban behavior implements cross-column navigation by looking up the store structure via `ctx.getChildren(ROOT_ID)`. It finds the column containing the focused card, then navigates to the same-index card in the adjacent column. This is implemented entirely in the keyMap — no changes to `createBehaviorContext` or plugins needed.

Key helper pattern:
```
findCardInfo(ctx, nodeId) → { columnId, columnIndex, cardIndex } | null
```
- `ctx.getChildren('__root__')` → column IDs
- For each column: `ctx.getChildren(colId)` → check if nodeId is in there
- If nodeId IS a column ID → it's a column header (cardIndex = -1)

`ROOT_ID` is imported from `'../core/types'` (value: `'__root__'`).

- [ ] **Step 1: Create kanban.ts with helper + keyMap**

```typescript
import type { AriaBehavior, BehaviorContext, NodeState } from './types'
import type { Command } from '../core/types'
import { ROOT_ID, createBatchCommand } from '../core/types'
import { focusCommands, selectionCommands } from '../plugins/core'
import { dndCommands } from '../plugins/dnd'
import { historyCommands } from '../plugins/history'
import { clipboardCommands } from '../plugins/clipboard'
import { crudCommands } from '../plugins/crud'
import { renameCommands } from '../plugins/rename'

interface CardInfo {
  columnId: string
  columnIndex: number
  cardIndex: number // -1 if focused on column header
}

function findCardInfoFor(ctx: BehaviorContext, nodeId: string): CardInfo | null {
  const columns = ctx.getChildren(ROOT_ID)
  const colIdx = columns.indexOf(nodeId)
  if (colIdx !== -1) return { columnId: nodeId, columnIndex: colIdx, cardIndex: -1 }
  for (let i = 0; i < columns.length; i++) {
    const cards = ctx.getChildren(columns[i]!)
    const cardIdx = cards.indexOf(nodeId)
    if (cardIdx !== -1) return { columnId: columns[i]!, columnIndex: i, cardIndex: cardIdx }
  }
  return null
}

function findCardInfo(ctx: BehaviorContext): CardInfo | null {
  return findCardInfoFor(ctx, ctx.focused)
}

function focusInColumn(ctx: BehaviorContext, columnId: string, targetIndex: number): Command {
  const cards = ctx.getChildren(columnId)
  if (cards.length === 0) return focusCommands.setFocus(columnId)
  const clamped = Math.min(Math.max(targetIndex, 0), cards.length - 1)
  return focusCommands.setFocus(cards[clamped]!)
}

export const kanban: AriaBehavior = {
  role: 'grid',
  childRole: 'row',
  focusStrategy: { type: 'roving-tabindex', orientation: 'both' },

  keyMap: {
    // ── Vertical navigation (within column) ──
    ArrowDown(ctx) {
      const info = findCardInfo(ctx)
      if (!info) return ctx.focusNext()
      if (info.cardIndex === -1) return ctx.focusChild() // column header → first card
      const cards = ctx.getChildren(info.columnId)
      if (info.cardIndex >= cards.length - 1) return focusCommands.setFocus(ctx.focused) // stay
      return focusCommands.setFocus(cards[info.cardIndex + 1]!)
    },

    ArrowUp(ctx) {
      const info = findCardInfo(ctx)
      if (!info) return ctx.focusPrev()
      if (info.cardIndex <= 0) return focusCommands.setFocus(ctx.focused) // stay (first card or header)
      return focusCommands.setFocus(ctx.getChildren(info.columnId)[info.cardIndex - 1]!)
    },

    // ── Horizontal navigation (cross-column) ──
    ArrowRight(ctx) {
      const info = findCardInfo(ctx)
      if (!info) return ctx.focusNext()
      const columns = ctx.getChildren(ROOT_ID)
      if (info.columnIndex >= columns.length - 1) return focusCommands.setFocus(ctx.focused) // last col
      const nextColId = columns[info.columnIndex + 1]!
      return focusInColumn(ctx, nextColId, info.cardIndex === -1 ? 0 : info.cardIndex)
    },

    ArrowLeft(ctx) {
      const info = findCardInfo(ctx)
      if (!info) return ctx.focusPrev()
      const columns = ctx.getChildren(ROOT_ID)
      if (info.columnIndex <= 0) return focusCommands.setFocus(ctx.focused) // first col
      const prevColId = columns[info.columnIndex - 1]!
      return focusInColumn(ctx, prevColId, info.cardIndex === -1 ? 0 : info.cardIndex)
    },

    // ── Home/End ──
    Home(ctx) {
      const info = findCardInfo(ctx)
      if (!info) return ctx.focusFirst()
      return focusInColumn(ctx, info.columnId, 0)
    },

    End(ctx) {
      const info = findCardInfo(ctx)
      if (!info) return ctx.focusLast()
      const cards = ctx.getChildren(info.columnId)
      return focusInColumn(ctx, info.columnId, cards.length - 1)
    },

    'Mod+Home'(ctx) {
      const columns = ctx.getChildren(ROOT_ID)
      if (columns.length === 0) return focusCommands.setFocus(ctx.focused)
      return focusInColumn(ctx, columns[0]!, 0)
    },

    'Mod+End'(ctx) {
      const columns = ctx.getChildren(ROOT_ID)
      if (columns.length === 0) return focusCommands.setFocus(ctx.focused)
      const lastCol = columns[columns.length - 1]!
      const cards = ctx.getChildren(lastCol)
      return focusInColumn(ctx, lastCol, cards.length - 1)
    },

    // ── Cross-column move (Alt+Arrow) — supports batch move for multi-select ──
    'Alt+ArrowRight'(ctx) {
      const info = findCardInfo(ctx)
      if (!info || info.cardIndex === -1) return
      const columns = ctx.getChildren(ROOT_ID)
      if (info.columnIndex >= columns.length - 1) return
      const targetCol = columns[info.columnIndex + 1]!
      // Batch move if multiple selected
      if (ctx.selected.length > 1) {
        const cmds = ctx.selected.map((id) => {
          const ci = findCardInfoFor(ctx, id)
          if (!ci || ci.cardIndex === -1) return null
          return dndCommands.moveTo(id, targetCol, Math.min(ci.cardIndex, ctx.getChildren(targetCol).length))
        }).filter(Boolean) as Command[]
        return cmds.length > 0 ? createBatchCommand(cmds) : undefined
      }
      const targetIndex = Math.min(info.cardIndex, ctx.getChildren(targetCol).length)
      return dndCommands.moveTo(ctx.focused, targetCol, targetIndex)
    },

    'Alt+ArrowLeft'(ctx) {
      const info = findCardInfo(ctx)
      if (!info || info.cardIndex === -1) return
      const columns = ctx.getChildren(ROOT_ID)
      if (info.columnIndex <= 0) return
      const targetCol = columns[info.columnIndex - 1]!
      if (ctx.selected.length > 1) {
        const cmds = ctx.selected.map((id) => {
          const ci = findCardInfoFor(ctx, id)
          if (!ci || ci.cardIndex === -1) return null
          return dndCommands.moveTo(id, targetCol, Math.min(ci.cardIndex, ctx.getChildren(targetCol).length))
        }).filter(Boolean) as Command[]
        return cmds.length > 0 ? createBatchCommand(cmds) : undefined
      }
      const targetIndex = Math.min(info.cardIndex, ctx.getChildren(targetCol).length)
      return dndCommands.moveTo(ctx.focused, targetCol, targetIndex)
    },

    // ── Within-column reorder ──
    'Alt+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
    'Alt+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),

    // ── Selection ──
    Space: (ctx) => ctx.toggleSelect(),
    'Mod+A'(ctx) {
      const info = findCardInfo(ctx)
      if (!info) return
      const cards = ctx.getChildren(info.columnId)
      if (cards.length === 0) return
      return selectionCommands.selectRange(cards)
    },

    // ── Editing ──
    Enter: (ctx) => renameCommands.startRename(ctx.focused),
    F2: (ctx) => renameCommands.startRename(ctx.focused),
    Escape(ctx) {
      // Cancel rename handled by Aria.Editable; this handles selection clear
      if (ctx.selected.length > 0) return selectionCommands.clearSelection()
    },

    // ── CRUD ──
    Delete: (ctx) => crudCommands.remove(ctx.focused),
    'N'(ctx) {
      const info = findCardInfo(ctx)
      if (!info) return
      const parentId = info.columnId
      const insertIndex = info.cardIndex === -1 ? 0 : info.cardIndex + 1
      return crudCommands.create(parentId, insertIndex)
    },
    'Ctrl+Enter'(ctx) {
      const info = findCardInfo(ctx)
      if (!info) return
      const parentId = info.columnId
      const insertIndex = info.cardIndex === -1 ? 0 : info.cardIndex + 1
      return crudCommands.create(parentId, insertIndex)
    },

    // ── Clipboard ──
    'Mod+C': (ctx) => clipboardCommands.copy(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
    'Mod+X': (ctx) => clipboardCommands.cut(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
    'Mod+V': (ctx) => clipboardCommands.paste(ctx.focused),

    // ── History ──
    'Mod+Z': () => historyCommands.undo(),
    'Mod+Shift+Z': () => historyCommands.redo(),
  },

  ariaAttributes: (_node, state: NodeState) => ({
    'aria-rowindex': String(state.index + 1),
    'aria-level': String(state.level + 1),
    'aria-selected': String(state.selected),
  }),
}
```

- [ ] **Step 2: Run tests**

Run: `pnpm test src/interactive-os/__tests__/kanban.test.ts`
Expected: All tests PASS

- [ ] **Step 3: Fix any failing tests, iterate until green**

- [ ] **Step 4: Commit**

```bash
git add src/interactive-os/behaviors/kanban.ts
git commit -m "feat: kanban behavior — cross-column keyboard navigation + move"
```

---

### Task 5: Kanban UI Component

**Files:**
- Create: `src/interactive-os/ui/kanban.css`
- Create: `src/interactive-os/ui/Kanban.tsx`

**Context:** Follow the Grid.tsx / TreeGrid.tsx pattern. The Kanban component wraps `<Aria>` with the kanban behavior and a custom render function that distinguishes columns (level 0) from cards (level 1) visually. CSS handles the horizontal column layout.

The columns must be pre-expanded so cards are visible. Use `expandCommands.expand` in a `useEffect` or provide pre-expanded data. Simplest: the Kanban component internally ensures all 1-depth entities are expanded.

- [ ] **Step 1: Create kanban.css**

```css
.kanban-board {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 4px;
}

.kanban-column {
  min-width: 220px;
  max-width: 280px;
  flex-shrink: 0;
  background: var(--surface-raised, #f5f5f5);
  border-radius: 8px;
  padding: 8px;
}

.kanban-column-header {
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary, #666);
  padding: 4px 8px 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.kanban-column-count {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-tertiary, #999);
}

.kanban-card {
  background: var(--surface, #fff);
  border: 1px solid var(--border, #e0e0e0);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.4;
  cursor: default;
}

.kanban-card[data-focused='true'] {
  outline: 2px solid var(--focus-ring, #2563eb);
  outline-offset: -2px;
}

.kanban-card[data-selected='true'] {
  background: var(--selection-bg, #eff6ff);
  border-color: var(--focus-ring, #2563eb);
}
```

- [ ] **Step 2: Create Kanban.tsx**

```typescript
import React from 'react'
import './kanban.css'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { kanban as kanbanBehavior } from '../behaviors/kanban'
import { core } from '../plugins/core'

interface KanbanProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  'aria-label'?: string
}

export function Kanban({
  data,
  plugins = [core()],
  onChange,
  'aria-label': ariaLabel,
}: KanbanProps) {
  const renderItem = (node: Record<string, unknown>, state: NodeState): React.ReactNode => {
    const d = node.data as Record<string, unknown> | undefined
    const title = (d?.title as string) ?? ''

    // Level 0 = column header
    if (state.level === 0) {
      return (
        <div className="kanban-column-header">
          <span>{title}</span>
        </div>
      )
    }

    // Level 1 = card
    return (
      <div className="kanban-card">
        <Aria.Editable field="title">{title}</Aria.Editable>
      </div>
    )
  }

  return (
    <Aria
      behavior={kanbanBehavior}
      data={data}
      plugins={plugins}
      onChange={onChange}
      aria-label={ariaLabel}
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
```

**Note:** The Aria component renders columns as top-level nodes and cards as nested children. CSS `.kanban-board` class on the Aria container handles horizontal layout. Verify that `<Aria>` passes through className or that we can style via the role selector `[role="grid"]`.

If `<Aria>` doesn't support className, wrap in a div:
```typescript
<div className="kanban-board">
  <Aria ...>
    <Aria.Item render={renderItem} />
  </Aria>
</div>
```

- [ ] **Step 3: Verify Kanban renders in dev**

Run: `pnpm dev`
Manually import Kanban in a temporary page or add to App.tsx early. Verify columns render side by side and cards stack vertically. Check that keyboard navigation works.

- [ ] **Step 4: Commit**

```bash
git add src/interactive-os/ui/kanban.css src/interactive-os/ui/Kanban.tsx
git commit -m "feat: Kanban UI component — horizontal columns, card rendering"
```

---

### Task 6: Collection Page + Route Integration

**Files:**
- Create: `src/pages/PageKanban.tsx`
- Modify: `src/App.tsx` (line ~164, add route to Collection items)

**Context:** Follow `PageGridCollection.tsx` pattern exactly. Plugins list: `[core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]`. Use custom keyboard table (not ApgKeyboardTable) since kanban is not an APG pattern.

- [ ] **Step 1: Create PageKanban.tsx**

```typescript
import { useState } from 'react'
import { Kanban } from '../interactive-os/ui/Kanban'
import type { NormalizedData } from '../interactive-os/core/types'
import { core } from '../interactive-os/plugins/core'
import { history } from '../interactive-os/plugins/history'
import { crud } from '../interactive-os/plugins/crud'
import { clipboard } from '../interactive-os/plugins/clipboard'
import { rename } from '../interactive-os/plugins/rename'
import { dnd } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focus-recovery'
import { kanbanInitialData } from './shared-kanban-data'

const plugins = [core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

export default function PageKanban() {
  const [data, setData] = useState<NormalizedData>(kanbanInitialData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Kanban</h2>
        <p className="page-desc">
          Keyboard-first kanban board — cross-column card movement with Alt+Arrow, full CRUD, undo/redo
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">card</span>{' '}
        <kbd>←→</kbd> <span className="key-hint">column</span>{' '}
        <kbd>Alt←→</kbd> <span className="key-hint">move column</span>{' '}
        <kbd>Alt↑↓</kbd> <span className="key-hint">reorder</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>{' '}
        <kbd>F2</kbd> <span className="key-hint">rename</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>
      </div>
      <div className="demo-section">
        <h3 className="demo-title">Project Board</h3>
        <Kanban
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="Project kanban board"
        />
      </div>
      <div className="demo-section">
        <h3 className="demo-title">Keyboard Interactions</h3>
        <table className="apg-table">
          <thead>
            <tr><th>Key</th><th>Function</th></tr>
          </thead>
          <tbody>
            <tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>Move focus to previous/next card in same column</td></tr>
            <tr><td><kbd>←</kbd> <kbd>→</kbd></td><td>Move focus to same-index card in adjacent column</td></tr>
            <tr><td><kbd>Alt+←</kbd> <kbd>Alt+→</kbd></td><td>Move card to adjacent column (preserving index)</td></tr>
            <tr><td><kbd>Alt+↑</kbd> <kbd>Alt+↓</kbd></td><td>Reorder card within column</td></tr>
            <tr><td><kbd>Home</kbd> / <kbd>End</kbd></td><td>First/last card in current column</td></tr>
            <tr><td><kbd>⌘Home</kbd> / <kbd>⌘End</kbd></td><td>First card in first column / last card in last column</td></tr>
            <tr><td><kbd>Space</kbd></td><td>Toggle card selection</td></tr>
            <tr><td><kbd>Enter</kbd> / <kbd>F2</kbd></td><td>Rename card title</td></tr>
            <tr><td><kbd>Escape</kbd></td><td>Cancel rename / clear selection</td></tr>
            <tr><td><kbd>N</kbd></td><td>Create new card after focused card</td></tr>
            <tr><td><kbd>Delete</kbd></td><td>Delete selected cards</td></tr>
            <tr><td><kbd>⌘C</kbd> / <kbd>⌘X</kbd> / <kbd>⌘V</kbd></td><td>Copy / cut / paste</td></tr>
            <tr><td><kbd>⌘Z</kbd> / <kbd>⌘⇧Z</kbd></td><td>Undo / redo</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add kanban route to App.tsx**

In `src/App.tsx`, add import at the top with other page imports:
```typescript
import PageKanban from './pages/PageKanban'
```

Add to the Collection items array (around line 164):
```typescript
{ path: 'kanban', label: 'Kanban', status: 'ready', component: PageKanban },
```

- [ ] **Step 3: Verify in browser**

Run: `pnpm dev`
Navigate to `/collection/kanban`. Verify:
- 4 columns render horizontally
- Cards render vertically within each column
- Arrow keys navigate within/across columns
- Alt+Arrow moves cards between columns
- F2 starts rename
- Undo/redo works

- [ ] **Step 4: Commit**

```bash
git add src/pages/PageKanban.tsx src/App.tsx
git commit -m "feat: kanban Collection page — /collection/kanban route"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests pass (existing + kanban)

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: 0 errors

- [ ] **Step 3: Build check**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Browser verification against PRD**

Run: `pnpm dev`, navigate to `/collection/kanban`

Verify all 16 PRD test scenarios:
1. Alt+→ moves card to next column ✓
2. Mod+Z undoes cross-column move ✓
3. ←→ moves focus across columns ✓
4. ↑↓ moves focus within column ✓
5. Alt+↑/↓ reorders within column ✓
6. F2 starts rename ✓
7. Space + Delete for multi-delete ✓
8. Move to empty column ✓
9. Copy/paste/cut works ✓
10. axe-core no violations ✓
11. Alt+→ then Alt+← returns to original index ✓
12. → into empty column focuses header ✓
13. N in empty column creates card ✓
14. Multi-select + Alt+→ moves all ✓
15. Rename blocks Alt+→ ✓
16. Tab exits widget ✓

- [ ] **Step 5: Update PROGRESS.md**

Add kanban entries under the appropriate sections.

- [ ] **Step 6: Final commit**

```bash
git add docs/PROGRESS.md
git commit -m "docs: update PROGRESS.md with kanban showcase"
```
