# P1 Items + Data-Handling APG Patterns — Design Spec

**Date:** 2026-03-17
**Scope:** P1 backlog items + new APG behaviors that manage data (grid, combobox, radiogroup, alertdialog, switch)

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

**Migration:** `node.name` → `node.data.name`. All existing behaviors, UI components, and tests update. `NormalizedData` becomes `NormalizedData<T>` with default `Record<string, unknown>` for backward compat.

Store functions (`addEntity`, `updateEntity`, etc.) become generic. `updateEntity<T>(store, id, updates: Partial<T>)` updates `entity.data`.

### Impact
- `core/types.ts` — `Entity<T>`, `NormalizedData<T>`
- `core/normalized-store.ts` — generic store functions
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
- `selectionCommands` gains `selectRange(anchorId, targetId)` for extended mode
- `BehaviorContext` gains `selectRange()` that uses anchor (last selected) + current focused
- `AriaBehavior` gains optional `selectionMode?: SelectionMode` (default: `'multiple'`)
- `core()` plugin's `select` command checks the behavior's mode

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

**BehaviorContext additions:**
```ts
interface BehaviorContext {
  // existing...
  colIndex: number
  colCount: number
  focusNextCol(): Command
  focusPrevCol(): Command
  focusFirstCol(): Command
  focusLastCol(): Command
}
```

For non-grid behaviors, `colIndex = 0`, `colCount = 1`, col methods return noop focus command.

**grid behavior:**
- role: `grid`, childRole: `row`
- keyMap: ArrowDown/Up (row), ArrowRight/Left (col), Home/End (row start/end), Ctrl+Home/End (grid start/end)
- focusStrategy: `roving-tabindex`, orientation: `both`
- ariaAttributes: `aria-colindex`, `aria-rowindex`, `aria-selected`

**`<Aria.Cell>` component:**
```tsx
function AriaCell({ children }: { children: ReactNode }) {
  // Renders a gridcell div with proper tabindex based on colIndex
}
```

Replaces the current hardcoded gridcell wrapping in `<Aria.Node>`. AriaCell reads from context which col it represents.

**grid colCount:** Provided via behavior option, not auto-detected. Consumer declares `grid({ columns: 3 })`.

Grid behavior is a **factory function** (like how `core()` returns a Plugin):
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
- `setFilter(text: string)` — update filterText, used by consumer to filter visible nodes
- `selectAndClose(id: string)` — select + close in one command

**Behavior:**
- role: `combobox`, childRole: `option`
- keyMap: ArrowDown (open + focusNext), ArrowUp (focusPrev), Enter (selectAndClose), Escape (close), Home/End
- focusStrategy: `aria-activedescendant`, orientation: `vertical`

**`aria-activedescendant` support in `use-aria.ts`:**
When `focusStrategy.type === 'aria-activedescendant'`:
- Container gets `aria-activedescendant={focusedId}`
- Nodes do NOT get `tabIndex` — they are not directly focusable
- DOM focus stays on container (the input)
- No `useEffect` focus sync needed

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

## 6. useExternalStore Hook

### Problem
No way to sync interactive-os state with external stores (Zustand, Jotai, Redux).

### Design
```ts
function useExternalStore<T>(options: {
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

**Implementation:** Extract shared logic from `useAria` into internal helpers. Both `useAria` and `useExternalStore` use these helpers.

---

## 7. New Behaviors: radiogroup, alertdialog, switch

### radiogroup
- role: `radiogroup`, childRole: `radio`
- keyMap: ArrowDown/Right (focusNext, wrapping), ArrowUp/Left (focusPrev, wrapping), Space (select)
- focusStrategy: `roving-tabindex`, orientation: `vertical`
- selectionMode: `single`
- ariaAttributes: `aria-checked` (= selected)
- **Wrapping navigation:** Unlike other behaviors, arrow keys wrap from last→first. Add `focusNextWrap()` / `focusPrevWrap()` to BehaviorContext.

### alertdialog
- role: `alertdialog`, childRole: `group`
- keyMap: Escape (collapse/close)
- focusStrategy: `natural-tab-order`, orientation: `vertical`
- ariaAttributes: `aria-modal="true"`, `aria-expanded`
- Nearly identical to dialog. Separate behavior file for correct role.

### switch
- role: `switch`, childRole: none (standalone)
- keyMap: Space (toggle), Enter (toggle)
- focusStrategy: `natural-tab-order`, orientation: `vertical`
- expandable: true — reuses `__expanded__` store for checked state
- activateOnClick: true
- ariaAttributes: `aria-checked` = expanded state
- **No childRole** — switch is a single toggle element, not a container. This is the first behavior without children. `<Aria.Node>` renders each entity as a standalone switch.

---

## 8. Implementation Order

Dependencies flow top-down:

1. **Entity generics** — touches everything, do first to avoid double-migration
2. **Selection model** — needed by radiogroup, grid, combobox
3. **BehaviorContext extensions** — col nav (grid), wrap nav (radiogroup), activedescendant (combobox)
4. **New behaviors** — radiogroup, alertdialog, switch (simple, use new selection model)
5. **grid + `<Aria.Cell>`** — depends on col nav + Entity generics
6. **combobox** — depends on activedescendant + selection + filter commands
7. **useExternalStore** — independent, can go anywhere after Entity generics
8. **UI components** for all new behaviors
9. **Demo pages** for all new behaviors
10. **Keyboard integration tests** for all new behaviors

---

## 9. Files Changed/Created

### Modified
- `core/types.ts` — Entity<T>, NormalizedData<T>
- `core/normalized-store.ts` — generic functions
- `core/command-engine.ts` — generic passthrough
- `behaviors/types.ts` — BehaviorContext extensions, selectionMode
- `behaviors/create-behavior-context.ts` — col nav, wrap nav
- `components/aria.tsx` — remove hardcoded gridcell, aria-activedescendant
- `hooks/use-aria.ts` — activedescendant strategy, extract shared logic
- `plugins/core.ts` — selection mode logic, selectRange
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
- `components/aria-cell.tsx` (or inline in aria.tsx)
- `hooks/use-external-store.ts`
- `ui/grid.tsx`
- `ui/combobox.tsx`
- `ui/radiogroup.tsx`
- `ui/alertdialog.tsx` (or reuse dialog UI)
- `ui/switch.tsx`
- `pages/grid.tsx`
- `pages/combobox.tsx`
- `pages/radiogroup.tsx`
- `pages/switch.tsx`
- `__tests__/grid-keyboard.integration.test.tsx`
- `__tests__/combobox-keyboard.integration.test.tsx`
- `__tests__/radiogroup-keyboard.integration.test.tsx`
- `__tests__/alertdialog-keyboard.integration.test.tsx`
- `__tests__/switch-keyboard.integration.test.tsx`
- `__tests__/selection-model.test.ts`
- `__tests__/entity-generics.test.ts`
