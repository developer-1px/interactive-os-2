# Pointer Interaction Support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add click/pointer interaction support so that clicking nodes triggers selection, expand, and activation — matching keyboard behavior parity.

**Architecture:** Extend `AxisConfig` with `selectOnClick` (auto-set by `select()` axis). Extend `useAria` with `onPointerDown` (captures pre-focus ctx for Shift+Click anchor) and enhanced `onClick` (dispatches select/extend/toggle based on modifiers). Update tree/treegrid behaviors to enable `activateOnClick`. Add Combobox component click handlers.

**Critical design decisions:**
- `onPointerDown` captures BehaviorContext before browser focus fires, preserving anchor for Shift+Click range selection. `anchorResetMiddleware` clears anchor on every `core:focus` command, and `onFocus` fires between `pointerdown` and `click`.
- Tree/treegrid use `activate({ onClick: true })` without `toggleExpand`. `ctx.activate()` already checks `children.length > 0` and calls `toggleExpand` for folders, `select` for leaves (see `createBehaviorContext.ts:155-158`).
- Plain click dispatches `select(id) + setAnchor(id)` as a batch, so future Shift+Click has a valid anchor.
- `event.defaultPrevented` guard on onClick prevents double-processing in nested aria instances.

**Tech Stack:** React, TypeScript, @testing-library/react, userEvent

**PRD:** `docs/superpowers/specs/2026-03-22-pointer-interaction-prd.md`

---

### Task 1: Add `selectOnClick` to type system and select axis

**Files:**
- Modify: `src/interactive-os/axes/composePattern.ts` — add `selectOnClick` to `AxisConfig`
- Modify: `src/interactive-os/behaviors/types.ts` — add `selectOnClick` to `AriaBehavior`
- Modify: `src/interactive-os/axes/select.ts` — emit `selectOnClick: true` in config
- Test: `src/interactive-os/__tests__/compose-pattern.test.ts`

- [ ] **Step 1: Write test — select axis emits selectOnClick config**

In `compose-pattern.test.ts`, add:

```ts
it('select() axis sets selectOnClick: true in composed behavior', () => {
  const behavior = composePattern(
    { role: 'listbox', childRole: 'option', ariaAttributes: () => ({}) },
    select(),
  )
  expect(behavior.selectOnClick).toBe(true)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/interactive-os/__tests__/compose-pattern.test.ts`
Expected: FAIL — `selectOnClick` property doesn't exist

- [ ] **Step 3: Add `selectOnClick` to AxisConfig**

In `src/interactive-os/axes/composePattern.ts`, add to `AxisConfig`:
```ts
selectOnClick: boolean
```

And in `composePattern()` function, add to both v1 and v2 paths:
```ts
...(mergedConfig.selectOnClick !== undefined && { selectOnClick: mergedConfig.selectOnClick }),
```

- [ ] **Step 4: Add `selectOnClick` to AriaBehavior type**

In `src/interactive-os/behaviors/types.ts`, add to `AriaBehavior`:
```ts
/** When true, clicking a node selects it. Shift+Click = range, Ctrl/Cmd+Click = toggle. Auto-set by select() axis. */
selectOnClick?: boolean
```

- [ ] **Step 5: Make select() axis emit selectOnClick: true**

In `src/interactive-os/axes/select.ts`, change the return to:
```ts
return { keyMap, config: { selectionMode: mode, selectOnClick: true } }
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm vitest run src/interactive-os/__tests__/compose-pattern.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/interactive-os/axes/composePattern.ts src/interactive-os/behaviors/types.ts src/interactive-os/axes/select.ts src/interactive-os/__tests__/compose-pattern.test.ts
git commit -m "feat: add selectOnClick to AxisConfig, auto-set by select() axis"
```

---

### Task 2: Extend useAria onClick handler with select + modifier support

**Files:**
- Modify: `src/interactive-os/hooks/useAria.ts:244-254` — add onPointerDown + extend onClick
- Test: `src/interactive-os/__tests__/pointer-interaction.test.tsx` (new)

**Key mechanism:** `onPointerDown` fires before browser focus → captures `BehaviorContext` with current anchor/focus. `onClick` fires after `onFocus` → uses captured ctx for Shift+Click, fresh dispatch for plain/Ctrl+Click.

- [ ] **Step 1: Write failing tests for click selection**

Create `src/interactive-os/__tests__/pointer-interaction.test.tsx`:

```tsx
/**
 * Integration test: Pointer (click) interactions
 *
 * Tests click → selection, Shift+Click → range, Ctrl+Click → toggle.
 * Uses userEvent.click() → DOM/ARIA state verification.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../components/aria'
import { listbox } from '../behaviors/listbox'
import { tree } from '../behaviors/tree'
import { treegrid } from '../behaviors/treegrid'
import { composePattern } from '../axes/composePattern'
import { select } from '../axes/select'
import { activate } from '../axes/activate'
import { navigate } from '../axes/navigate'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core } from '../plugins/core'

function fixtureStore(): NormalizedData {
  return createStore({
    entities: {
      a: { id: 'a', data: { label: 'A' } },
      b: { id: 'b', data: { label: 'B' } },
      c: { id: 'c', data: { label: 'C' } },
      d: { id: 'd', data: { label: 'D' } },
      e: { id: 'e', data: { label: 'E' } },
    },
    relationships: { [ROOT_ID]: ['a', 'b', 'c', 'd', 'e'] },
  })
}

function treeFixtureStore(): NormalizedData {
  return createStore({
    entities: {
      folder: { id: 'folder', data: { label: 'Folder' } },
      file1: { id: 'file1', data: { label: 'File1' } },
      file2: { id: 'file2', data: { label: 'File2' } },
    },
    relationships: { [ROOT_ID]: ['folder', 'file1'], folder: ['file2'] },
  })
}

function getSelected(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[aria-selected="true"]'))
    .map(el => el.getAttribute('data-node-id')!)
}

function getNode(container: HTMLElement, id: string): HTMLElement {
  return container.querySelector(`[data-node-id="${id}"]`) as HTMLElement
}

describe('pointer interaction — listbox click selection', () => {
  function setup() {
    const user = userEvent.setup()
    const result = render(
      <Aria behavior={listbox} data={fixtureStore()} plugins={[core()]}>
        <Aria.Item render={(node, state) => (
          <span data-focused={state.focused}>{(node as { data: { label: string } }).data.label}</span>
        )} />
      </Aria>
    )
    return { user, container: result.container as HTMLElement }
  }

  it('click selects a single node', async () => {
    const { user, container } = setup()
    await user.click(getNode(container, 'c'))
    expect(getSelected(container)).toEqual(['c'])
  })

  it('click on another node replaces selection', async () => {
    const { user, container } = setup()
    await user.click(getNode(container, 'b'))
    await user.click(getNode(container, 'd'))
    expect(getSelected(container)).toEqual(['d'])
  })

  it('Shift+Click selects range from anchor to target', async () => {
    const { user, container } = setup()
    await user.click(getNode(container, 'b'))
    await user.click(getNode(container, 'd'), { shiftKey: true })
    expect(getSelected(container)).toEqual(['b', 'c', 'd'])
  })

  it('Ctrl+Click toggles individual selection', async () => {
    const { user, container } = setup()
    await user.click(getNode(container, 'b'))
    await user.click(getNode(container, 'd'), { ctrlKey: true })
    expect(getSelected(container)).toEqual(['b', 'd'])
  })

  it('Ctrl+Click deselects already selected node', async () => {
    const { user, container } = setup()
    await user.click(getNode(container, 'b'))
    await user.click(getNode(container, 'd'), { ctrlKey: true })
    await user.click(getNode(container, 'b'), { ctrlKey: true })
    expect(getSelected(container)).toEqual(['d'])
  })

  it('Meta+Click (Cmd) toggles like Ctrl+Click', async () => {
    const { user, container } = setup()
    await user.click(getNode(container, 'b'))
    await user.click(getNode(container, 'd'), { metaKey: true })
    expect(getSelected(container)).toEqual(['b', 'd'])
  })
})

describe('pointer interaction — tree click', () => {
  function setup() {
    const user = userEvent.setup()
    const result = render(
      <Aria behavior={tree} data={treeFixtureStore()} plugins={[core()]}>
        <Aria.Item render={(node, state) => (
          <span data-focused={state.focused}>{(node as { data: { label: string } }).data.label}</span>
        )} />
      </Aria>
    )
    return { user, container: result.container as HTMLElement }
  }

  it('click on folder expands it', async () => {
    const { user, container } = setup()
    await user.click(getNode(container, 'folder'))
    expect(getNode(container, 'folder').getAttribute('aria-expanded')).toBe('true')
  })

  it('click on folder also selects it', async () => {
    const { user, container } = setup()
    await user.click(getNode(container, 'folder'))
    expect(getSelected(container)).toEqual(['folder'])
  })

  it('click on leaf node selects it (no expand attr change)', async () => {
    const { user, container } = setup()
    await user.click(getNode(container, 'file1'))
    expect(getSelected(container)).toEqual(['file1'])
    expect(getNode(container, 'file1').hasAttribute('aria-expanded')).toBe(false)
  })
})

describe('pointer interaction — treegrid click', () => {
  function setup() {
    const user = userEvent.setup()
    const result = render(
      <Aria behavior={treegrid} data={treeFixtureStore()} plugins={[core()]}>
        <Aria.Item render={(node, state) => (
          <span data-focused={state.focused}>{(node as { data: { label: string } }).data.label}</span>
        )} />
      </Aria>
    )
    return { user, container: result.container as HTMLElement }
  }

  it('click on folder row expands and selects it', async () => {
    const { user, container } = setup()
    await user.click(getNode(container, 'folder'))
    expect(getNode(container, 'folder').getAttribute('aria-expanded')).toBe('true')
    expect(getSelected(container)).toEqual(['folder'])
  })
})

describe('pointer interaction — edge cases', () => {
  it('Shift+Click on single-select listbox acts as normal click (no range)', async () => {
    const singleListbox = composePattern(
      { role: 'listbox', childRole: 'option', ariaAttributes: (_n, s) => ({ 'aria-selected': String(s.selected) }) },
      select({ mode: 'single' }),
      activate({ onClick: true }),
      navigate({ orientation: 'vertical' }),
    )
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={singleListbox} data={fixtureStore()} plugins={[core()]}>
        <Aria.Item render={(node, state) => (
          <span data-focused={state.focused}>{(node as { data: { label: string } }).data.label}</span>
        )} />
      </Aria>
    )
    await user.click(getNode(container, 'b'))
    await user.click(getNode(container, 'd'), { shiftKey: true })
    expect(getSelected(container)).toEqual(['d'])
  })

  it('click followed by keyboard Shift+Arrow still works', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={listbox} data={fixtureStore()} plugins={[core()]}>
        <Aria.Item render={(node, state) => (
          <span data-focused={state.focused}>{(node as { data: { label: string } }).data.label}</span>
        )} />
      </Aria>
    )
    await user.click(getNode(container, 'b'))
    expect(getSelected(container)).toEqual(['b'])
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
    expect(getSelected(container)).toEqual(['b', 'c'])
  })

  it('event bubbling: nested aria instances do not double-process clicks', async () => {
    const user = userEvent.setup()
    const outerData = createStore({
      entities: { outer: { id: 'outer', data: { label: 'Outer' } } },
      relationships: { [ROOT_ID]: ['outer'] },
    })
    const innerData = fixtureStore()
    const { container } = render(
      <Aria behavior={listbox} data={outerData} plugins={[core()]}>
        <Aria.Item render={() => (
          <Aria behavior={listbox} data={innerData} plugins={[core()]}>
            <Aria.Item render={(node, state) => (
              <span data-focused={state.focused}>{(node as { data: { label: string } }).data.label}</span>
            )} />
          </Aria>
        )} />
      </Aria>
    )
    // Click inner node — should only affect inner listbox
    const innerNode = container.querySelector('[data-node-id="c"]') as HTMLElement
    await user.click(innerNode)
    expect(innerNode.getAttribute('aria-selected')).toBe('true')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/interactive-os/__tests__/pointer-interaction.test.tsx`
Expected: FAIL — clicks don't trigger selection

- [ ] **Step 3: Add `selectionCommands` import to useAria.ts**

In `src/interactive-os/hooks/useAria.ts` line 8, add `selectionCommands` and `SELECTION_ANCHOR_ID` to import:
```ts
import { focusCommands, selectionCommands, FOCUS_ID, SELECTION_ID, SELECTION_ANCHOR_ID, EXPANDED_ID, GRID_COL_ID, VALUE_ID } from '../plugins/core'
```

Also add `createBatchCommand` import if not already present:
```ts
import { ROOT_ID, createBatchCommand } from '../core/types'
```

- [ ] **Step 4: Extend useAria with onPointerDown + onClick**

In `src/interactive-os/hooks/useAria.ts`, replace lines 244-254 with:

```ts
      // Capture BehaviorContext on pointerdown (before browser focus fires).
      // onFocus → setFocus → anchorResetMiddleware clears anchor.
      // We need the pre-focus ctx for Shift+Click range calculation.
      let pointerDownCtx: ReturnType<typeof createBehaviorContext> | null = null
      baseProps.onPointerDown = () => {
        if (behavior.selectOnClick) {
          pointerDownCtx = createBehaviorContext(engine, behaviorCtxOptions)
        }
      }

      baseProps.onClick = (event: MouseEvent) => {
        if (event.defaultPrevented) return // bubbling guard for nested aria instances

        // 1. Select on click
        if (behavior.selectOnClick) {
          if (event.shiftKey && behavior.selectionMode === 'multiple') {
            // Range select: use pre-focus ctx (has correct anchor)
            if (pointerDownCtx) {
              engine.dispatch(pointerDownCtx.extendSelectionTo(id))
            }
          } else if ((event.ctrlKey || event.metaKey) && behavior.selectionMode === 'multiple') {
            // Toggle select: add/remove from current selection
            engine.dispatch(selectionCommands.toggleSelect(id))
          } else {
            // Plain click: replace selection + set anchor for future Shift+Click
            engine.dispatch(createBatchCommand([
              selectionCommands.select(id),
              selectionCommands.setAnchor(id),
            ]))
          }
          pointerDownCtx = null
        }

        // 2. Activate on click (existing behavior)
        if (behavior.activateOnClick) {
          if (onActivateRef.current) {
            onActivateRef.current(id)
          } else {
            const ctx = createBehaviorContext(engine, behaviorCtxOptions)
            const command = ctx.activate()
            if (command) engine.dispatch(command)
          }
        }

        // Prevent parent onClick from re-processing (nested aria)
        if (behavior.selectOnClick || behavior.activateOnClick) {
          event.preventDefault()
        }
      }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run src/interactive-os/__tests__/pointer-interaction.test.tsx`
Expected: PASS

- [ ] **Step 6: Run all existing tests for regression**

Run: `pnpm vitest run`
Expected: All pass

- [ ] **Step 7: Commit**

```bash
git add src/interactive-os/hooks/useAria.ts src/interactive-os/__tests__/pointer-interaction.test.tsx
git commit -m "feat: extend useAria onClick with select, Shift+Click range, Ctrl+Click toggle

Uses onPointerDown to capture BehaviorContext before browser focus fires,
preserving anchor for Shift+Click range selection. Plain click sets anchor
via batch command. event.defaultPrevented guards nested aria instances."
```

---

### Task 3: Enable activateOnClick on tree and treegrid behaviors

**Files:**
- Modify: `src/interactive-os/behaviors/tree.ts:29` — add `onClick: true` (NOT toggleExpand)
- Modify: `src/interactive-os/behaviors/treegrid.ts:29` — add `onClick: true` (NOT toggleExpand)

**Why NOT `toggleExpand: true`:** `ctx.activate()` (createBehaviorContext.ts:155-158) already checks `children.length > 0` and returns `toggleExpand` for folders, `select` for leaves. Setting `toggleExpand: true` would set `expandable: true` on the behavior, making ALL nodes (including leaves) show `aria-expanded="false"` — incorrect ARIA.

- [ ] **Step 1: Verify tree click tests from Task 2 currently fail**

Run: `pnpm vitest run src/interactive-os/__tests__/pointer-interaction.test.tsx -t "tree click"`
Expected: FAIL — tree behavior has `activate()` without onClick

- [ ] **Step 2: Update tree.ts**

Change line 29 from:
```ts
  activate(),
```
to:
```ts
  activate({ onClick: true }),
```

- [ ] **Step 3: Update treegrid.ts**

Same change — line 29 from:
```ts
  activate(),
```
to:
```ts
  activate({ onClick: true }),
```

- [ ] **Step 4: Run pointer interaction tests**

Run: `pnpm vitest run src/interactive-os/__tests__/pointer-interaction.test.tsx`
Expected: PASS — tree/treegrid click expand + select tests pass

- [ ] **Step 5: Run tree/treegrid keyboard tests for regression**

Run: `pnpm vitest run src/interactive-os/__tests__/treegrid-keyboard.integration.test.tsx`
Expected: All pass — keyboard behavior unchanged

- [ ] **Step 6: Commit**

```bash
git add src/interactive-os/behaviors/tree.ts src/interactive-os/behaviors/treegrid.ts
git commit -m "feat: enable activateOnClick on tree and treegrid behaviors"
```

---

### Task 4: Add click handlers to Combobox component

**Files:**
- Modify: `src/interactive-os/ui/Combobox.tsx` — add input onClick + option onClick
- Test: `src/interactive-os/__tests__/combobox-click.test.tsx` (new)

- [ ] **Step 1: Write failing tests for combobox click**

Create `src/interactive-os/__tests__/combobox-click.test.tsx`:

```tsx
/**
 * Integration test: Combobox click interactions
 *
 * Tests input click → dropdown open, option click → select.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox } from '../ui/Combobox'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core } from '../plugins/core'
import { combobox as comboboxPlugin } from '../plugins/combobox'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      apple: { id: 'apple', data: { label: 'Apple' } },
      banana: { id: 'banana', data: { label: 'Banana' } },
      cherry: { id: 'cherry', data: { label: 'Cherry' } },
    },
    relationships: { [ROOT_ID]: ['apple', 'banana', 'cherry'] },
  })
}

describe('combobox click interaction', () => {
  it('clicking input opens the dropdown', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Combobox
        data={fixtureData()}
        plugins={[core(), comboboxPlugin()]}
        placeholder="Pick a fruit..."
        renderItem={(item) => <span>{(item.data as { label: string }).label}</span>}
      />
    )
    const input = container.querySelector('[role="combobox"]') as HTMLElement
    await user.click(input)
    expect(input.getAttribute('aria-expanded')).toBe('true')
  })

  it('clicking an option in single mode selects and closes', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Combobox
        data={fixtureData()}
        plugins={[core(), comboboxPlugin()]}
        placeholder="Pick a fruit..."
        renderItem={(item) => <span>{(item.data as { label: string }).label}</span>}
      />
    )
    const input = container.querySelector('[role="combobox"]') as HTMLElement
    await user.click(input)
    const option = container.querySelector('[data-node-id="banana"]') as HTMLElement
    await user.click(option)
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  it('clicking an option in multiple mode toggles without closing', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Combobox
        data={fixtureData()}
        plugins={[core(), comboboxPlugin()]}
        placeholder="Pick..."
        selectionMode="multiple"
        renderItem={(item) => <span>{(item.data as { label: string }).label}</span>}
      />
    )
    const input = container.querySelector('[role="combobox"]') as HTMLElement
    await user.click(input)
    const option = container.querySelector('[data-node-id="banana"]') as HTMLElement
    await user.click(option)
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(option.getAttribute('aria-selected')).toBe('true')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/interactive-os/__tests__/combobox-click.test.tsx`
Expected: FAIL

- [ ] **Step 3: Add input onClick handler to Combobox**

In `Combobox.tsx`, add handler function:

```ts
const handleInputClick = () => {
  if (!isOpen) {
    aria.dispatch(comboboxCommands.open())
  }
}
```

Add `onClick={handleInputClick}` to both `<input>` elements (single mode around line 292, multiple mode around line 282).

- [ ] **Step 4: Add option onClick handler to Combobox**

Modify `renderOption` function (line 189-199):

```tsx
const renderOption = (childId: string) => {
  const entity = store.entities[childId]
  if (!entity) return null
  const state = aria.getNodeState(childId)
  const props = aria.getNodeProps(childId)
  const handleOptionClick = () => {
    if (mode === 'multiple') {
      aria.dispatch(selectionCommands.toggleSelect(childId))
    } else {
      aria.dispatch(createBatchCommand([
        selectionCommands.select(childId),
        comboboxCommands.close(),
      ]))
    }
  }
  return (
    <div key={childId} {...(props as React.HTMLAttributes<HTMLDivElement>)} onClick={handleOptionClick}>
      {render(entity, state)}
    </div>
  )
}
```

Note: `createBatchCommand` and `selectionCommands` are already imported in Combobox.tsx.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run src/interactive-os/__tests__/combobox-click.test.tsx`
Expected: PASS

- [ ] **Step 6: Run all combobox tests for regression**

Run: `pnpm vitest run src/interactive-os/__tests__/combobox`
Expected: All pass

- [ ] **Step 7: Commit**

```bash
git add src/interactive-os/ui/Combobox.tsx src/interactive-os/__tests__/combobox-click.test.tsx
git commit -m "feat: add click handlers to Combobox (input open + option select)"
```

---

### Task 5: Full regression + cleanup

- [ ] **Step 1: Run TypeScript check**

Run: `pnpm tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run full test suite**

Run: `pnpm vitest run`
Expected: All pass

- [ ] **Step 3: Fix any failures, re-run**

If any tests fail, fix and re-run until all pass.

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -u
git commit -m "fix: resolve pointer interaction regression issues"
```
