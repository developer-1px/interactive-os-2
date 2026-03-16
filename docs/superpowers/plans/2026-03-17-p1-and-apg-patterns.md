# P1 + Data-Handling APG Patterns — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Entity generics, selection model, 5 new APG behaviors (grid, combobox, radiogroup, alertdialog, switch), `<Aria.Cell>`, and useControlledAria to interactive-os.

**Architecture:** Each new behavior follows the existing pattern: `behaviors/*.ts` (AriaBehavior config) → `ui/*.tsx` (reference component) → `__tests__/*-keyboard.integration.test.tsx` (userEvent-based). Core extensions (Entity generics, selection model, BehaviorContext) are done first since they are dependencies.

**Tech Stack:** React 19, TypeScript, Vitest, @testing-library/react, @testing-library/user-event

**Spec:** `docs/superpowers/specs/2026-03-17-p1-and-apg-patterns-design.md` (v2)

---

## Chunk 1: Entity Generics

### Task 1: Entity<T> with data property

Migrate `Entity` from flat `{ id; [key]: unknown }` to `Entity<T>` with `data` property. `NormalizedData` stays non-generic (heterogeneous meta + user entities).

**Files:**
- Modify: `src/interactive-os/core/types.ts`
- Modify: `src/interactive-os/core/normalized-store.ts`

- [ ] **Step 1: Update Entity type in core/types.ts**

```ts
export interface Entity<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string
  data: T
}
```

`NormalizedData`, `Command`, `BatchCommand`, `TransformAdapter`, `Middleware`, `Plugin` — unchanged. `NormalizedData.entities` stays `Record<string, Entity>`.

- [ ] **Step 2: Add typed helpers to normalized-store.ts**

```ts
export function getEntityData<T extends Record<string, unknown>>(
  store: NormalizedData, id: string
): T | undefined {
  return store.entities[id]?.data as T | undefined
}

export function updateEntityData(
  store: NormalizedData, nodeId: string, updates: Record<string, unknown>
): NormalizedData {
  const existing = store.entities[nodeId]
  if (!existing) return store
  return {
    ...store,
    entities: {
      ...store.entities,
      [nodeId]: { ...existing, data: { ...existing.data, ...updates } },
    },
  }
}
```

Keep existing `updateEntity` for meta entities (root-level merge).

- [ ] **Step 3: Run tests — expect failures from entity shape changes**

Run: `pnpm test --run`
Expected: Many failures (entity fixtures lack `data` property)

- [ ] **Step 4: Commit types change**

```bash
git commit -m "refactor: add Entity<T> with data property, keep NormalizedData non-generic"
```

---

### Task 2: Migrate all entity creation sites

Update every entity fixture and creation to use `{ id, data: { ... } }` format.

**Files:**
- Modify: All `src/interactive-os/__tests__/*.test.ts(x)` (~20 files)
- Modify: All `src/pages/*.tsx` (~10 files)
- Modify: `src/interactive-os/plugins/crud.ts` (entity creation)
- Modify: `src/interactive-os/plugins/clipboard.ts` (entity cloning)
- Modify: `src/interactive-os/plugins/rename.ts` (reads/writes name)

- [ ] **Step 1: Update test fixtures**

Every `{ id: 'x', name: 'foo' }` → `{ id: 'x', data: { name: 'foo' } }`.
Every `{ id: 'x', name: 'foo', type: 'folder' }` → `{ id: 'x', data: { name: 'foo', type: 'folder' } }`.

- [ ] **Step 2: Update demo page data**

Same transformation for all `src/pages/*.tsx` createStore calls.

- [ ] **Step 3: Update plugins that read/write entity fields**

- `plugins/rename.ts`: `entity.name` → `entity.data.name`, use `updateEntityData`
- `plugins/clipboard.ts`: clone `entity.data` when copying
- `plugins/crud.ts`: entity creation wraps user fields in `data`

- [ ] **Step 4: Update entity access sites**

- All behaviors' `ariaAttributes`: `node.name` → `node.data.name`
- All UI `renderItem`: `item.name` → `(item.data as Record<string, unknown>).name`
- All UI `defaultRenderItem`: same
- Test assertions: `node.name` → `node.data.name`

- [ ] **Step 5: Run all tests**

Run: `pnpm test --run`
Expected: All 232 tests pass

- [ ] **Step 6: Run lint**

Run: `pnpm lint`
Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git commit -m "refactor: migrate all entities to use data property"
```

---

## Chunk 2: Selection Model + BehaviorContext Extensions

### Task 3: Selection model — single/multiple mode

**Files:**
- Modify: `src/interactive-os/behaviors/types.ts`
- Modify: `src/interactive-os/behaviors/create-behavior-context.ts`
- Modify: `src/interactive-os/hooks/use-aria.ts`
- Modify: `src/interactive-os/behaviors/tabs.ts`
- Create: `src/interactive-os/__tests__/selection-model.test.ts`

- [ ] **Step 1: Write failing test for single selection mode**

`src/interactive-os/__tests__/selection-model.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { createStore } from '../core/normalized-store'
import { createCommandEngine } from '../core/command-engine'
import { ROOT_ID } from '../core/types'
import { focusCommands, selectionCommands } from '../plugins/core'
import { createBehaviorContext } from '../behaviors/create-behavior-context'

function fixtureStore() {
  return createStore({
    entities: {
      a: { id: 'a', data: { name: 'A' } },
      b: { id: 'b', data: { name: 'B' } },
      c: { id: 'c', data: { name: 'C' } },
    },
    relationships: { [ROOT_ID]: ['a', 'b', 'c'] },
  })
}

describe('selection model', () => {
  describe('single mode', () => {
    it('toggleSelect in single mode replaces previous selection', () => {
      const engine = createCommandEngine(fixtureStore(), [], () => {})
      engine.dispatch(focusCommands.setFocus('a'))
      const ctx1 = createBehaviorContext(engine, { selectionMode: 'single' })
      engine.dispatch(ctx1.toggleSelect())

      engine.dispatch(focusCommands.setFocus('b'))
      const ctx2 = createBehaviorContext(engine, { selectionMode: 'single' })
      engine.dispatch(ctx2.toggleSelect())

      const ids = engine.getStore().entities['__selection__']?.selectedIds as string[]
      expect(ids).toEqual(['b'])
    })
  })

  describe('multiple mode (default)', () => {
    it('toggleSelect adds/removes independently', () => {
      const engine = createCommandEngine(fixtureStore(), [], () => {})
      engine.dispatch(focusCommands.setFocus('a'))
      const ctx1 = createBehaviorContext(engine)
      engine.dispatch(ctx1.toggleSelect())

      engine.dispatch(focusCommands.setFocus('b'))
      const ctx2 = createBehaviorContext(engine)
      engine.dispatch(ctx2.toggleSelect())

      const ids = engine.getStore().entities['__selection__']?.selectedIds as string[]
      expect(ids).toEqual(['a', 'b'])
    })
  })
})
```

- [ ] **Step 2: Add SelectionMode to types**

`src/interactive-os/behaviors/types.ts`:
```ts
export type SelectionMode = 'single' | 'multiple'

export interface AriaBehavior<TState extends NodeState = NodeState> {
  // ... existing
  selectionMode?: SelectionMode  // default: 'multiple'
}
```

- [ ] **Step 3: Wire selectionMode into BehaviorContext**

`src/interactive-os/behaviors/create-behavior-context.ts`:
- Add `selectionMode?: SelectionMode` to `BehaviorContextOptions`
- Update `toggleSelect()`: if `selectionMode === 'single'`, use `selectionCommands.select()` instead

`src/interactive-os/hooks/use-aria.ts`:
- Pass `behavior.selectionMode` into `behaviorCtxOptions`

- [ ] **Step 4: Set tabs to single selection**

`src/interactive-os/behaviors/tabs.ts`: add `selectionMode: 'single'`

- [ ] **Step 5: Run all tests**

Run: `pnpm test --run`
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: add selectionMode to behaviors — single/multiple"
```

---

### Task 4: BehaviorContext — wrap option for focusNext/focusPrev

**Files:**
- Modify: `src/interactive-os/behaviors/types.ts`
- Modify: `src/interactive-os/behaviors/create-behavior-context.ts`

- [ ] **Step 1: Update focusNext/focusPrev signatures**

`src/interactive-os/behaviors/types.ts`:
```ts
export interface BehaviorContext {
  // ...
  focusNext(options?: { wrap?: boolean }): Command
  focusPrev(options?: { wrap?: boolean }): Command
  // ... rest unchanged
}
```

- [ ] **Step 2: Implement wrap logic**

`src/interactive-os/behaviors/create-behavior-context.ts`:
```ts
focusNext(options?: { wrap?: boolean }): Command {
  const visible = getVisibleNodes(engine)
  const idx = visible.indexOf(focusedId)
  let nextId: string
  if (options?.wrap) {
    nextId = visible[(idx + 1) % visible.length] ?? focusedId
  } else {
    nextId = visible[idx + 1] ?? focusedId
  }
  return focusCommands.setFocus(nextId)
},

focusPrev(options?: { wrap?: boolean }): Command {
  const visible = getVisibleNodes(engine)
  const idx = visible.indexOf(focusedId)
  let prevId: string
  if (options?.wrap) {
    prevId = visible[(idx - 1 + visible.length) % visible.length] ?? focusedId
  } else {
    prevId = visible[idx - 1] ?? focusedId
  }
  return focusCommands.setFocus(prevId)
},
```

- [ ] **Step 3: Run all tests**

Run: `pnpm test --run`
Expected: All pass (no behavior uses wrap yet, existing calls without options unchanged)

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add wrap option to focusNext/focusPrev"
```

---

### Task 5: BehaviorContext — grid namespace for column navigation

**Files:**
- Modify: `src/interactive-os/behaviors/types.ts`
- Modify: `src/interactive-os/behaviors/create-behavior-context.ts`
- Modify: `src/interactive-os/plugins/core.ts`
- Modify: `src/interactive-os/hooks/use-aria.ts`

- [ ] **Step 1: Add GridNav interface and grid? to BehaviorContext**

`src/interactive-os/behaviors/types.ts`:
```ts
export interface GridNav {
  colIndex: number
  colCount: number
  focusNextCol(): Command
  focusPrevCol(): Command
  focusFirstCol(): Command
  focusLastCol(): Command
}

export interface BehaviorContext {
  // ... existing
  grid?: GridNav
}

export interface AriaBehavior<TState extends NodeState = NodeState> {
  // ... existing
  colCount?: number
}
```

- [ ] **Step 2: Add gridColCommands to core.ts**

```ts
const GRID_COL_ID = '__grid_col__'

export const gridColCommands = {
  setColIndex(colIndex: number): Command {
    let prev: number | undefined
    return {
      type: 'core:set-col-index',
      payload: { colIndex },
      execute(store) {
        prev = (store.entities[GRID_COL_ID]?.data as Record<string, unknown>)?.colIndex as number ?? 0
        return {
          ...store,
          entities: {
            ...store.entities,
            [GRID_COL_ID]: { id: GRID_COL_ID, data: { colIndex } },
          },
        }
      },
      undo(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [GRID_COL_ID]: { id: GRID_COL_ID, data: { colIndex: prev ?? 0 } },
          },
        }
      },
    }
  },
}
```

- [ ] **Step 3: Build grid namespace in create-behavior-context.ts**

Only populate `grid` when `options?.colCount` > 1:
```ts
const colCount = options?.colCount
const grid = colCount && colCount > 1 ? (() => {
  const currentCol = ((store.entities['__grid_col__']?.data as Record<string, unknown>)?.colIndex as number) ?? 0
  return {
    colIndex: currentCol,
    colCount,
    focusNextCol: () => gridColCommands.setColIndex(Math.min(currentCol + 1, colCount - 1)),
    focusPrevCol: () => gridColCommands.setColIndex(Math.max(currentCol - 1, 0)),
    focusFirstCol: () => gridColCommands.setColIndex(0),
    focusLastCol: () => gridColCommands.setColIndex(colCount - 1),
  }
})() : undefined
```

- [ ] **Step 4: Pass colCount through useAria**

Add `colCount: behavior.colCount` to `behaviorCtxOptions`.

- [ ] **Step 5: Run all tests, commit**

```bash
git commit -m "feat: add grid namespace to BehaviorContext for column navigation"
```

---

### Task 6: aria-activedescendant support + containerProps

**Files:**
- Modify: `src/interactive-os/hooks/use-aria.ts`
- Modify: `src/interactive-os/components/aria.tsx`

- [ ] **Step 1: Add containerProps to UseAriaReturn**

`src/interactive-os/hooks/use-aria.ts`:
```ts
export interface UseAriaReturn {
  // ... existing
  containerProps: Record<string, unknown>
}
```

- [ ] **Step 2: Build containerProps based on focus strategy**

When `aria-activedescendant`:
```ts
containerProps: {
  tabIndex: 0,
  'aria-activedescendant': focusedId || undefined,
  onKeyDown: (event: KeyboardEvent) => { /* same key handling as node onKeyDown */ },
}
```

When `roving-tabindex` or `natural-tab-order`:
```ts
containerProps: {} // empty, keyboard handling stays on nodes
```

- [ ] **Step 3: Skip node tabIndex/onKeyDown for activedescendant**

In `getNodeProps`, when `behavior.focusStrategy.type === 'aria-activedescendant'`:
- Don't set `tabIndex`
- Don't set `onKeyDown`
- Still set `onClick`, `role`, `data-node-id`, ariaAttrs

- [ ] **Step 4: Skip DOM focus sync for activedescendant**

In the `useEffect` that syncs DOM focus, skip when strategy is `aria-activedescendant`.

- [ ] **Step 5: Spread containerProps in AriaRoot**

`src/interactive-os/components/aria.tsx` — spread `aria.containerProps` onto the container div.

- [ ] **Step 6: Run all tests**

Run: `pnpm test --run`
Expected: All pass (no behavior uses activedescendant yet)

- [ ] **Step 7: Commit**

```bash
git commit -m "feat: add aria-activedescendant focus strategy and containerProps"
```

---

## Chunk 3: Simple Behaviors

### Task 7: Radiogroup behavior + UI + test

**Files:**
- Create: `src/interactive-os/behaviors/radiogroup.ts`
- Create: `src/interactive-os/ui/radiogroup.tsx`
- Create: `src/interactive-os/__tests__/radiogroup-keyboard.integration.test.tsx`
- Create: `src/pages/radiogroup.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write keyboard integration test**

Test wrapping navigation (ArrowDown from last → first, ArrowUp from first → last), ArrowRight/Left, Space selects (single mode), click selects, aria-checked attribute.

- [ ] **Step 2: Create radiogroup behavior**

```ts
export const radiogroup: AriaBehavior = {
  role: 'radiogroup',
  childRole: 'radio',
  selectionMode: 'single',
  keyMap: {
    ArrowDown: (ctx) => ctx.focusNext({ wrap: true }),
    ArrowUp: (ctx) => ctx.focusPrev({ wrap: true }),
    ArrowRight: (ctx) => ctx.focusNext({ wrap: true }),
    ArrowLeft: (ctx) => ctx.focusPrev({ wrap: true }),
    Space: (ctx) => ctx.toggleSelect(),
  },
  focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
  activateOnClick: true,
  ariaAttributes: (_node, state: NodeState) => ({
    'aria-checked': String(state.selected),
  }),
}
```

- [ ] **Step 3: Create RadioGroup UI + demo page + route**
- [ ] **Step 4: Run all tests, commit**

```bash
git commit -m "feat: add radiogroup behavior — wrapping nav, single selection, aria-checked"
```

---

### Task 8: Alertdialog behavior + test

**Files:**
- Create: `src/interactive-os/behaviors/alertdialog.ts`
- Create: `src/interactive-os/__tests__/alertdialog-keyboard.integration.test.tsx`
- Create: `src/pages/alertdialog.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write test** — Escape closes, role="alertdialog", aria-modal="true"
- [ ] **Step 2: Create alertdialog behavior**

```ts
export const alertdialog: AriaBehavior = {
  role: 'alertdialog',
  childRole: 'group',
  keyMap: { Escape: (ctx) => ctx.collapse() },
  focusStrategy: { type: 'natural-tab-order', orientation: 'vertical' },
  ariaAttributes: (_node, state: NodeState) => {
    const attrs: Record<string, string> = { 'aria-modal': 'true' }
    if (state.expanded !== undefined) attrs['aria-expanded'] = String(state.expanded)
    return attrs
  },
}
```

- [ ] **Step 3: Demo page + route**
- [ ] **Step 4: Run all tests, commit**

```bash
git commit -m "feat: add alertdialog behavior — dialog variant with aria-modal"
```

---

### Task 9: Switch behavior + UI + test

**Files:**
- Create: `src/interactive-os/behaviors/switch.ts`
- Create: `src/interactive-os/ui/switch-group.tsx`
- Create: `src/interactive-os/__tests__/switch-keyboard.integration.test.tsx`
- Create: `src/pages/switch.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write test** — Space toggles, Enter toggles, click toggles, aria-checked tracks expanded state
- [ ] **Step 2: Create switch behavior**

```ts
export const switchBehavior: AriaBehavior = {
  role: 'switch',
  childRole: 'switch',
  keyMap: {
    Enter: (ctx) => ctx.activate(),
    Space: (ctx) => ctx.activate(),
  },
  focusStrategy: { type: 'natural-tab-order', orientation: 'vertical' },
  expandable: true,
  activateOnClick: true,
  ariaAttributes: (_node, state: NodeState) => ({
    'aria-checked': String(state.expanded ?? false),
  }),
}
```

- [ ] **Step 3: SwitchGroup UI + demo page + route**
- [ ] **Step 4: Run all tests, commit**

```bash
git commit -m "feat: add switch behavior — toggle via expanded state, aria-checked"
```

---

## Chunk 4: Grid + Aria.Cell

### Task 10: Grid behavior

**Files:**
- Create: `src/interactive-os/behaviors/grid.ts`

- [ ] **Step 1: Create grid factory**

```ts
export function grid(options: { columns: number }): AriaBehavior {
  return {
    role: 'grid',
    childRole: 'row',
    colCount: options.columns,
    keyMap: {
      ArrowDown: (ctx) => ctx.focusNext(),
      ArrowUp: (ctx) => ctx.focusPrev(),
      ArrowRight: (ctx) => { const cmd = ctx.grid?.focusNextCol(); return cmd ?? ctx.focusNext() },
      ArrowLeft: (ctx) => { const cmd = ctx.grid?.focusPrevCol(); return cmd ?? ctx.focusPrev() },
      Home: (ctx) => { const cmd = ctx.grid?.focusFirstCol(); return cmd ?? ctx.focusFirst() },
      End: (ctx) => { const cmd = ctx.grid?.focusLastCol(); return cmd ?? ctx.focusLast() },
      'Mod+Home': (ctx) => ctx.focusFirst(),
      'Mod+End': (ctx) => ctx.focusLast(),
      Space: (ctx) => ctx.toggleSelect(),
    },
    focusStrategy: { type: 'roving-tabindex', orientation: 'both' },
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-rowindex': String(state.index + 1),
      'aria-selected': String(state.selected),
    }),
  }
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: add grid behavior factory — 2D row/col navigation"
```

---

### Task 11: `<Aria.Cell>` component

**Files:**
- Modify: `src/interactive-os/components/aria.tsx`

- [ ] **Step 1: Add AriaNodeContext for passing nodeId to cells**

```tsx
const AriaNodeContext = React.createContext<{ nodeId: string; focused: boolean } | null>(null)
```

- [ ] **Step 2: Wrap node render in AriaNodeContext.Provider**

In AriaNode's renderNodes, wrap each rendered node:
```tsx
<AriaNodeContext.Provider value={{ nodeId: childId, focused: state.focused }}>
  {render(entity, state)}
</AriaNodeContext.Provider>
```

- [ ] **Step 3: Implement AriaCell**

```tsx
function AriaCell({ index, children }: { index: number; children: ReactNode }) {
  const nodeCtx = React.useContext(AriaNodeContext)
  return (
    <AriaInternalContext.Consumer>
      {(aria) => {
        if (!aria || !nodeCtx) throw new Error('<Aria.Cell> must be inside <Aria.Node>')
        const store = aria.getStore()
        const focusedCol = ((store.entities['__grid_col__']?.data as Record<string, unknown>)?.colIndex as number) ?? 0
        const isFocusedCell = nodeCtx.focused && index === focusedCol
        return (
          <div role="gridcell" aria-colindex={index + 1} tabIndex={isFocusedCell ? 0 : -1}>
            {children}
          </div>
        )
      }}
    </AriaInternalContext.Consumer>
  )
}
```

- [ ] **Step 4: Export AriaCell on Aria compound**

```ts
export const Aria = Object.assign(AriaRoot, { Node: AriaNode, Cell: AriaCell })
```

- [ ] **Step 5: Remove hardcoded gridcell for behaviors with colCount**

In AriaNode, skip `needsGridcell` wrapping when behavior has `colCount` (consumer uses `<Aria.Cell>` instead). Keep it for treegrid backward compat (no `colCount`).

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: add <Aria.Cell> for grid multi-column support"
```

---

### Task 12: Grid keyboard integration test + UI + demo

**Files:**
- Create: `src/interactive-os/__tests__/grid-keyboard.integration.test.tsx`
- Create: `src/interactive-os/ui/grid.tsx`
- Modify: `src/pages/grid.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write keyboard integration test**

Test: ArrowDown/Up row nav, ArrowRight/Left col nav, Home/End first/last col, Mod+Home/End first/last row, Space select, aria-rowindex, aria-colindex.

- [ ] **Step 2: Create Grid UI component**
- [ ] **Step 3: Replace grid page WIP placeholder**
- [ ] **Step 4: Run all tests, commit**

```bash
git commit -m "feat: add Grid UI component, tests, and demo page"
```

---

## Chunk 5: Combobox

### Task 13: Combobox plugin

**Files:**
- Create: `src/interactive-os/plugins/combobox.ts`

- [ ] **Step 1: Implement comboboxCommands + plugin**

`open()`, `close()`, `setFilter(text)`, `selectAndClose(nodeId)` commands. All undoable.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: add combobox plugin — open/close/filter/selectAndClose"
```

---

### Task 14: Combobox behavior + UI + test

**Files:**
- Create: `src/interactive-os/behaviors/combobox.ts`
- Create: `src/interactive-os/ui/combobox.tsx`
- Create: `src/interactive-os/__tests__/combobox-keyboard.integration.test.tsx`
- Modify: `src/pages/combobox.tsx`

- [ ] **Step 1: Write keyboard integration test**

Test: ArrowDown opens + navigates, Enter selects + closes, Escape closes, aria-activedescendant on container, aria-expanded.

- [ ] **Step 2: Create combobox behavior**

```ts
export const combobox: AriaBehavior = {
  role: 'combobox',
  childRole: 'option',
  keyMap: {
    ArrowDown: (ctx) => ctx.isExpanded ? ctx.focusNext() : ctx.expand(),
    ArrowUp: (ctx) => ctx.focusPrev(),
    Enter: (ctx) => ctx.activate(),
    Escape: (ctx) => ctx.collapse(),
    Home: (ctx) => ctx.focusFirst(),
    End: (ctx) => ctx.focusLast(),
  },
  focusStrategy: { type: 'aria-activedescendant', orientation: 'vertical' },
  ariaAttributes: (_node, state: NodeState) => ({
    'aria-selected': String(state.selected),
  }),
}
```

- [ ] **Step 3: Create Combobox UI**

Uses `useAria` directly (not `<Aria>` component) to attach `containerProps` to `<input>`. Renders dropdown list conditionally based on `__combobox__` isOpen state.

- [ ] **Step 4: Replace combobox page WIP placeholder**
- [ ] **Step 5: Run all tests, commit**

```bash
git commit -m "feat: add combobox — input + listbox, aria-activedescendant"
```

---

## Chunk 6: useControlledAria + Cleanup

### Task 15: useControlledAria hook

**Files:**
- Create: `src/interactive-os/hooks/use-controlled-aria.ts`
- Create: `src/interactive-os/__tests__/use-controlled-aria.test.tsx`

- [ ] **Step 1: Write test**

Test: onDispatch called on keyboard event, reads store from props, updates when store changes externally.

- [ ] **Step 2: Extract shared logic from use-aria.ts**

Factor out `getNodeState`, `getNodeProps` computation into internal helpers.

- [ ] **Step 3: Implement useControlledAria**

```ts
export function useControlledAria(options: {
  behavior: AriaBehavior
  store: NormalizedData
  plugins?: Plugin[]
  onDispatch: (command: Command) => void
}): UseAriaReturn
```

- [ ] **Step 4: Run all tests, commit**

```bash
git commit -m "feat: add useControlledAria hook for external store integration"
```

---

### Task 16: PROGRESS.md + final verification

**Files:**
- Modify: `docs/PROGRESS.md`

- [ ] **Step 1: Run full test suite**

Run: `pnpm test --run`

- [ ] **Step 2: Run lint**

Run: `pnpm lint`

- [ ] **Step 3: Run build**

Run: `pnpm build:lib`

- [ ] **Step 4: Update PROGRESS.md**

Check off completed P1 items. Add new behaviors. Update test count.

- [ ] **Step 5: Commit**

```bash
git commit -m "docs: update PROGRESS.md — P1 complete, 5 new APG behaviors"
```
