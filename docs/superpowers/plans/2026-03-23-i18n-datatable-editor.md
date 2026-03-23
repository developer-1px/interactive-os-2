# i18n DataTable Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an independent Route with Grid + plugins that validates os spreadsheet editing fundamentals — replace edit, Tab cell traversal, empty cell confirm, cell clipboard — using i18n sample data.

**Architecture:** Extend existing rename plugin (replace mode), navigate axis (Tab cycle), Aria.Editable (replace + allowEmpty), clipboard plugin (cell mode). All extensions are opt-in to avoid breaking existing Grid usage. New Route at `/collection/i18n` with sample NormalizedData.

**Tech Stack:** React, Vitest, @testing-library/react, userEvent, existing interactive-os engine

**PRD:** `docs/superpowers/specs/2026-03-23-i18n-datatable-editor-prd.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `src/interactive-os/plugins/rename.ts` | Add `replace` + `initialChar` to startRename command |
| Modify | `src/interactive-os/components/aria.tsx` (AriaEditable) | Replace mode rendering + `allowEmpty` prop |
| Modify | `src/interactive-os/axes/navigate.ts` | Add `tabCycle` option for grid Tab/Shift+Tab traversal |
| Modify | `src/interactive-os/plugins/clipboard.ts` | Add cell-level copy/paste mode |
| Modify | `src/interactive-os/ui/Grid.tsx` | Wire replace keyMap + compositionstart + Tab editing continuation |
| Create | `src/pages/sharedI18nData.ts` | Sample i18n NormalizedData (key × ko/en/ja) |
| Create | `src/pages/PageI18nDataTable.tsx` | Route page for `/collection/i18n` |
| Modify | `src/App.tsx` | Add Route entry to collection group |
| Create | `src/__tests__/i18n-datatable.integration.test.tsx` | Integration tests for all PRD verification scenarios |
| Modify | `src/interactive-os/__tests__/rename-ui.test.tsx` | Add replace mode + allowEmpty tests |

---

### Task 1: rename plugin — replace mode

Extend `startRename` to accept optional `{ replace: true, initialChar?: string }`. Store `replace` flag in `__rename__` entity so Aria.Editable can read it.

**Files:**
- Modify: `src/interactive-os/plugins/rename.ts`
- Test: `src/interactive-os/__tests__/rename-ui.test.tsx`

- [ ] **Step 1: Write failing test — startRename with replace flag stores replace state**

```typescript
// In rename-ui.test.tsx, add new describe block:
describe('Replace mode', () => {
  it('startRename with replace stores replace flag in rename entity', () => {
    const { container } = setupWithKeyMap()
    const firstNode = container.querySelector('[data-node-id="a"]')!
    // Dispatch startRename with replace mode
    act(() => { fireEvent.keyDown(firstNode, { key: 'F2' }) })
    // For now, just verify existing test still works — we'll add replace-specific test after implementation
  })
})
```

- [ ] **Step 2: Run test to verify baseline passes**

Run: `npx vitest run src/interactive-os/__tests__/rename-ui.test.tsx`

- [ ] **Step 3: Extend startRename to accept replace options**

In `src/interactive-os/plugins/rename.ts`, modify `startRename`:

```typescript
startRename(nodeId: string, options?: { replace?: boolean; initialChar?: string }): Command {
  return {
    type: 'rename:start',
    payload: { nodeId, ...options },
    execute(store) {
      return {
        ...store,
        entities: {
          ...store.entities,
          [RENAME_ID]: {
            id: RENAME_ID,
            nodeId,
            active: true,
            replace: options?.replace ?? false,
            initialChar: options?.initialChar,
          },
        },
      }
    },
    undo(store) {
      const { [RENAME_ID]: _removed, ...rest } = store.entities
      void _removed
      return { ...store, entities: rest }
    },
  }
},
```

- [ ] **Step 4: Run tests to verify no regression**

Run: `npx vitest run src/interactive-os/__tests__/rename-ui.test.tsx`
Expected: All existing tests PASS — startRename without options still works (default replace=false).

- [ ] **Step 5: Commit**

```
feat: rename plugin — add replace mode option to startRename
```

---

### Task 2: Aria.Editable — replace mode + allowEmpty

Read `replace`/`initialChar` from rename entity state. When replace=true, clear text and insert initialChar. Add `allowEmpty` prop to allow confirming empty strings.

**Files:**
- Modify: `src/interactive-os/components/aria.tsx` (AriaEditable, lines 156-253)
- Test: `src/interactive-os/__tests__/rename-ui.test.tsx`

- [ ] **Step 1: Write failing test — replace mode clears text and inserts initialChar**

```typescript
// In rename-ui.test.tsx:
it('replace mode clears existing text and inserts initialChar', () => {
  // Render a custom setup that dispatches startRename with replace
  const { container } = render(<TestListBox keyMap={{
    'a': (ctx) => renameCommands.startRename(ctx.focused, { replace: true, initialChar: 'a' }),
  }} />)
  const node = container.querySelector('[data-node-id="a"]')!
  act(() => { fireEvent.keyDown(node, { key: 'a' }) })

  const editable = container.querySelector('[contenteditable]')!
  expect(editable.textContent).toBe('a') // not 'Alpha', not 'aAlpha'
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/interactive-os/__tests__/rename-ui.test.tsx -t "replace mode"`
Expected: FAIL — editable still shows 'Alpha'

- [ ] **Step 3: Implement replace mode in AriaEditable**

In `aria.tsx`, modify the `AriaEditable` component:

1. Read replace/initialChar from rename state:
```typescript
// After: const renaming = nodeCtx?.renaming ?? false
// Add reading replace state from the AriaInternalContext store
const renameEntity = ariaCtx?.getEntity?.('__rename__')
const replaceMode = (renameEntity as any)?.replace === true
const initialChar = (renameEntity as any)?.initialChar as string | undefined
```

2. In the `useEffect` for `renaming`, after focus, handle replace mode:
```typescript
if (replaceMode) {
  el.textContent = initialChar ?? ''
  // Place cursor at end
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
} else {
  // existing selection logic
}
```

Note: Check how AriaEditable reads store — it may need `ariaCtx` to expose `getEntity` or read from data prop. Examine AriaInternalContext shape to find the right approach.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/interactive-os/__tests__/rename-ui.test.tsx -t "replace mode"`
Expected: PASS

- [ ] **Step 5: Write failing test — allowEmpty confirms empty string**

```typescript
it('with allowEmpty, empty string is confirmed (not cancelled)', () => {
  const { container } = render(<TestListBox keyMap={{
    'F2': (ctx) => renameCommands.startRename(ctx.focused),
  }} />)
  // Enter rename on first node
  const node = container.querySelector('[data-node-id="a"]')!
  act(() => { fireEvent.keyDown(node, { key: 'F2' }) })

  const editable = container.querySelector('[contenteditable]')!
  // Clear content
  act(() => {
    editable.textContent = ''
    fireEvent.keyDown(editable, { key: 'Enter' })
  })

  // With default behavior (allowEmpty=false), empty cancels → value should be 'Alpha'
  // This test establishes baseline
  expect(node.textContent).toBe('Alpha')
})
```

- [ ] **Step 6: Run test to verify baseline**

- [ ] **Step 7: Add allowEmpty prop to AriaEditable**

In `aria.tsx`, add `allowEmpty` prop:
```typescript
function AriaEditable({ field, placeholder, selection = 'all', allowEmpty = false, children }: {
  field: string; placeholder?: string; selection?: 'all' | 'end'; allowEmpty?: boolean; children: React.ReactNode
})
```

Modify the `confirm` function:
```typescript
const confirm = () => {
  if (committedRef.current || !nodeCtx || !ariaCtx) return
  committedRef.current = true
  const el = editRef.current
  const newValue = el?.textContent?.trim() ?? ''
  if (!allowEmpty && newValue === '' || newValue === originalValueRef.current) {
    // cancel logic
  } else {
    // confirm logic — this now allows empty strings when allowEmpty=true
  }
}
```

Fix operator precedence: `(!allowEmpty && newValue === '') || newValue === originalValueRef.current`

- [ ] **Step 8: Write test for allowEmpty=true behavior**

Need a test harness that passes `allowEmpty` to Aria.Editable. Modify TestListBox to accept allowEmpty prop.

- [ ] **Step 9: Run all rename tests**

Run: `npx vitest run src/interactive-os/__tests__/rename-ui.test.tsx`
Expected: All PASS

- [ ] **Step 10: Commit**

```
feat: Aria.Editable — replace mode + allowEmpty option
```

---

### Task 3: navigate axis — Tab cell cycle (opt-in)

Add `tabCycle: true` option to grid navigate. Tab moves to next column, wraps at row boundaries. Shift+Tab reverses.

**Files:**
- Modify: `src/interactive-os/axes/navigate.ts`
- Test: `src/interactive-os/__tests__/grid-keyboard.integration.test.tsx`

- [ ] **Step 1: Write failing test — Tab moves to next column**

```typescript
// In grid-keyboard.integration.test.tsx, new describe block:
describe('Tab cell cycle (tabCycle: true)', () => {
  // Need a fixture that uses navigate({ grid: { columns: 3, tabCycle: true } })
  // Render a Grid with tabCycle enabled
  it('Tab moves focus to next column', async () => {
    const user = userEvent.setup()
    // Render grid, focus first cell [row-1, col-0]
    // Tab → expect [row-1, col-1]
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/interactive-os/__tests__/grid-keyboard.integration.test.tsx -t "Tab cell cycle"`
Expected: FAIL — Tab not handled by navigate axis

- [ ] **Step 3: Extend NavigateOptions and grid keyMap**

In `src/interactive-os/axes/navigate.ts`:

```typescript
export interface NavigateOptions {
  orientation?: 'vertical' | 'horizontal' | 'both'
  wrap?: boolean
  grid?: { columns: number; tabCycle?: boolean }
}
```

In the grid branch, when `tabCycle` is true, add Tab/Shift+Tab:

```typescript
if (options.grid.tabCycle) {
  keyMap['Tab'] = (ctx: BehaviorContext) => ctx.grid?.focusNextCol({ wrap: true }) ?? ctx.focusNext()
  keyMap['Shift+Tab'] = (ctx: BehaviorContext) => ctx.grid?.focusPrevCol({ wrap: true }) ?? ctx.focusPrev()
}
```

Note: Check if `GridNav.focusNextCol` supports wrap option. If not, implement Tab as: if at last col, focusNext (next row) + focusFirstCol. May need a new command or compound logic. Examine `GridNav` interface in `BehaviorContext`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/interactive-os/__tests__/grid-keyboard.integration.test.tsx`
Expected: New test PASS, existing tests PASS (tabCycle is opt-in)

- [ ] **Step 5: Write test — Tab wraps from last col to next row first col**

- [ ] **Step 6: Write test — Tab at last row last col stops (E5, no wrap)**

- [ ] **Step 7: Write test — Shift+Tab reverses**

- [ ] **Step 7b: Write test — Shift+Tab at first row first col stops (E6)**

- [ ] **Step 8: Run all grid tests**

Run: `npx vitest run src/interactive-os/__tests__/grid-keyboard.integration.test.tsx`

- [ ] **Step 9: Commit**

```
feat: navigate axis — opt-in Tab cell cycle for grid mode
```

---

### Task 4: Sample data (dependency for Task 5 tests)

Create sample i18n data file. This is extracted early because Task 5's integration tests need it.

**Files:**
- Create: `src/pages/sharedI18nData.ts`

- [ ] **Step 1: Create sharedI18nData.ts**

```typescript
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'

export const i18nColumns = [
  { key: 'key', header: 'Key' },
  { key: 'ko', header: 'ko' },
  { key: 'en', header: 'en' },
  { key: 'ja', header: 'ja' },
]

export const i18nInitialData = createStore({
  entities: {
    'hero-title':    { id: 'hero-title',    data: { cells: ['hero.title',    '헤드리스 ARIA 엔진',       'Headless ARIA Engine',       ''] } },
    'hero-subtitle': { id: 'hero-subtitle', data: { cells: ['hero.subtitle', '모든 ARIA role을 지원하는', 'Build fully accessible apps', ''] } },
    'nav-home':      { id: 'nav-home',      data: { cells: ['nav.home',      '홈',                        'Home',                        'ホーム'] } },
    'nav-about':     { id: 'nav-about',     data: { cells: ['nav.about',     '소개',                      'About',                       '紹介'] } },
    'nav-contact':   { id: 'nav-contact',   data: { cells: ['nav.contact',   '문의',                      'Contact',                     ''] } },
    'stat-patterns': { id: 'stat-patterns', data: { cells: ['stat.patterns', '14',                       '14',                          '14'] } },
    'stat-plugins':  { id: 'stat-plugins',  data: { cells: ['stat.plugins',  '10',                       '10',                          '10'] } },
    'cta-start':     { id: 'cta-start',     data: { cells: ['cta.start',     '시작하기',                  'Get Started',                 ''] } },
    'cta-docs':      { id: 'cta-docs',      data: { cells: ['cta.docs',      '문서 보기',                 'View Docs',                   'ドキュメント'] } },
    'footer-copy':   { id: 'footer-copy',   data: { cells: ['footer.copy',   '© 2026 interactive-os',    '© 2026 interactive-os',       '© 2026 interactive-os'] } },
  },
  relationships: {
    [ROOT_ID]: [
      'hero-title', 'hero-subtitle',
      'nav-home', 'nav-about', 'nav-contact',
      'stat-patterns', 'stat-plugins',
      'cta-start', 'cta-docs',
      'footer-copy',
    ],
  },
})
```

- [ ] **Step 2: Commit**

```
feat: add i18n sample data for DataTable Editor
```

---

### Task 5: Grid.tsx — replace edit keyMap + compositionstart + Tab continuation

Wire printable key → startRename(replace) and compositionstart → startRename(replace) in Grid component. Also wire Tab to confirm+move+re-enter editing.

**Files:**
- Modify: `src/interactive-os/ui/Grid.tsx`
- Test: `src/__tests__/i18n-datatable.integration.test.tsx` (create)

- [ ] **Step 1: Create integration test file with basic fixture**

Create `src/__tests__/i18n-datatable.integration.test.tsx` with a Grid setup using i18n sample data (`sharedI18nData.ts` from Task 4), all plugins + enableEditing + tabCycle.

- [ ] **Step 2: Write failing test — printable key starts replace edit (V1)**

```typescript
it('V1: printable key on editable cell starts replace edit', async () => {
  // Focus cell [row-1, col-1] (ko column)
  // Press 'a'
  // Expect: contenteditable visible, text = 'a' (not original value)
})
```

- [ ] **Step 3: Run test to verify it fails**

- [ ] **Step 4: Add replace keyMap to Grid**

In `src/interactive-os/ui/Grid.tsx`, extend `editingKeyMap` or create a new mechanism:

The challenge: keyMap handlers receive `BehaviorContext` which has `focused` (node ID) but no column info. For replace edit, we need to know which cell the user is on. The Grid keyMap needs access to column index — check if `BehaviorContext.grid` provides current column.

Check `GRID_COL_ID` in core plugin — this stores current column as a special entity. Read it to determine:
1. Which column is focused (to skip read-only key column)
2. Which field to edit (cells[colIndex])

Approach: In Grid component, use `onKeyDown` at the container level (or via `onUnhandledKey` in the engine) to intercept printable keys and compositionstart, then dispatch startRename with replace.

- [ ] **Step 5: Add compositionstart handler for Korean input (V2, E10)**

In Grid component, add `onCompositionStart` handler at the grid container level (NOT inside Aria.Editable — this fires BEFORE editing starts):

```typescript
// On the Aria wrapper or grid container:
onCompositionStart={(e) => {
  // If not already editing, start replace edit
  // Read current column from engine state
  // If column is read-only (index 0), ignore
  // Otherwise: dispatch startRename(focused, { replace: true })
}}
```

- [ ] **Step 6: Write test for V2 — Korean compositionstart triggers replace**

- [ ] **Step 7: Write test for E2 — read-only cell ignores printable key**

- [ ] **Step 8: Wire Tab editing continuation in Aria.Editable**

Current Tab in Aria.Editable calls `confirm()` which exits editing. For Tab continuation, use this concrete data flow:

**Data flow:**
1. Aria.Editable Tab handler: set `tabContinue: true` on `__rename__` entity BEFORE confirm
2. `confirm()` dispatches `confirmRename` → sets `active: false` but `tabContinue` persists
3. After confirm, Aria.Editable does NOT call `e.preventDefault()` on Tab — lets it bubble up
4. Navigate axis Tab handler fires → moves focus to next cell
5. Grid.tsx adds a middleware or useEffect that watches: if `__rename__.tabContinue === true` AND `__rename__.active === false` → dispatch `startRename(newFocused)` and clear `tabContinue`

**Implementation:**

In `Aria.Editable` onKeyDown Tab handler:
```typescript
} else if (e.key === 'Tab') {
  // Mark tabContinue before confirming — rename entity persists after confirm
  if (ariaCtx && nodeCtx) {
    // Set tabContinue flag via direct store update or a new command
  }
  confirm()
  // Do NOT preventDefault — let Tab bubble to navigate axis
}
```

In `Grid.tsx`, add a rename plugin middleware or useEffect:
```typescript
// After render, check if tabContinue is set
const renameEntity = data.entities['__rename__']
if (renameEntity?.tabContinue && !renameEntity?.active) {
  // dispatch startRename on currently focused node
  // clear tabContinue
}
```

**Key decision:** `tabContinue` is stored in the `__rename__` entity (same as `active`, `replace`, `nodeId`). This avoids new concepts — it's just another flag on the existing rename state.

**E9 (blur confirm) note:** Existing Aria.Editable blur → confirm() already works. Replace mode doesn't change blur behavior because `originalValueRef` is captured on rename entry.

- [ ] **Step 9: Write test for V3 — Tab confirms and moves to next cell with editing**

- [ ] **Step 10: Write test for V4 — Tab at last col wraps to next row**

- [ ] **Step 11: Run all tests**

Run: `npx vitest run src/__tests__/i18n-datatable.integration.test.tsx`

- [ ] **Step 12: Commit**

```
feat: Grid — replace edit via printable key + compositionstart + Tab continuation
```

---

### Task 6: Route page + smoke test

Create the route page at `/collection/i18n` using sample data from Task 4.

**Files:**
- Create: `src/pages/PageI18nDataTable.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create PageI18nDataTable.tsx**

```typescript
import { useState } from 'react'
import type { NormalizedData } from '../interactive-os/core/types'
import { Grid } from '../interactive-os/ui/Grid'
import { core } from '../interactive-os/plugins/core'
import { rename } from '../interactive-os/plugins/rename'
import { history } from '../interactive-os/plugins/history'
import { crud } from '../interactive-os/plugins/crud'
import { clipboard } from '../interactive-os/plugins/clipboard'
import { dnd } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'
import { i18nColumns, i18nInitialData } from './sharedI18nData'

const plugins = [core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

export default function PageI18nDataTable() {
  const [data, setData] = useState<NormalizedData>(i18nInitialData)

  const renderCell = (value: unknown, column: { key: string }) => {
    const text = String(value ?? '')
    const isEmpty = text === '' && column.key !== 'key'
    return (
      <span className={isEmpty ? 'cell-empty' : undefined}>
        {isEmpty ? '—' : text}
      </span>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">i18n DataTable</h2>
        <p className="page-desc">
          Spreadsheet-style translation editor — type to replace, Tab to traverse, ⌘Z to undo
        </p>
      </div>
      <div className="page-keys">
        <kbd>Type</kbd> <span className="key-hint">replace edit</span>{' '}
        <kbd>F2</kbd> <span className="key-hint">preserve edit</span>{' '}
        <kbd>Tab</kbd> <span className="key-hint">next cell</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>⌘C/V</kbd> <span className="key-hint">copy/paste</span>
      </div>
      <div className="demo-section">
        <div style={{ border: '1px solid var(--border, #e0e0e0)', borderRadius: 8, overflow: 'hidden' }}>
          <div className="grid-header">
            {i18nColumns.map((col) => (
              <div key={col.key} className="grid-header-cell">
                {col.header}
              </div>
            ))}
          </div>
          <Grid
            data={data}
            columns={i18nColumns}
            plugins={plugins}
            onChange={setData}
            enableEditing
            renderCell={renderCell}
            aria-label="i18n Translation Table"
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add route to App.tsx**

In the `collection` RouteGroup items array, add:
```typescript
{ path: 'i18n', label: 'i18n DataTable', status: 'ready', component: PageI18nDataTable },
```

Add import at top:
```typescript
import PageI18nDataTable from './pages/PageI18nDataTable'
```

- [ ] **Step 3: Smoke test — route renders, empty cells get cell-empty class (V8)**

```typescript
// In i18n-datatable.integration.test.tsx (already created in Task 5):
it('V8: empty cells are visually distinguished with cell-empty class', () => {
  // Render Grid with i18n sample data
  // Find cells with empty values (ja column of hero-title)
  // Assert: element has class 'cell-empty' or data-empty attribute
  // Assert: non-empty cells do NOT have the class
})
```

- [ ] **Step 4: Verify app builds**

Run: `npx vite build`

- [ ] **Step 5: Commit**

```
feat: add i18n DataTable route with sample translation data
```

---

### Task 7: Clipboard plugin — cell-level copy/paste

Extend clipboard to support cell-value-level copy/paste when in Grid cell context.

**Files:**
- Modify: `src/interactive-os/plugins/clipboard.ts`
- Modify: `src/interactive-os/ui/Grid.tsx`
- Test: `src/__tests__/i18n-datatable.integration.test.tsx`

> Note: This task depends on Tasks 1-6 being complete. If the workload is too large, this can be moved to backlog (importance: 🔴 high).

- [ ] **Step 1: Write failing test — V7: cell copy/paste**

```typescript
it('V7: Mod+C on cell copies cell value, Mod+V pastes to another cell', async () => {
  // Focus cell [row-1, col-1] (value: '헤드리스 ARIA 엔진')
  // Mod+C
  // Move to cell [row-2, col-1]
  // Mod+V
  // Expect: cell [row-2, col-1] value = '헤드리스 ARIA 엔진'
})
```

- [ ] **Step 2: Add copyCellValue/pasteCellValue to clipboardCommands**

Approach: Separate commands (not mixing with row-level). This satisfies N3 (no default mode change).

```typescript
// In clipboard.ts:
let cellValueBuffer: string = ''

copyCellValue(nodeId: string, colIndex: number): Command {
  return {
    type: 'clipboard:copyCellValue',
    payload: { nodeId, colIndex },
    execute(store) {
      const entity = getEntity(store, nodeId)
      const cells = (entity?.data as any)?.cells as unknown[] | undefined
      cellValueBuffer = String(cells?.[colIndex] ?? '')
      return store // no store change
    },
    undo(store) { return store },
  }
},

pasteCellValue(nodeId: string, colIndex: number): Command {
  let previousValue: unknown
  return {
    type: 'clipboard:pasteCellValue',
    payload: { nodeId, colIndex },
    execute(store) {
      const entity = getEntity(store, nodeId)
      const cells = [...((entity?.data as any)?.cells ?? [])]
      previousValue = cells[colIndex]
      cells[colIndex] = cellValueBuffer
      return updateEntityData(store, nodeId, { cells })
    },
    undo(store) {
      const entity = getEntity(store, nodeId)
      const cells = [...((entity?.data as any)?.cells ?? [])]
      cells[colIndex] = previousValue
      return updateEntityData(store, nodeId, { cells })
    },
  }
},
```

- [ ] **Step 3: Wire Grid.tsx to dispatch cell commands**

**Column index resolution:** Grid.tsx reads `GRID_COL_ID` from the engine's core plugin state (stored as special entity `__gridCol__` with `col` field). This gives the current column index.

**KeyMap ownership:** Grid.tsx overrides Mod+C/V in its `editingKeyMap` when `enableEditing` is true:

```typescript
// In Grid.tsx editingKeyMap:
'Mod+C': (ctx) => {
  const colIndex = getGridColIndex(ctx) // read from __gridCol__ entity
  if (colIndex !== undefined) {
    return clipboardCommands.copyCellValue(ctx.focused, colIndex)
  }
  return clipboardCommands.copy(ctx.selected.length > 0 ? ctx.selected : [ctx.focused])
},
'Mod+V': (ctx) => {
  const colIndex = getGridColIndex(ctx)
  if (colIndex !== undefined) {
    return clipboardCommands.pasteCellValue(ctx.focused, colIndex)
  }
  return clipboardCommands.paste(ctx.focused)
},
```

This way: Grid with enableEditing → cell-level. Grid without → row-level (existing clipboard plugin keyMap). Non-Grid widgets → row-level (clipboard plugin default). N3 satisfied.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/__tests__/i18n-datatable.integration.test.tsx -t "V7"`

- [ ] **Step 5: Commit**

```
feat: clipboard plugin — cell-level copy/paste for Grid
```

---

### Task 8: Full integration test suite (verification pass)

Write remaining PRD verification scenarios as integration tests. This is a verification pass — all features should already be implemented in Tasks 1-7. If tests fail, fix the implementation in the relevant task's code before proceeding.

**Files:**
- Test: `src/__tests__/i18n-datatable.integration.test.tsx`

- [ ] **Step 1: Write V3 — Tab confirms and moves to next cell with editing**
- [ ] **Step 2: Write V4 — Tab at last col wraps to next row**
- [ ] **Step 3: Write V5 — Korean composition + Tab**
- [ ] **Step 4: Write V6 — Mod+Z undo chain**
- [ ] **Step 5: Write V8 — empty cell visual distinction**
- [ ] **Step 6: Write V9 — arrow keys in edit mode = text cursor**
- [ ] **Step 7: Write V10 — read-only cell ignores printable key**
- [ ] **Step 8: Write V11 — Korean composition + Escape**
- [ ] **Step 9: Write V12 — Tab at last cell stops**
- [ ] **Step 10: Write V13 — empty string confirm with allowEmpty**
- [ ] **Step 11: Write V14 — Escape after replace entry restores original**
- [ ] **Step 12: Write V15 — blur confirms edit**
- [ ] **Step 13: Write V16 — F2 preserve mode**
- [ ] **Step 14: Write V17 — F2 on read-only cell**
- [ ] **Step 15: Run full test suite**

Run: `npx vitest run src/__tests__/i18n-datatable.integration.test.tsx`
Expected: All 17 scenarios PASS

- [ ] **Step 16: Commit**

```
test: i18n DataTable — full PRD verification suite (V1-V17)
```
