# P1 Items + Data-Handling APG Patterns — Design Spec

**Date:** 2026-03-17
**Scope:** P1 backlog items + new APG behaviors that manage data (grid, combobox, radiogroup, alertdialog, switch)
**Revision:** v2 — incorporated spec review feedback (C1-C3, I1-I4, S2-S3)

---

## 1. Entity Generics (`Entity<T>`)

### Problem
`Entity` is `{ id: string; [key: string]: unknown }` — consumers cast everywhere.

### Design
```ts
interface Entity<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string
  data: T
}
```

**Rejected: flattening `T` onto Entity.** Flattening collides with internal keys (`id`) and makes type narrowing impossible.

**`NormalizedData` stays non-generic.** The entities map holds heterogeneous types (user entities + meta entities like `__focus__`, `__selection__`). Meta entities use the base `Entity` type without `data`, or with internal `data` shapes. Parameterizing `NormalizedData<T>` with a single `T` is impossible since the map is heterogeneous.

**Two update paths:**
- `updateEntity(store, id, updates)` — root-level merge for meta entities (unchanged)
- `updateEntityData<T>(store, id, updates: Partial<T>)` — merges into `entity.data` for user entities (new)

**Typed read helper:**
```ts
function getEntityData<T>(store: NormalizedData, id: string): T | undefined {
  return store.entities[id]?.data as T | undefined
}
```

**Migration:** `node.name` → `node.data.name`. All existing behaviors, UI components, and tests update. Meta entities (`__focus__`, `__selection__`, `__expanded__`) remain as-is since they don't use the `data` property.

### Impact
- `core/types.ts` — `Entity<T>`, NormalizedData (non-generic)
- `core/normalized-store.ts` — add `updateEntityData<T>`, `getEntityData<T>`
- All behaviors' `ariaAttributes` — access `node.data.x`
- All UI components' `renderItem` — access `node.data.x`
- All tests — update entity creation and assertions
- Demo pages — update data shapes

---

## 2. Selection Model Expansion

### Problem
Current selection is always "multiple toggle" — no single-select mode, no Shift range selection.

### Design
Add `selectionMode` to `BehaviorContext` and `AriaBehavior`:

```ts
type SelectionMode = 'single' | 'multiple' | 'extended'
```

- **single:** `select()` replaces. `toggleSelect()` = `select()`. Max 1 selected.
- **multiple:** Current behavior. `toggleSelect()` adds/removes.
- **extended:** Like multiple, plus `Shift+Click` / `Shift+Arrow` range selection.

Implementation:
- `__selection__` meta entity gains `anchorId: string | null` for range selection tracking
- `selectionCommands` gains `selectRange(anchorId, targetId)` for extended mode
- `BehaviorContext` gains `selectRange()` that uses anchor + current focused
- `AriaBehavior` gains optional `selectionMode?: SelectionMode` (default: `'multiple'`)
- `select()` and `toggleSelect()` commands update `anchorId` to the newly selected item

**Behaviors using single:** radiogroup, tabs (already single via `activate()`)
**Behaviors using extended:** listbox, treegrid (opt-in via `selectionMode: 'extended'`)

---

## 3. Grid Behavior (2D Navigation)

### Problem
No 2D row×col navigation. treegrid is 1D (rows only).

### Design
Grid = flat rows with cells. Each row is an entity. Cells are a **fixed-schema property** on the row entity, not child entities in the tree.

```ts
// Row entity example
{ id: 'row-1', data: { cells: ['Name', 'Age', 'Email'] } }
```

**Column focus tracking:** `__grid_col__` meta entity stores `{ colIndex: number }`.

**BehaviorContext: namespaced grid navigation (avoids polluting shared interface):**
```ts
interface GridNav {
  colIndex: number
  colCount: number
  focusNextCol(): Command
  focusPrevCol(): Command
  focusFirstCol(): Command
  focusLastCol(): Command
}

interface BehaviorContext {
  // existing...
  grid?: GridNav  // undefined for non-grid behaviors
}
```

Grid behavior's keyMap accesses `ctx.grid?.focusNextCol()`.

**grid behavior:**
- role: `grid`, childRole: `row`
- keyMap: ArrowDown/Up (row), ArrowRight/Left (col), Home/End (row start/end), Mod+Home/End (grid start/end)
- focusStrategy: `roving-tabindex`, orientation: `both`
- ariaAttributes: `aria-colindex`, `aria-rowindex`, `aria-selected`

**grid colCount:** Provided via behavior option. Consumer declares `grid({ columns: 3 })`.

Grid behavior is a **factory function:**
```ts
export function grid(options: { columns: number }): AriaBehavior { ... }
```

---

## 4. Combobox Behavior

### Problem
No input+listbox composite widget.

### Design
Combobox is unique: the focusable element is an `<input>`, not rendered nodes. This requires `aria-activedescendant` focus strategy.

**Store meta:** `__combobox__` entity: `{ isOpen: boolean, filterText: string }`

**New commands (`comboboxCommands`):**
- `open()` — set isOpen = true
- `close()` — set isOpen = false
- `setFilter(text: string)` — update filterText (optional, only needed if using history plugin for undo/redo of filter state)
- `selectAndClose(id: string)` — select + close in one command

**Behavior:**
- role: `combobox`, childRole: `option`
- keyMap: ArrowDown (open + focusNext), ArrowUp (focusPrev), Enter (selectAndClose), Escape (close), Home/End
- focusStrategy: `aria-activedescendant`, orientation: `vertical`

**`aria-activedescendant` support in `use-aria.ts`:**
When `focusStrategy.type === 'aria-activedescendant'`:
- `useAria` returns `containerProps` containing `aria-activedescendant`, `onKeyDown`, `tabIndex: 0`
- Nodes do NOT get `tabIndex` or `onKeyDown` — they are not directly focusable
- DOM focus stays on container (the input)
- No `useEffect` focus sync for individual nodes
- `AriaRoot` spreads `containerProps` onto its container div
- Combobox `ui/combobox.tsx` uses `useAria` directly (not `<Aria>`) and attaches `containerProps` to the `<input>`

**Combobox is NOT a simple behavior file.** It needs:
1. `behaviors/combobox.ts` — the AriaBehavior
2. `plugins/combobox.ts` — comboboxCommands + combobox() plugin
3. `ui/combobox.tsx` — UI component with `<input>` + dropdown rendering

**Filtering:** Consumer-side. `setFilter` stores the text, consumer reads it from store and filters entities before passing `data` prop. The behavior doesn't filter — it only tracks the filter text for undo/redo.

---

## 5. `<Aria.Cell>` Component

### Problem
Current gridcell wrapping is hardcoded in `<Aria.Node>`. No multi-column support.

### Design
```tsx
// Consumer usage:
<Aria behavior={grid({ columns: 3 })} data={data} plugins={plugins}>
  <Aria.Node render={(node, state) => (
    <Aria.Cell index={0}>{node.data.name}</Aria.Cell>
    <Aria.Cell index={1}>{node.data.age}</Aria.Cell>
    <Aria.Cell index={2}>{node.data.email}</Aria.Cell>
  )} />
</Aria>
```

`<Aria.Cell>`:
- role: `gridcell`
- `tabIndex`: 0 if this cell is the focused col of the focused row, -1 otherwise
- `aria-colindex`: index + 1
- Reads current `colIndex` from context + node's focused state

Remove hardcoded gridcell wrapping from `<Aria.Node>`. If no `<Aria.Cell>` is used, the node content renders directly (non-grid behaviors).

---

## 6. useControlledAria Hook

### Problem
No way to sync interactive-os state with external stores (Zustand, Jotai, Redux).

### Design
Named `useControlledAria` (not `useExternalStore`) to avoid confusion with React's `useSyncExternalStore`.

```ts
function useControlledAria(options: {
  behavior: AriaBehavior
  store: NormalizedData
  plugins?: Plugin[]
  onDispatch: (command: Command) => void
}): UseAriaReturn
```

Key difference from `useAria`: instead of managing state internally via `useState` + `createCommandEngine`, it:
1. Takes `store` as controlled state (re-reads every render)
2. Calls `onDispatch(command)` instead of `engine.dispatch()`
3. Consumer applies `command.execute(store)` in their external store

This is a **thin adapter** — it reuses `getNodeState`, `getNodeProps`, and keyboard handling from `useAria` internals, but delegates state management to the consumer.

**Implementation:** Extract shared logic from `useAria` into internal helpers. Both `useAria` and `useControlledAria` use these helpers.

---

## 7. New Behaviors: radiogroup, alertdialog, switch

### radiogroup
- role: `radiogroup`, childRole: `radio`
- keyMap: ArrowDown/Right (focusNext wrapping), ArrowUp/Left (focusPrev wrapping), Space (select)
- focusStrategy: `roving-tabindex`, orientation: `vertical`
- selectionMode: `single`
- ariaAttributes: `aria-checked` (= selected)
- **Wrapping navigation:** `focusNext({ wrap: true })` / `focusPrev({ wrap: true })` — adds `wrap` option to existing methods instead of new `focusNextWrap`/`focusPrevWrap`.

### alertdialog
- role: `alertdialog`, childRole: `group`
- keyMap: Escape (collapse/close)
- focusStrategy: `natural-tab-order`, orientation: `vertical`
- ariaAttributes: `aria-modal="true"`, `aria-expanded`
- Nearly identical to dialog. Separate behavior file for correct role.

### switch
- role: `switch`, childRole: `switch` (not omitted — explicitly set to valid ARIA role)
- keyMap: Space (toggle), Enter (toggle)
- focusStrategy: `natural-tab-order`, orientation: `vertical`
- expandable: true — reuses `__expanded__` store for checked state
- activateOnClick: true
- ariaAttributes: `aria-checked` = expanded state

---

## 8. Implementation Order

Dependencies flow top-down:

1. **Entity generics** — touches everything, do first to avoid double-migration
2. **Selection model** — needed by radiogroup, grid, combobox
3. **BehaviorContext extensions** — `grid?` namespace (grid), `wrap` option (radiogroup), `containerProps` (combobox)
4. **New behaviors** — radiogroup, alertdialog, switch (simple, use new selection model)
5. **grid + `<Aria.Cell>`** — depends on grid nav + Entity generics
6. **combobox** — depends on activedescendant + selection + filter commands
7. **useControlledAria** — independent, can go anywhere after Entity generics
8. **UI components** for all new behaviors
9. **Demo pages** for all new behaviors
10. **Keyboard integration tests** for all new behaviors

---

## 9. Files Changed/Created

### Modified
- `core/types.ts` — Entity<T> (NormalizedData stays non-generic)
- `core/normalized-store.ts` — add `updateEntityData<T>`, `getEntityData<T>`
- `core/command-engine.ts` — no change needed
- `behaviors/types.ts` — BehaviorContext: `grid?` namespace, `wrap` option, selectionMode, containerProps
- `behaviors/create-behavior-context.ts` — grid nav, wrap option
- `components/aria.tsx` — remove hardcoded gridcell, containerProps, AriaCell, AriaNodeContext
- `hooks/use-aria.ts` — activedescendant strategy, containerProps, extract shared logic
- `plugins/core.ts` — selection mode logic, anchorId, gridColCommands
- All existing behaviors — `node.data.x` access
- All existing UI components — `node.data.x` access
- All existing tests — entity shape updates
- All demo pages — entity shape updates

### Created
- `behaviors/grid.ts`
- `behaviors/combobox.ts`
- `behaviors/radiogroup.ts`
- `behaviors/alertdialog.ts`
- `behaviors/switch.ts`
- `plugins/combobox.ts`
- `hooks/use-controlled-aria.ts`
- `ui/grid.tsx`
- `ui/combobox.tsx`
- `ui/radiogroup.tsx`
- `ui/switch-group.tsx`
- `pages/grid.tsx` (replace WIP placeholder)
- `pages/combobox.tsx` (replace WIP placeholder)
- `pages/radiogroup.tsx`
- `pages/switch.tsx`
- `__tests__/grid-keyboard.integration.test.tsx`
- `__tests__/combobox-keyboard.integration.test.tsx`
- `__tests__/radiogroup-keyboard.integration.test.tsx`
- `__tests__/alertdialog-keyboard.integration.test.tsx`
- `__tests__/switch-keyboard.integration.test.tsx`
- `__tests__/selection-model.test.ts`
