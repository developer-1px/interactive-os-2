# selectionFollowsFocus + activationFollowsSelection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** APG focus/selection/activation 3개념 분리 — 기존 `followFocus`를 `selectionFollowsFocus` + `activationFollowsSelection` 두 직교 옵션으로 교체한다.

**Architecture:** `selectionFollowsFocus`는 select axis의 middleware로 engine 레이어에서 focus→selection 동기화를 처리한다. `activationFollowsSelection`은 useAria/useAriaZone에서 selection 변경 감지 → onActivate 호출을 처리한다. 기존 `followFocus` 옵션과 관련 로직은 전부 제거한다. **Atomic restructure** — 모든 변경이 한 커밋에 들어간다.

**Tech Stack:** TypeScript, React hooks, vitest

**PRD:** `docs/superpowers/specs/2026-03-28-selection-follows-focus-prd.md`

**Chain:**
```
             select axis                    useAria/useAriaZone
focus ──[selectionFollowsFocus]──→ selection ──[activationFollowsSelection]──→ onActivate
  ①        middleware                 ②          selection onChange              ③
```

**Atomic constraint:** PRD ⑦ F5 — 점진적 전환 금지. 모든 task를 완료한 후 마지막에 한 번 커밋한다.

---

### Task 1: New Test File (TDD — tests will fail until Task 2-4 complete)

**Files:**
- Create: `src/interactive-os/__tests__/selection-follows-focus.test.tsx`

- [ ] **Step 1: Write the new test file**

```typescript
// src/interactive-os/__tests__/selection-follows-focus.test.tsx
// V1: 2026-03-28-selection-follows-focus-prd.md
/**
 * Tests for selectionFollowsFocus + activationFollowsSelection.
 * Replaces follow-focus.test.tsx.
 *
 * Chain: focus →[selectionFollowsFocus]→ selection →[activationFollowsSelection]→ onActivate
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { composePattern } from '../pattern/composePattern'
import { select } from '../axis/select'
import { activate } from '../axis/activate'
import { navigate } from '../axis/navigate'
import { tabs } from '../pattern/examples/tabs'
import { radiogroup } from '../pattern/examples/radiogroup'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      a: { id: 'a', data: { label: 'A' } },
      b: { id: 'b', data: { label: 'B' } },
      c: { id: 'c', data: { label: 'C' } },
    },
    relationships: {
      [ROOT_ID]: ['a', 'b', 'c'],
    },
  })
}

const bothOptions = composePattern(
  {
    role: 'toolbar',
    childRole: 'button',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-pressed': String(state.selected),
    }),
  },
  select({ mode: 'single', selectionFollowsFocus: true }),
  activate({ onClick: true, activationFollowsSelection: true }),
  navigate({ orientation: 'vertical' }),
)

const selectionOnly = composePattern(
  {
    role: 'radiogroup',
    childRole: 'radio',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-checked': String(state.selected),
    }),
  },
  select({ mode: 'single', selectionFollowsFocus: true }),
  activate({ onClick: true }),
  navigate({ orientation: 'both', wrap: true }),
)

const noOptions = composePattern(
  {
    role: 'toolbar',
    childRole: 'button',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-pressed': String(state.selected),
    }),
  },
  activate({ onClick: true }),
  navigate({ orientation: 'horizontal' }),
)

function getNode(container: HTMLElement, id: string): HTMLElement {
  return container.querySelector(`[data-node-id="${id}"]`)!
}

describe('selectionFollowsFocus + activationFollowsSelection', () => {
  describe('selectionFollowsFocus: focus change → auto-select', () => {
    it('Arrow key changes aria-checked when selectionFollowsFocus is true', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <Aria behavior={selectionOnly} data={fixtureData()} plugins={[]}>
          <Aria.Item render={(props, node, state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      getNode(container, 'a').focus()
      // Initial focus → selectionFollowsFocus → a is selected
      expect(getNode(container, 'a').getAttribute('aria-checked')).toBe('true')

      await user.keyboard('{ArrowDown}')
      // Focus moved to b → selectionFollowsFocus → b is selected, a is deselected
      expect(getNode(container, 'b').getAttribute('aria-checked')).toBe('true')
      expect(getNode(container, 'a').getAttribute('aria-checked')).toBe('false')
    })

    it('Home/End changes selection when selectionFollowsFocus is true', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <Aria behavior={selectionOnly} data={fixtureData()} plugins={[]}>
          <Aria.Item render={(props, node, state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      getNode(container, 'a').focus()
      await user.keyboard('{End}')
      expect(getNode(container, 'c').getAttribute('aria-checked')).toBe('true')
      expect(getNode(container, 'a').getAttribute('aria-checked')).toBe('false')
    })
  })

  describe('activationFollowsSelection: selection change → onActivate', () => {
    it('Arrow key calls onActivate when both options are true', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = render(
        <Aria behavior={bothOptions} data={fixtureData()} plugins={[]} onActivate={onActivate}>
          <Aria.Item render={(props, node, state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      getNode(container, 'a').focus()
      onActivate.mockClear()

      await user.keyboard('{ArrowDown}')
      expect(onActivate).toHaveBeenCalledWith('b')
    })

    it('does NOT call onActivate when only selectionFollowsFocus (no activationFollowsSelection)', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = render(
        <Aria behavior={selectionOnly} data={fixtureData()} plugins={[]} onActivate={onActivate}>
          <Aria.Item render={(props, node, state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      getNode(container, 'a').focus()
      onActivate.mockClear()

      await user.keyboard('{ArrowDown}')
      // Selection follows focus, but no activationFollowsSelection → no onActivate
      expect(onActivate).not.toHaveBeenCalled()
    })

    it('does NOT call onActivate on initial mount', () => {
      const onActivate = vi.fn()
      render(
        <Aria behavior={bothOptions} data={fixtureData()} plugins={[]} onActivate={onActivate}>
          <Aria.Item render={(props, node, state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )
      // Initial focus sets selection via middleware, but this happens during
      // engine initialization (initializing=true) so onActivate is not called
      expect(onActivate).not.toHaveBeenCalled()
    })
  })

  describe('both options OFF → existing behavior preserved', () => {
    it('Arrow key moves focus only, no selection change', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = render(
        <Aria behavior={noOptions} data={fixtureData()} plugins={[]} onActivate={onActivate}>
          <Aria.Item render={(props, node, state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      getNode(container, 'a').focus()
      onActivate.mockClear()

      await user.keyboard('{ArrowRight}')
      expect(onActivate).not.toHaveBeenCalled()
      // Focus moved but no selection
      expect(getNode(container, 'b').getAttribute('aria-pressed')).toBe('false')
    })
  })

  describe('explicit activation (Enter/Space) still works independently', () => {
    it('Enter calls onActivate via keymapHelpers regardless of options', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = render(
        <Aria behavior={noOptions} data={fixtureData()} plugins={[]} onActivate={onActivate}>
          <Aria.Item render={(props, node, state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      getNode(container, 'a').focus()
      onActivate.mockClear()
      await user.keyboard('{Enter}')
      expect(onActivate).toHaveBeenCalledWith('a')
    })

    it('Space calls onActivate via keymapHelpers when no select axis', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = render(
        <Aria behavior={noOptions} data={fixtureData()} plugins={[]} onActivate={onActivate}>
          <Aria.Item render={(props, node, state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      getNode(container, 'a').focus()
      onActivate.mockClear()
      await user.keyboard('{ }')
      expect(onActivate).toHaveBeenCalledWith('a')
    })
  })

  describe('pattern presets', () => {
    it('tabs has selectionFollowsFocus=true and activationFollowsSelection=true', () => {
      expect(tabs.selectionFollowsFocus).toBe(true)
      expect(tabs.activationFollowsSelection).toBe(true)
    })

    it('radiogroup has selectionFollowsFocus=true but no activationFollowsSelection', () => {
      expect(radiogroup.selectionFollowsFocus).toBe(true)
      expect(radiogroup.activationFollowsSelection).toBeUndefined()
    })

    it('tabs: Arrow changes selection and calls onActivate', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = render(
        <Aria behavior={tabs} data={fixtureData()} plugins={[]} onActivate={onActivate}>
          <Aria.Item render={(props, node, state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      getNode(container, 'a').focus()
      onActivate.mockClear()

      await user.keyboard('{ArrowRight}')
      expect(onActivate).toHaveBeenCalledWith('b')
      expect(getNode(container, 'b').getAttribute('aria-selected')).toBe('true')
    })

    it('radiogroup: Arrow changes aria-checked without calling onActivate', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = render(
        <Aria behavior={radiogroup} data={fixtureData()} plugins={[]} onActivate={onActivate}>
          <Aria.Item render={(props, node, state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      getNode(container, 'a').focus()
      onActivate.mockClear()

      await user.keyboard('{ArrowDown}')
      expect(getNode(container, 'b').getAttribute('aria-checked')).toBe('true')
      expect(onActivate).not.toHaveBeenCalled()
    })
  })

  describe('click activation', () => {
    it('click calls onActivate when activateOnClick is true', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = render(
        <Aria behavior={bothOptions} data={fixtureData()} plugins={[]} onActivate={onActivate}>
          <Aria.Item render={(props, node, state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      await user.click(getNode(container, 'b'))
      expect(onActivate).toHaveBeenCalledWith('b')
    })
  })
})
```

- [ ] **Step 2: Verify tests exist but fail (expected — new API doesn't exist yet)**

Run: `pnpm test -- src/interactive-os/__tests__/selection-follows-focus.test.tsx 2>&1 | head -30`
Expected: FAIL (import errors — `selectionFollowsFocus` option doesn't exist yet)

---

### Task 2: Core API — Axis + Types + ComposePattern

**Files:**
- Modify: `src/interactive-os/axis/select.ts`
- Modify: `src/interactive-os/axis/activate.ts`
- Modify: `src/interactive-os/axis/types.ts`
- Modify: `src/interactive-os/pattern/types.ts`
- Modify: `src/interactive-os/pattern/composePattern.ts`

- [ ] **Step 1: Add selectionFollowsFocusMiddleware to select.ts**

In `src/interactive-os/axis/select.ts`, add the middleware and update `SelectOptions` and `select()`:

```typescript
// After anchorResetMiddleware (line 176), add:

/**
 * Middleware: auto-select the focused node on standalone focus commands.
 * Batch commands (e.g. extendSelection) are exempt — they manage selection themselves.
 * APG "selection follows focus": RadioGroup, Tabs automatic.
 */
export function selectionFollowsFocusMiddleware(): Middleware {
  return (next) => (command) => {
    next(command)
    if (command.type === 'core:focus') {
      const nodeId = (command.payload as { nodeId: string }).nodeId
      next(selectionCommands.select(nodeId))
    }
  }
}
```

Update `SelectOptions` interface (line 178):
```typescript
interface SelectOptions {
  mode?: SelectionMode  // 'single' | 'multiple', default 'multiple'
  extended?: boolean     // add Shift combos, only when mode='multiple'
  selectionFollowsFocus?: boolean  // auto-select on focus change (APG "selection follows focus")
}
```

Update `select()` function (line 183) — compose both middlewares when selectionFollowsFocus is true:
```typescript
export function select(options?: SelectOptions): { keyMap: KeyMap; config: Partial<AxisConfig>; middleware?: Middleware } {
  const mode = options?.mode ?? 'multiple'
  const extended = options?.extended && mode === 'multiple'

  const keyMap: KeyMap = {
    Space: (ctx) => ctx.toggleSelect(),
  }

  if (extended) {
    keyMap['Shift+ArrowDown'] = (ctx) => ctx.extendSelection('next')
    keyMap['Shift+ArrowUp'] = (ctx) => ctx.extendSelection('prev')
    keyMap['Shift+Home'] = (ctx) => ctx.extendSelection('first')
    keyMap['Shift+End'] = (ctx) => ctx.extendSelection('last')
  }

  const middlewares: Middleware[] = [anchorResetMiddleware()]
  if (options?.selectionFollowsFocus) {
    middlewares.push(selectionFollowsFocusMiddleware())
  }

  const middleware: Middleware = middlewares.length === 1
    ? middlewares[0]!
    : (next) => {
        const chain = middlewares.reduceRight<(command: Command) => void>(
          (acc, mw) => mw(acc),
          next,
        )
        return chain
      }

  return {
    keyMap,
    config: {
      selectionMode: mode,
      selectOnClick: true,
      ...(options?.selectionFollowsFocus && { selectionFollowsFocus: true }),
    },
    middleware,
  }
}
```

- [ ] **Step 2: Update activate.ts — replace followFocus with activationFollowsSelection**

Replace entire `src/interactive-os/axis/activate.ts`:

```typescript
import type { AxisConfig, KeyMap } from './types'

interface ActivateOptions {
  onClick?: boolean
  activationFollowsSelection?: boolean
  toggleExpand?: boolean
  /** When true (default), clicking a parent node toggles expand even when onActivate is provided. Set false for navigation trees where parent click = navigate only. */
  expandOnClick?: boolean
}

// ② 2026-03-26-treeview-click-expand-prd.md
export function activate(options?: ActivateOptions): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  const keyMap: KeyMap = {
    Enter: (ctx) => ctx.activate(),
    Space: (ctx) => ctx.activate(),
  }

  const config: Partial<AxisConfig> = {}
  if (options?.onClick) {
    config.activateOnClick = true
    // APG File Directory: click on parent = expand toggle. Default true when onClick is enabled.
    config.expandOnParentClick = options.expandOnClick ?? true
  }
  if (options?.activationFollowsSelection) config.activationFollowsSelection = true
  if (options?.toggleExpand) config.expandable = true

  return { keyMap, config }
}
```

- [ ] **Step 3: Update axis/types.ts — replace followFocus field**

In `src/interactive-os/axis/types.ts`, replace line 77:

```typescript
// Replace:
  followFocus: boolean

// With:
  selectionFollowsFocus: boolean
  activationFollowsSelection: boolean
```

- [ ] **Step 4: Update pattern/types.ts — replace followFocus field**

In `src/interactive-os/pattern/types.ts`, replace lines 38-39:

```typescript
// Replace:
  /** When true, focus change auto-triggers onActivate. Per-item opt-out via entity.data.followFocus=false. */
  followFocus?: boolean

// With:
  /** When true, focus change auto-selects (select axis middleware). APG "selection follows focus". */
  selectionFollowsFocus?: boolean
  /** When true, selection change calls onActivate (useAria/useAriaZone). Chain: selection → onActivate. */
  activationFollowsSelection?: boolean
```

- [ ] **Step 5: Update composePattern.ts — replace followFocus spreading**

In `src/interactive-os/pattern/composePattern.ts`, replace both occurrences of `followFocus` (lines 104 and 125):

```typescript
// Replace (line 104, v2 Identity path):
      ...(mergedConfig.followFocus !== undefined && { followFocus: mergedConfig.followFocus }),

// With:
      ...(mergedConfig.selectionFollowsFocus !== undefined && { selectionFollowsFocus: mergedConfig.selectionFollowsFocus }),
      ...(mergedConfig.activationFollowsSelection !== undefined && { activationFollowsSelection: mergedConfig.activationFollowsSelection }),

// Replace (line 125, v1 PatternConfig path):
    ...(mergedConfig.followFocus !== undefined && { followFocus: mergedConfig.followFocus }),

// With:
    ...(mergedConfig.selectionFollowsFocus !== undefined && { selectionFollowsFocus: mergedConfig.selectionFollowsFocus }),
    ...(mergedConfig.activationFollowsSelection !== undefined && { activationFollowsSelection: mergedConfig.activationFollowsSelection }),
```

- [ ] **Step 6: Verify types compile**

Run: `pnpm typecheck 2>&1 | head -40`
Expected: Type errors in consumer files (AppShell, ActivateDemo, etc.) — expected at this stage.

---

### Task 3: Primitives — useAria + useAriaZone

**Files:**
- Modify: `src/interactive-os/primitives/useAria.ts`
- Modify: `src/interactive-os/primitives/useAriaZone.ts`

- [ ] **Step 1: Update useAria.ts — replace followFocus with activationFollowsSelection**

In `src/interactive-os/primitives/useAria.ts`:

Update the EngineCallbacks type (line 21):
```typescript
// Replace:
type EngineCallbacks = { onActivate: UseAriaOptions['onActivate']; behavior: AriaPattern; prevFocus: string }

// With:
type EngineCallbacks = { onActivate: UseAriaOptions['onActivate']; behavior: AriaPattern; prevFocus: string; prevSelectedIds: string[] }
```

Update the bag initialization inside useState (line 71):
```typescript
// Replace:
    const bag: EngineCallbacks = { onActivate, behavior, prevFocus: '' }

// With:
    const bag: EngineCallbacks = { onActivate, behavior, prevFocus: '', prevSelectedIds: [] }
```

Replace the followFocus logic in the onChange callback (lines 83-88):
```typescript
    // Replace these lines (83-88):
    //   if (cb.behavior.followFocus && cb.onActivate && newFocusedId && newFocusedId !== cb.prevFocus) {
    //     const entityData = getEntityData<{ followFocus?: boolean }>(newStore, newFocusedId)
    //     if (entityData?.followFocus !== false) {
    //       cb.onActivate(newFocusedId)
    //     }
    //   }

    // With:
      // activationFollowsSelection: selection change → onActivate
      if (cb.behavior.activationFollowsSelection && cb.onActivate) {
        const newSelArr = (newStore.entities[SELECTION_ID]?.selectedIds as string[]) ?? []
        if (newSelArr.length > 0 && newSelArr !== cb.prevSelectedIds) {
          cb.onActivate(newSelArr[newSelArr.length - 1]!)
        }
        cb.prevSelectedIds = newSelArr
      }
```

After `initializing = false` (line 116), initialize prevSelectedIds:
```typescript
    initializing = false
    // Initialize prevSelectedIds to post-init state so mount doesn't trigger onActivate
    bag.prevSelectedIds = (created.getStore().entities[SELECTION_ID]?.selectedIds as string[]) ?? []
    return created
```

- [ ] **Step 2: Update useAriaZone.ts — replace followFocus**

In `src/interactive-os/primitives/useAriaZone.ts`:

Add selectionFollowsFocus to standalone meta dispatch (around line 176-184). Replace the standalone meta dispatch block:

```typescript
    // Replace:
        if (META_COMMAND_TYPES.has(command.type)) {
          setViewState(prev => {
            const next = applyMetaCommand(prev, command)
            return command.type === 'core:focus'
              ? { ...next, selectionAnchor: '' }
              : next
          })
          return
        }

    // With:
        if (META_COMMAND_TYPES.has(command.type)) {
          setViewState(prev => {
            const next = applyMetaCommand(prev, command)
            if (command.type === 'core:focus') {
              const withAnchorReset = { ...next, selectionAnchor: '' }
              // selectionFollowsFocus: auto-select focused node (standalone focus only, not batch)
              if (behaviorRef.current.selectionFollowsFocus) {
                const nodeId = (command.payload as { nodeId: string }).nodeId
                return { ...withAnchorReset, selectedIds: [nodeId] }
              }
              return withAnchorReset
            }
            return next
          })
          return
        }
```

Replace the followFocus useEffect block (lines 217-228):

```typescript
    // Replace:
  // ── followFocus ──

  useEffect(() => {
    if (!focusedId || focusedId === prevFocusRef.current) return
    prevFocusRef.current = focusedId
    if (behaviorRef.current.followFocus && onActivateRef.current) {
      const entityData = getEntityData<{ followFocus?: boolean }>(store, focusedId)
      if (entityData?.followFocus !== false) {
        onActivateRef.current(focusedId)
      }
    }
  }, [focusedId, store])

    // With:
  // ── activationFollowsSelection ──

  const prevSelectedIdsRef = useRef<string[]>(selectedIds)

  useEffect(() => {
    const prev = prevSelectedIdsRef.current
    prevSelectedIdsRef.current = selectedIds
    if (prev === selectedIds) return
    if (!behaviorRef.current.activationFollowsSelection || !onActivateRef.current) return
    if (selectedIds.length === 0) return
    onActivateRef.current(selectedIds[selectedIds.length - 1]!)
  }, [selectedIds])
```

Remove unused imports if `getEntityData` was only used for followFocus (check if it's used elsewhere in useAriaZone first — it's also used in focusRecovery, so keep it).

Remove `prevFocusRef` if it's only used in the followFocus block (line 121). Check: `prevFocusRef` is only used in the followFocus useEffect → remove it.

```typescript
// Remove line 121:
  const prevFocusRef = useRef(viewState.focusedId)
```

---

### Task 4: Pattern Examples — tabs + radiogroup

**Files:**
- Modify: `src/interactive-os/pattern/examples/tabs.ts`
- Modify: `src/interactive-os/pattern/examples/radiogroup.ts`

- [ ] **Step 1: Update tabs.ts**

Replace entire `src/interactive-os/pattern/examples/tabs.ts`:

```typescript
import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { select } from '../../axis/select'
import { activate } from '../../axis/activate'
import { navigate } from '../../axis/navigate'

export const tabs = composePattern(
  {
    role: 'tablist',
    childRole: 'tab',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-selected': String(state.selected),
    }),
  },
  select({ mode: 'single', selectionFollowsFocus: true }),
  activate({ onClick: true, activationFollowsSelection: true }),
  navigate({ orientation: 'horizontal' }),
)
```

- [ ] **Step 2: Update radiogroup.ts**

Replace entire `src/interactive-os/pattern/examples/radiogroup.ts`:

```typescript
import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { select } from '../../axis/select'
import { activate } from '../../axis/activate'
import { navigate } from '../../axis/navigate'

export const radiogroup = composePattern(
  {
    role: 'radiogroup',
    childRole: 'radio',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-checked': String(state.selected),
    }),
  },
  select({ mode: 'single', selectionFollowsFocus: true }),
  activate({ onClick: true }),
  navigate({ orientation: 'both', wrap: true }),
)
```

---

### Task 5: Consumer Updates — AppShell, TreeView, AreaSidebar, navlist, ActivateDemo

**Files:**
- Modify: `src/AppShell.tsx`
- Modify: `src/interactive-os/ui/TreeView.tsx`
- Modify: `src/interactive-os/ui/useTreeView.ts`
- Modify: `src/pages/AreaSidebar.tsx`
- Modify: `src/interactive-os/misc/navlist.ts`
- Modify: `src/pages/axis/ActivateDemo.tsx`

- [ ] **Step 1: Update AppShell.tsx**

In `src/AppShell.tsx`, replace the verticalToolbar definition (lines 84-96):

```typescript
// Replace:
const verticalToolbar: AriaPattern = {
  ...toolbar,
  keyMap: {
    ArrowDown: (ctx) => ctx.focusNext(),
    ArrowUp: (ctx) => ctx.focusPrev(),
    Home: (ctx) => ctx.focusFirst(),
    End: (ctx) => ctx.focusLast(),
    Enter: (ctx) => ctx.activate(),
    Space: (ctx) => ctx.activate(),
  },
  focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
  followFocus: true,
}

// With:
import { selectionFollowsFocusMiddleware } from './interactive-os/axis/select'

const verticalToolbar: AriaPattern = {
  ...toolbar,
  keyMap: {
    ArrowDown: (ctx) => ctx.focusNext(),
    ArrowUp: (ctx) => ctx.focusPrev(),
    Home: (ctx) => ctx.focusFirst(),
    End: (ctx) => ctx.focusLast(),
    Enter: (ctx) => ctx.activate(),
    Space: (ctx) => ctx.activate(),
  },
  focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
  selectionFollowsFocus: true,
  activationFollowsSelection: true,
  middleware: selectionFollowsFocusMiddleware(),
}
```

Note: The `import` for `selectionFollowsFocusMiddleware` should go with the other imports at the top of the file.

Remove per-item followFocus from the activityBarStore (line 150):

```typescript
// Replace:
  { id: 'theme', label: 'Theme', followFocus: false },

// With:
  { id: 'theme', label: 'Theme' },
```

- [ ] **Step 2: Update useTreeView.ts**

In `src/interactive-os/ui/useTreeView.ts`:

Add import (top of file):
```typescript
import { selectionFollowsFocusMiddleware } from '../axis/select'
```

Rename prop (line 16):
```typescript
// Replace:
  followFocus?: boolean

// With:
  selectionFollowsFocus?: boolean
```

Update the behavior construction (line 47-48):
```typescript
// Replace:
  const { data, plugins = [], keyMap, onChange, onActivate, initialFocus, followFocus, selectable = false, 'aria-label': ariaLabel } = options
  let behavior = followFocus ? { ...tree, followFocus: true } : tree

// With:
  const { data, plugins = [], keyMap, onChange, onActivate, initialFocus, selectionFollowsFocus, selectable = false, 'aria-label': ariaLabel } = options
  let behavior = selectionFollowsFocus
    ? { ...tree, selectionFollowsFocus: true, activationFollowsSelection: true, middleware: selectionFollowsFocusMiddleware() }
    : tree
```

- [ ] **Step 3: Update TreeView.tsx**

In `src/interactive-os/ui/TreeView.tsx`, rename the prop (line 22):
```typescript
// Replace:
  followFocus?: boolean

// With:
  selectionFollowsFocus?: boolean
```

Update the destructuring and usage (lines 47 and 57):
```typescript
// Replace:
  followFocus,

// With:
  selectionFollowsFocus,

// And in useTreeView call:
// Replace:
    followFocus,

// With:
    selectionFollowsFocus,
```

- [ ] **Step 4: Update AreaSidebar.tsx**

In `src/pages/AreaSidebar.tsx`, update the TreeView prop (line 167):

```typescript
// Replace:
        followFocus

// With:
        selectionFollowsFocus
```

- [ ] **Step 5: Update navlist.ts**

Replace entire `src/interactive-os/misc/navlist.ts`:

```typescript
import type { NodeState } from '../pattern/types'
import type { Entity } from '../store/types'
import { composePattern } from '../pattern/composePattern'
import { select } from '../axis/select'
import { activate } from '../axis/activate'
import { navigate } from '../axis/navigate'

const base = composePattern(
  {
    role: 'listbox',
    childRole: 'option',
    ariaAttributes: (_node: Entity, state: NodeState) => ({
      'aria-selected': String(state.focused),
      'aria-posinset': String(state.index + 1),
      'aria-setsize': String(state.siblingCount),
    }),
  },
  select({ mode: 'single', selectionFollowsFocus: true }),
  activate({ onClick: true, activationFollowsSelection: true }),
  navigate({ orientation: 'vertical' }),
)

// Remove Space key — NavList is activation-only, Space is for selection (ListBox)
const { Space: _space, ...keyMap } = base.keyMap
export const navlist = { ...base, keyMap }
```

- [ ] **Step 6: Update ActivateDemo.tsx**

In `src/pages/axis/ActivateDemo.tsx`:

Rename state variable (line 16):
```typescript
// Replace:
  const [followFocus, setFollowFocus] = useState(false)

// With:
  const [selectionFollowsFocus, setSelectionFollowsFocus] = useState(false)
```

Add select import and update behavior (lines 4, 21-33):
```typescript
// Add import:
import { select } from '../../interactive-os/axis/select'

// Replace behavior construction:
  const behavior = composePattern(
    {
      role: 'listbox',
      childRole: 'option',
      ariaAttributes: (_node, state: NodeState) => {
        const attrs: Record<string, string> = {}
        if (state.expanded !== undefined) attrs['aria-expanded'] = String(state.expanded)
        return attrs
      },
    },
    ...(selectionFollowsFocus ? [select({ mode: 'single', selectionFollowsFocus: true })] : []),
    activate({ onClick, activationFollowsSelection: selectionFollowsFocus, toggleExpand }),
    navigate({ orientation: 'vertical' }),
  )
```

Update the checkbox (lines 46-48):
```typescript
// Replace:
          <input type="checkbox" checked={followFocus} onChange={(e) => setFollowFocus(e.target.checked)} />
          {' '}followFocus

// With:
          <input type="checkbox" checked={selectionFollowsFocus} onChange={(e) => setSelectionFollowsFocus(e.target.checked)} />
          {' '}selectionFollowsFocus
```

Update the hint text (line 59):
```typescript
// Replace:
        {followFocus && <span className="key-hint" style={{ opacity: 0.7 }}> + auto-activate on focus</span>}

// With:
        {selectionFollowsFocus && <span className="key-hint" style={{ opacity: 0.7 }}> + auto-activate on focus</span>}
```

---

### Task 6: Test Updates — Old Tests + Conformance + Integration

**Files:**
- Delete: `src/interactive-os/__tests__/follow-focus.test.tsx`
- Modify: `src/interactive-os/__tests__/compose-pattern.test.ts`
- Modify: `src/interactive-os/__tests__/radiogroup-apg.conformance.test.tsx`
- Modify: `src/interactive-os/__tests__/tabs-apg.conformance.test.tsx`
- Modify: `src/interactive-os/__tests__/treeview-apg.conformance.test.tsx`
- Modify: `src/interactive-os/__tests__/activate-demo-coverage.integration.test.tsx`
- Modify: `src/interactive-os/__tests__/tablist.integration.test.tsx`
- Modify: `src/interactive-os/__tests__/route-ui-showcase.regression.test.tsx`

- [ ] **Step 1: Delete old follow-focus.test.tsx**

```bash
git rm src/interactive-os/__tests__/follow-focus.test.tsx
```

- [ ] **Step 2: Update compose-pattern.test.ts**

In `src/interactive-os/__tests__/compose-pattern.test.ts`, update the metadata test (lines 113, 126):

```typescript
// Replace line 113:
      followFocus: false,

// With:
      selectionFollowsFocus: false,
      activationFollowsSelection: false,

// Replace line 126:
    expect(behavior.followFocus).toBe(false)

// With:
    expect(behavior.selectionFollowsFocus).toBe(false)
    expect(behavior.activationFollowsSelection).toBe(false)
```

- [ ] **Step 3: Update radiogroup conformance test**

In `src/interactive-os/__tests__/radiogroup-apg.conformance.test.tsx`:

Replace lines 134-147 — the test now verifies auto-select WORKS:

```typescript
    // APG: selection follows focus — ArrowDown auto-selects
    it('ArrowDown moves focus and auto-selects (APG selectionFollowsFocus)', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNode(container, 'small')!.focus()
      await user.keyboard('{ArrowDown}')

      // Focus moved AND aria-checked auto-set (selectionFollowsFocus)
      expect(getFocusedNodeId(container)).toBe('medium')
      const medium = getNode(container, 'medium')
      expect(medium?.getAttribute('aria-checked')).toBe('true')
    })
```

- [ ] **Step 4: Update tabs conformance test**

In `src/interactive-os/__tests__/tabs-apg.conformance.test.tsx`:

Replace lines 128-142 — the test now verifies auto-select WORKS:

```typescript
    // APG Automatic Activation: selectionFollowsFocus middleware auto-selects on focus change
    it('ArrowRight auto-selects (APG selectionFollowsFocus)', async () => {
      const user = userEvent.setup()
      const { container } = renderTabList(fixtureData())

      getNode(container, 'general')!.focus()
      await user.keyboard('{ArrowRight}')

      // Focus moved AND aria-selected auto-set (selectionFollowsFocus)
      expect(getFocusedNodeId(container)).toBe('security')
      expect(getNode(container, 'security')?.getAttribute('aria-selected')).toBe('true')
    })
```

- [ ] **Step 5: Update treeview conformance test**

In `src/interactive-os/__tests__/treeview-apg.conformance.test.tsx`:

Update `TreeViewWithActivatedDisplay` prop (line 67):
```typescript
// Replace:
function TreeViewWithActivatedDisplay(props: { data: NormalizedData; followFocus?: boolean; 'aria-label': string }) {

// With:
function TreeViewWithActivatedDisplay(props: { data: NormalizedData; selectionFollowsFocus?: boolean; 'aria-label': string }) {
```

Update section header and test (lines 460-467):
```typescript
// Replace:
// 8. followFocus

describe('APG TreeView — followFocus', () => {
  it('followFocus + onActivate: moving focus triggers onActivate', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TreeViewWithActivatedDisplay data={makeTreeData()} followFocus aria-label="File Tree" />,
    )

// With:
// 8. selectionFollowsFocus + activationFollowsSelection

describe('APG TreeView — selectionFollowsFocus', () => {
  it('selectionFollowsFocus + onActivate: moving focus triggers onActivate', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TreeViewWithActivatedDisplay data={makeTreeData()} selectionFollowsFocus aria-label="File Tree" />,
    )
```

- [ ] **Step 6: Update activate-demo-coverage test**

In `src/interactive-os/__tests__/activate-demo-coverage.integration.test.tsx`:

Update references (lines 53-60):
```typescript
// Replace:
  describe('followFocus option', () => {
    it('navigation auto-activates when followFocus enabled', async () => {
      const user = userEvent.setup()
      render(<ActivateDemo />)

      // Enable followFocus
      const checkboxes = document.querySelectorAll('input[type="checkbox"]')
      await user.click(checkboxes[1]!) // followFocus checkbox

// With:
  describe('selectionFollowsFocus option', () => {
    it('navigation auto-activates when selectionFollowsFocus enabled', async () => {
      const user = userEvent.setup()
      render(<ActivateDemo />)

      // Enable selectionFollowsFocus
      const checkboxes = document.querySelectorAll('input[type="checkbox"]')
      await user.click(checkboxes[1]!) // selectionFollowsFocus checkbox
```

- [ ] **Step 7: Update tablist integration test**

In `src/interactive-os/__tests__/tablist.integration.test.tsx`, update test name (line 41):

```typescript
// Replace:
  it('ArrowRight moves to next tab and activates it (followFocus)', async () => {

// With:
  it('ArrowRight moves to next tab and activates it (selectionFollowsFocus + activationFollowsSelection)', async () => {
```

- [ ] **Step 8: Update route-ui-showcase regression test comment**

In `src/interactive-os/__tests__/route-ui-showcase.regression.test.tsx`, update comment (line 53):

```typescript
// Replace:
   * When focusNext moved to the group entity, followFocus fired onActivate with

// With:
   * When focusNext moved to the group entity, activationFollowsSelection fired onActivate with
```

---

### Task 7: Final Verification + Atomic Commit

**Files:** All modified files from Tasks 1-6

- [ ] **Step 1: Run type check**

Run: `pnpm typecheck`
Expected: PASS (0 errors)

- [ ] **Step 2: Run all tests**

Run: `pnpm test`
Expected: All PASS

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 4: Verify no remaining followFocus references in source**

Run: `grep -rn "followFocus" src/ --include="*.ts" --include="*.tsx" | grep -v "selectionFollowsFocus" | grep -v "__tests__" | grep -v ".test."`
Expected: No matches (all references converted)

- [ ] **Step 5: Atomic commit**

```bash
git add \
  src/interactive-os/axis/select.ts \
  src/interactive-os/axis/activate.ts \
  src/interactive-os/axis/types.ts \
  src/interactive-os/pattern/types.ts \
  src/interactive-os/pattern/composePattern.ts \
  src/interactive-os/primitives/useAria.ts \
  src/interactive-os/primitives/useAriaZone.ts \
  src/interactive-os/pattern/examples/tabs.ts \
  src/interactive-os/pattern/examples/radiogroup.ts \
  src/AppShell.tsx \
  src/interactive-os/ui/TreeView.tsx \
  src/interactive-os/ui/useTreeView.ts \
  src/pages/AreaSidebar.tsx \
  src/interactive-os/misc/navlist.ts \
  src/pages/axis/ActivateDemo.tsx \
  src/interactive-os/__tests__/selection-follows-focus.test.tsx \
  src/interactive-os/__tests__/compose-pattern.test.ts \
  src/interactive-os/__tests__/radiogroup-apg.conformance.test.tsx \
  src/interactive-os/__tests__/tabs-apg.conformance.test.tsx \
  src/interactive-os/__tests__/treeview-apg.conformance.test.tsx \
  src/interactive-os/__tests__/activate-demo-coverage.integration.test.tsx \
  src/interactive-os/__tests__/tablist.integration.test.tsx \
  src/interactive-os/__tests__/route-ui-showcase.regression.test.tsx

git commit -m "feat: APG 3개념 분리 — selectionFollowsFocus + activationFollowsSelection

followFocus를 두 직교 옵션으로 교체:
- selectionFollowsFocus: select axis middleware, focus→selection 자동 동기화
- activationFollowsSelection: useAria/useAriaZone, selection→onActivate 호출

RadioGroup aria-checked, Tabs aria-selected이 Arrow 키로 자동 변경됨.
17개 파일 atomic restructure."
```

- [ ] **Step 6: Update APG Conformance Matrix**

In `docs/2-areas/pattern/apgConformanceMatrix.md`:
- RadioGroup: 🟡 → 🟢 (selectionFollowsFocus 해소)
- Tabs: 🟡 → 🟢 (selectionFollowsFocus 해소)
- Gap registry: followFocus 갭 항목 제거

```bash
git add docs/2-areas/pattern/apgConformanceMatrix.md
git commit -m "docs: APG matrix — RadioGroup, Tabs 🟡→🟢 (selectionFollowsFocus 해소)"
```

---

## Summary

| Task | What | Files | Complexity |
|------|------|-------|------------|
| 1 | New test file (TDD) | 1 create | Medium |
| 2 | Core API (axis + types + composePattern) | 5 modify | Medium |
| 3 | Primitives (useAria + useAriaZone) | 2 modify | High |
| 4 | Pattern examples (tabs + radiogroup) | 2 modify | Low |
| 5 | Consumers (AppShell, TreeView, etc.) | 6 modify | Medium |
| 6 | Test updates (old + conformance + integration) | 1 delete, 7 modify | Medium |
| 7 | Verification + commit | — | Low |

**Total:** 22 files changed, 1 created, 1 deleted. Single atomic commit.
