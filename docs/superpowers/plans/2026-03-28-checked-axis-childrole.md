# checked axis + heterogeneous childRole Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** checked axis 신설로 expand 오용 해소 + childRole 함수 확장으로 다계층 role 지원, APG #10/#38/#57/#58 해제

**Architecture:** checked axis는 expand axis와 동일한 저장 패턴(`__checked__` 메타 엔티티, `checkedIds: string[]`)을 사용하되 의미적으로 분리. PatternContext에 `isChecked`/`toggleCheck()` 추가. activate axis에 `toggleCheck` 모드 추가. childRole은 `string | ((entity, state) => string)` 유니온으로 확장하여 useAriaView에서 노드별 role 결정.

**Tech Stack:** TypeScript, React, Vitest, @testing-library/react, userEvent

---

### Task 1: checked axis — 커맨드 + 메타 엔티티

**Files:**
- Create: `src/interactive-os/axis/checked.ts`
- Modify: `src/interactive-os/axis/types.ts:66-81` (AxisConfig에 `checkedTracking` 추가)
- Modify: `src/interactive-os/pattern/types.ts:8-18` (NodeState에 `checked` 추가)
- Modify: `src/interactive-os/pattern/types.ts:20-51` (AriaPattern에 `checkedTracking` 추가)

- [ ] **Step 1: Create `src/interactive-os/axis/checked.ts`**

```typescript
import type { AxisConfig, KeyMap } from './types'
import type { Command } from '../engine/types'
import type { NormalizedData } from '../store/types'

export const CHECKED_ID = '__checked__'

function getCheckedIds(store: NormalizedData): string[] {
  return (store.entities[CHECKED_ID]?.checkedIds as string[]) ?? []
}

export const checkedCommands = {
  check(nodeId: string): Command {
    return {
      type: 'core:check',
      payload: { nodeId },
      execute(store) {
        const current = getCheckedIds(store)
        if (current.includes(nodeId)) return store
        return {
          ...store,
          entities: {
            ...store.entities,
            [CHECKED_ID]: { id: CHECKED_ID, checkedIds: [...current, nodeId] },
          },
        }
      },
      undo(store) {
        const current = getCheckedIds(store)
        return {
          ...store,
          entities: {
            ...store.entities,
            [CHECKED_ID]: { id: CHECKED_ID, checkedIds: current.filter((id) => id !== nodeId) },
          },
        }
      },
    }
  },

  uncheck(nodeId: string): Command {
    return {
      type: 'core:uncheck',
      payload: { nodeId },
      execute(store) {
        const current = getCheckedIds(store)
        return {
          ...store,
          entities: {
            ...store.entities,
            [CHECKED_ID]: { id: CHECKED_ID, checkedIds: current.filter((id) => id !== nodeId) },
          },
        }
      },
      undo(store) {
        const current = getCheckedIds(store)
        if (current.includes(nodeId)) return store
        return {
          ...store,
          entities: {
            ...store.entities,
            [CHECKED_ID]: { id: CHECKED_ID, checkedIds: [...current, nodeId] },
          },
        }
      },
    }
  },

  toggleCheck(nodeId: string): Command {
    return {
      type: 'core:toggle-check',
      payload: { nodeId },
      execute(store) {
        const current = getCheckedIds(store)
        const checkedIds = current.includes(nodeId)
          ? current.filter((id) => id !== nodeId)
          : [...current, nodeId]
        return {
          ...store,
          entities: {
            ...store.entities,
            [CHECKED_ID]: { id: CHECKED_ID, checkedIds },
          },
        }
      },
      undo(store) {
        const current = getCheckedIds(store)
        const checkedIds = current.includes(nodeId)
          ? current.filter((id) => id !== nodeId)
          : [...current, nodeId]
        return {
          ...store,
          entities: {
            ...store.entities,
            [CHECKED_ID]: { id: CHECKED_ID, checkedIds },
          },
        }
      },
    }
  },
}

export function checked(): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  const keyMap: KeyMap = {
    Enter: (ctx) => ctx.toggleCheck(),
    Space: (ctx) => ctx.toggleCheck(),
  }
  return { keyMap, config: { checkedTracking: true } }
}
```

- [ ] **Step 2: Add `checkedTracking` to AxisConfig**

In `src/interactive-os/axis/types.ts`, add after line 71 (`expandTracking: boolean`):

```typescript
  /** When true, useAria creates __checked__ entity at init. Set by checked axis. */
  checkedTracking: boolean
```

- [ ] **Step 3: Add `checked` to NodeState**

In `src/interactive-os/pattern/types.ts`, add after line 14 (`expanded?: boolean`):

```typescript
  checked?: boolean | 'mixed'
```

- [ ] **Step 4: Add `checkedTracking` to AriaPattern**

In `src/interactive-os/pattern/types.ts`, add after line 29 (`expandTracking?: boolean`):

```typescript
  /** When true, useAria creates __checked__ entity at init. Set by checked axis. */
  checkedTracking?: boolean
```

- [ ] **Step 5: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS (new types are additive, no consumers yet)

- [ ] **Step 6: Commit**

```bash
git add src/interactive-os/axis/checked.ts src/interactive-os/axis/types.ts src/interactive-os/pattern/types.ts
git commit -m "feat(axis): checked axis — commands + meta entity + NodeState.checked"
```

---

### Task 2: PatternContext — `isChecked`, `toggleCheck()` + composePattern 전달

**Files:**
- Modify: `src/interactive-os/axis/types.ts:36-62` (PatternContext에 checked 메서드 추가)
- Modify: `src/interactive-os/pattern/createPatternContext.ts:38-224` (checked 구현)
- Modify: `src/interactive-os/pattern/composePattern.ts:88-134` (checkedTracking config 전달)

- [ ] **Step 1: Add checked members to PatternContext interface**

In `src/interactive-os/axis/types.ts`, add after line 39 (`isExpanded: boolean`):

```typescript
  isChecked: boolean
```

Add after line 50 (`activate(): Command`):

```typescript
  toggleCheck(): Command
```

- [ ] **Step 2: Import checked into createPatternContext**

In `src/interactive-os/pattern/createPatternContext.ts`, add after line 13 (expand import):

```typescript
import { checkedCommands, CHECKED_ID } from '../axis/checked'
```

- [ ] **Step 3: Add `isChecked` helper function**

In `src/interactive-os/pattern/createPatternContext.ts`, add after line 28 (`isExpanded` function):

```typescript
function isChecked(engine: CommandEngine, nodeId: string): boolean {
  const checkedIds = (engine.getStore().entities[CHECKED_ID]?.checkedIds as string[]) ?? []
  return checkedIds.includes(nodeId)
}
```

- [ ] **Step 4: Add `checkedTracking` to PatternContextOptions**

In `src/interactive-os/pattern/createPatternContext.ts`, add to the `PatternContextOptions` interface (after line 34, `valueRange`):

```typescript
  checkedTracking?: boolean
```

- [ ] **Step 5: Implement checked context members**

In `src/interactive-os/pattern/createPatternContext.ts`, in the return object (after `isExpanded` at line 81), add:

```typescript
    isChecked: isChecked(engine, focusedId),
```

Add after the `activate()` method (after line 141):

```typescript
    toggleCheck(): Command {
      return checkedCommands.toggleCheck(focusedId)
    },
```

- [ ] **Step 6: Update `activate()` to handle checked patterns**

In `src/interactive-os/pattern/createPatternContext.ts`, replace the `activate()` method (lines 137-141):

```typescript
    activate(): Command {
      const children = getChildren(store, focusedId)
      if (options?.checkedTracking) return checkedCommands.toggleCheck(focusedId)
      if (children.length > 0 || options?.expandable) return expandCommands.toggleExpand(focusedId)
      return selectionCommands.select(focusedId)
    },
```

- [ ] **Step 7: Pass `checkedTracking` through composePattern**

In `src/interactive-os/pattern/composePattern.ts`, add in the v2 Identity path (after line 99, the expandTracking line):

```typescript
      ...(mergedConfig.checkedTracking !== undefined && { checkedTracking: mergedConfig.checkedTracking }),
```

And in the v1 PatternConfig path (after line 121, the expandTracking line):

```typescript
      ...(mergedConfig.checkedTracking !== undefined && { checkedTracking: mergedConfig.checkedTracking }),
```

- [ ] **Step 8: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/interactive-os/axis/types.ts src/interactive-os/pattern/createPatternContext.ts src/interactive-os/pattern/composePattern.ts
git commit -m "feat(axis): PatternContext.isChecked + toggleCheck + activate checked 분기"
```

---

### Task 3: useAriaView + useAria + useAriaZone — checked 상태 연결

**Files:**
- Modify: `src/interactive-os/primitives/useAriaView.ts:85-180` (getNodeState에 checked 계산)
- Modify: `src/interactive-os/primitives/useAria.ts:25,70-122,131-165,169-179` (CHECKED_ID 메타, init, sync, derive)
- Modify: `src/interactive-os/primitives/useAriaZone.ts:17-28,44-91,95-116,126-141` (zone-local checked)

- [ ] **Step 1: useAriaView — checked NodeState 계산**

In `src/interactive-os/primitives/useAriaView.ts`, add to the imports (after line 10, expand import):

```typescript
import { CHECKED_ID } from '../axis/checked'
```

Add to `UseAriaViewOptions` interface (after line 72, `expandedIds`):

```typescript
  checkedIds: string[]
```

In the `useAriaView` function, add after the `expandedIds` destructuring (line 89):

```typescript
    checkedIds,
```

Add after `expandedIdSet` useMemo (line 144):

```typescript
  const checkedIdSet = useMemo(() => new Set(checkedIds), [checkedIds])
```

In `getNodeState`, add after `expanded` (line 173), before `level`:

```typescript
        checked: behavior.checkedTracking ? checkedIdSet.has(id) : undefined,
```

Add `checkedIdSet` and `behavior.checkedTracking` to the `getNodeState` useCallback deps array (line 179).

- [ ] **Step 2: useAriaView — pass checkedTracking to behaviorCtxOptions**

In `useAriaView`, add to `behaviorCtxOptions` (after `expandable`, line 133):

```typescript
      checkedTracking: behavior.checkedTracking,
```

Add `behavior.checkedTracking` to the useMemo deps array (line 139).

- [ ] **Step 3: useAria — add CHECKED_ID to META_ENTITY_IDS**

In `src/interactive-os/primitives/useAria.ts`, add import (after line 14, expand import):

```typescript
import { CHECKED_ID } from '../axis/checked'
```

In `META_ENTITY_IDS` (line 25), add `CHECKED_ID`:

```typescript
const META_ENTITY_IDS = new Set([FOCUS_ID, SELECTION_ID, SELECTION_ANCHOR_ID, EXPANDED_ID, CHECKED_ID, GRID_COL_ID, RENAME_ID, '__combobox__', '__spatial_parent__', VALUE_ID, '__search__'])
```

- [ ] **Step 4: useAria — init checked entity**

In `src/interactive-os/primitives/useAria.ts`, add after the expandTracking init block (after line 106):

```typescript
    if (behavior.checkedTracking && !data.entities[CHECKED_ID]) {
      created.syncStore({
        entities: { ...created.getStore().entities, [CHECKED_ID]: { id: CHECKED_ID, checkedIds: [] } },
        relationships: created.getStore().relationships,
      })
    }
```

- [ ] **Step 5: useAria — derive checkedIds**

In `src/interactive-os/primitives/useAria.ts`, add after `expandedIds` derivation (after line 179):

```typescript
  const checkedIds = useMemo(
    () => (store.entities[CHECKED_ID]?.checkedIds as string[]) ?? [],
    [store]
  )
```

- [ ] **Step 6: useAria — pass checkedIds to useAriaView**

In `src/interactive-os/primitives/useAria.ts`, add `checkedIds` to the `useAriaView` call (after `expandedIds`, line 187):

```typescript
    checkedIds,
```

- [ ] **Step 7: useAriaZone — add checked to zone-local state**

In `src/interactive-os/primitives/useAriaZone.ts`, add to `META_COMMAND_TYPES` (after line 26, `core:toggle-expand`):

```typescript
  'core:check',
  'core:uncheck',
  'core:toggle-check',
```

Add `checkedIds: string[]` to `ZoneViewState` interface (after `expandedIds`, line 49):

```typescript
  checkedIds: string[]
```

Initialize `checkedIds: []` in the useState initializer (after `expandedIds: []`, line 112):

```typescript
      checkedIds: [],
```

Add cases to `applyMetaCommand` (after the `core:toggle-expand` case, after line 85):

```typescript
    case 'core:check': {
      const id = p.nodeId as string
      return state.checkedIds.includes(id) ? state : { ...state, checkedIds: [...state.checkedIds, id] }
    }
    case 'core:uncheck': {
      const id = p.nodeId as string
      return { ...state, checkedIds: state.checkedIds.filter(x => x !== id) }
    }
    case 'core:toggle-check': {
      const id = p.nodeId as string
      return state.checkedIds.includes(id)
        ? { ...state, checkedIds: state.checkedIds.filter(x => x !== id) }
        : { ...state, checkedIds: [...state.checkedIds, id] }
    }
```

Add `__checked__` to virtual store (after `__expanded__`, line 136):

```typescript
          __checked__: { id: '__checked__', checkedIds: vs.checkedIds },
```

Destructure `checkedIds` from viewState (line 220, after `expandedIds`):

```typescript
  const { focusedId, selectedIds, expandedIds, checkedIds } = viewState
```

Pass `checkedIds` to `useAriaView` (after `expandedIds`, around line 248):

```typescript
    checkedIds,
```

- [ ] **Step 8: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/interactive-os/primitives/useAriaView.ts src/interactive-os/primitives/useAria.ts src/interactive-os/primitives/useAriaZone.ts
git commit -m "feat(primitives): checked state 연결 — useAriaView/useAria/useAriaZone"
```

---

### Task 4: checkbox/switch/buttonToggle 마이그레이션 — expand → checked

**Files:**
- Modify: `src/interactive-os/pattern/roles/checkbox.ts`
- Modify: `src/interactive-os/pattern/roles/switch.ts`
- Modify: `src/interactive-os/pattern/roles/buttonToggle.ts`
- Test: `src/interactive-os/__tests__/checkbox-apg.conformance.test.tsx` (기존 — 변경 없이 통과 확인)
- Test: `src/interactive-os/__tests__/switch-apg.conformance.test.tsx` (기존 — 변경 없이 통과 확인)
- Test: `src/interactive-os/__tests__/button-apg.conformance.test.tsx` (기존 — 변경 없이 통과 확인)

- [ ] **Step 1: Migrate checkbox.ts**

Replace entire content of `src/interactive-os/pattern/roles/checkbox.ts`:

```typescript
import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { checked } from '../../axis/checked'

// ② 2026-03-28-checked-axis-childrole-prd.md
// APG Checkbox (Two-State): Space/Enter toggles, Tab navigates (natural tab order)
// No arrow key navigation — each checkbox is an independent tab stop
export const checkbox = composePattern(
  {
    role: 'group',
    childRole: 'checkbox',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-checked': String(state.checked ?? false),
    }),
  },
  checked(),
)
```

- [ ] **Step 2: Migrate switch.ts**

Replace entire content of `src/interactive-os/pattern/roles/switch.ts`:

```typescript
import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { checked } from '../../axis/checked'

// ② 2026-03-28-checked-axis-childrole-prd.md
export const switchPattern = composePattern(
  {
    role: 'switch',
    childRole: 'switch',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-checked': String(state.checked ?? false),
    }),
  },
  checked(),
)
```

- [ ] **Step 3: Migrate buttonToggle.ts**

Replace entire content of `src/interactive-os/pattern/roles/buttonToggle.ts`:

```typescript
import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { checked } from '../../axis/checked'

// ② 2026-03-28-checked-axis-childrole-prd.md
// APG Button (toggle): Enter/Space toggles aria-pressed
// Natural tab order — no arrow key navigation between buttons
export const buttonToggle = composePattern(
  {
    role: 'none',
    childRole: 'button',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-pressed': String(state.checked ?? false),
    }),
  },
  checked(),
)
```

- [ ] **Step 4: Update switch test data-checked attribute**

In `src/interactive-os/__tests__/switch-apg.conformance.test.tsx`, line 47, update:

```typescript
          data-checked={state.checked}
```

(Previously was `state.expanded`)

- [ ] **Step 5: Run all existing APG tests**

Run: `pnpm test -- src/interactive-os/__tests__/checkbox-apg.conformance.test.tsx src/interactive-os/__tests__/switch-apg.conformance.test.tsx src/interactive-os/__tests__/button-apg.conformance.test.tsx`
Expected: ALL PASS — aria-checked/aria-pressed behavior unchanged

- [ ] **Step 6: Run full test suite**

Run: `pnpm test`
Expected: All existing tests pass (no regressions)

- [ ] **Step 7: Commit**

```bash
git add src/interactive-os/pattern/roles/checkbox.ts src/interactive-os/pattern/roles/switch.ts src/interactive-os/pattern/roles/buttonToggle.ts src/interactive-os/__tests__/switch-apg.conformance.test.tsx
git commit -m "refactor(pattern): checkbox/switch/buttonToggle — expand → checked axis 마이그레이션"
```

---

### Task 5: useAriaView click handler — checked 패턴의 click toggle

**Files:**
- Modify: `src/interactive-os/primitives/useAriaView.ts:246-270` (click handler에 checked 분기)
- Modify: `src/interactive-os/primitives/useAria.ts:195-248` (click handler에 checked 분기)

- [ ] **Step 1: useAriaView — click handler checked 분기**

In `src/interactive-os/primitives/useAriaView.ts`, import checked commands (after expand import, line 10):

```typescript
import { checkedCommands } from '../axis/checked'
```

In the `onClick` handler inside `getNodeProps` (around line 252-268), replace the block that handles `activateOnClick`:

```typescript
      baseProps.onClick = (event: MouseEvent) => {
        if (event.defaultPrevented) return
        const target = event.target as HTMLElement
        const closestItem = target.closest(`[${nodeIdAttr}]`)
        if (closestItem && closestItem !== (event.currentTarget as HTMLElement)) return
        if (behavior.activateOnClick) {
          const hasModifier = event.shiftKey || event.ctrlKey || event.metaKey
          if (hasModifier) return
          if (onActivateRef.current) {
            if (behavior.checkedTracking) {
              engine.dispatch(checkedCommands.toggleCheck(id))
            } else if (behavior.expandOnParentClick !== false) {
              const children = getChildren(engine.getStore(), id)
              if (children.length > 0) {
                engine.dispatch(expandCommands.toggleExpand(id))
              }
            }
            onActivateRef.current(id)
          } else {
            const ctx = createPatternContext(engine, behaviorCtxOptions)
            const command = ctx.activate()
            if (command) engine.dispatch(command)
          }
        }
      }
```

- [ ] **Step 2: useAria — click handler checked 분기**

In `src/interactive-os/primitives/useAria.ts`, import checked commands (after expand import, line 14):

```typescript
import { checkedCommands } from '../axis/checked'
```

In the `getNodeProps` click handler (around line 228-244), replace the expand block:

```typescript
          if (behavior.activateOnClick && !hasModifier) {
            const cb = engineCallbacksMap.get(engine)
            if (cb?.onActivate) {
              if (behavior.checkedTracking) {
                engine.dispatch(checkedCommands.toggleCheck(id))
              } else if (behavior.expandOnParentClick !== false) {
                const children = getChildren(engine.getStore(), id)
                if (children.length > 0) {
                  engine.dispatch(expandCommands.toggleExpand(id))
                }
              }
              cb.onActivate(id)
            } else {
              const ctx = createPatternContext(engine, behaviorCtxOptions as PatternContextOptions)
              const command = ctx.activate()
              if (command) engine.dispatch(command)
            }
          }
```

- [ ] **Step 3: Run tests**

Run: `pnpm test -- src/interactive-os/__tests__/checkbox-apg.conformance.test.tsx src/interactive-os/__tests__/switch-apg.conformance.test.tsx src/interactive-os/__tests__/button-apg.conformance.test.tsx`
Expected: ALL PASS (click tests included)

- [ ] **Step 4: Commit**

```bash
git add src/interactive-os/primitives/useAriaView.ts src/interactive-os/primitives/useAria.ts
git commit -m "feat(primitives): click handler — checked 패턴의 toggleCheck 분기"
```

---

### Task 6: Checkbox Mixed-State 패턴 + APG 테스트 (#10)

**Files:**
- Create: `src/interactive-os/pattern/roles/checkboxMixed.ts`
- Create: `src/interactive-os/__tests__/checkbox-mixed-apg.conformance.test.tsx`

- [ ] **Step 1: Write the conformance test**

Create `src/interactive-os/__tests__/checkbox-mixed-apg.conformance.test.tsx`:

```typescript
// V1: 2026-03-28-checked-axis-childrole-prd.md
/**
 * APG Conformance: Checkbox (Mixed-State)
 * https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/examples/checkbox-mixed/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { checkboxMixed } from '../pattern/roles/checkboxMixed'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'

// ---------------------------------------------------------------------------
// Fixtures — parent "Condiments" with children
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      condiments: { id: 'condiments', data: { name: 'All condiments' } },
      lettuce: { id: 'lettuce', data: { name: 'Lettuce' } },
      tomato: { id: 'tomato', data: { name: 'Tomato' } },
      mustard: { id: 'mustard', data: { name: 'Mustard' } },
    },
    relationships: {
      [ROOT_ID]: ['condiments'],
      condiments: ['lettuce', 'tomato', 'mustard'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderMixed(data: NormalizedData) {
  return render(
    <Aria behavior={checkboxMixed} data={data} plugins={[]}>
      <Aria.Item render={(props, item, state: NodeState) => (
        <span
          {...props}
          data-testid={`cb-${item.id}`}
          data-checked={state.checked}
        >
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )} />
    </Aria>,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getAriaChecked(container: HTMLElement, id: string): string | null {
  return getNode(container, id)?.getAttribute('aria-checked') ?? null
}

// ---------------------------------------------------------------------------
// 1. ARIA Structure
// ---------------------------------------------------------------------------

describe('APG Checkbox Mixed — ARIA Structure', () => {
  it('all items have role="checkbox"', () => {
    const { container } = renderMixed(fixtureData())
    const checkboxes = container.querySelectorAll('[role="checkbox"]')
    expect(checkboxes.length).toBe(4) // parent + 3 children
  })

  it('initial state: all unchecked', () => {
    const { container } = renderMixed(fixtureData())
    expect(getAriaChecked(container, 'condiments')).toBe('false')
    expect(getAriaChecked(container, 'lettuce')).toBe('false')
    expect(getAriaChecked(container, 'tomato')).toBe('false')
    expect(getAriaChecked(container, 'mustard')).toBe('false')
  })
})

// ---------------------------------------------------------------------------
// 2. Mixed state derivation
// ---------------------------------------------------------------------------

describe('APG Checkbox Mixed — Mixed State', () => {
  it('parent shows mixed when some children checked', async () => {
    const user = userEvent.setup()
    const { container } = renderMixed(fixtureData())

    getNode(container, 'lettuce')!.focus()
    await user.keyboard('{ }')

    expect(getAriaChecked(container, 'lettuce')).toBe('true')
    expect(getAriaChecked(container, 'tomato')).toBe('false')
    expect(getAriaChecked(container, 'condiments')).toBe('mixed')
  })

  it('parent shows true when all children checked', async () => {
    const user = userEvent.setup()
    const { container } = renderMixed(fixtureData())

    getNode(container, 'lettuce')!.focus()
    await user.keyboard('{ }')
    getNode(container, 'tomato')!.focus()
    await user.keyboard('{ }')
    getNode(container, 'mustard')!.focus()
    await user.keyboard('{ }')

    expect(getAriaChecked(container, 'condiments')).toBe('true')
  })

  it('parent shows false when no children checked', () => {
    const { container } = renderMixed(fixtureData())
    expect(getAriaChecked(container, 'condiments')).toBe('false')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- src/interactive-os/__tests__/checkbox-mixed-apg.conformance.test.tsx`
Expected: FAIL — `checkboxMixed` does not exist yet

- [ ] **Step 3: Create checkboxMixed pattern**

Create `src/interactive-os/pattern/roles/checkboxMixed.ts`:

```typescript
// ② 2026-03-28-checked-axis-childrole-prd.md
import type { Entity } from '../../store/types'
import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { checked } from '../../axis/checked'
import { navigate } from '../../axis/navigate'

// APG Checkbox Mixed-State: parent reflects aggregate child state
// Parent: aria-checked = true|false|mixed (derived from children)
// Children: aria-checked = true|false (direct toggle)
export const checkboxMixed = composePattern(
  {
    role: 'group',
    childRole: 'checkbox',
    ariaAttributes: (_node: Entity, state: NodeState) => ({
      'aria-checked': String(state.checked ?? false),
    }),
  },
  checked(),
  navigate({ wrap: false }),
)
```

- [ ] **Step 4: Implement mixed derivation in useAriaView**

In `src/interactive-os/primitives/useAriaView.ts`, in the `getNodeState` callback, replace the `checked` line with mixed-state derivation:

```typescript
        checked: behavior.checkedTracking ? (() => {
          const directChecked = checkedIdSet.has(id)
          const children = getChildren(store, id)
          if (children.length === 0) return directChecked
          // Parent: derive from children
          const checkedCount = children.filter(c => checkedIdSet.has(c)).length
          if (checkedCount === 0) return false
          if (checkedCount === children.length) return true
          return 'mixed' as const
        })() : undefined,
```

- [ ] **Step 5: Run the test**

Run: `pnpm test -- src/interactive-os/__tests__/checkbox-mixed-apg.conformance.test.tsx`
Expected: ALL PASS

- [ ] **Step 6: Run full test suite**

Run: `pnpm test`
Expected: All pass

- [ ] **Step 7: Commit**

```bash
git add src/interactive-os/pattern/roles/checkboxMixed.ts src/interactive-os/__tests__/checkbox-mixed-apg.conformance.test.tsx src/interactive-os/primitives/useAriaView.ts
git commit -m "feat(apg): Checkbox Mixed-State conformance (#10) — checked axis mixed 파생"
```

---

### Task 7: heterogeneous childRole — Identity + useAriaView 확장

**Files:**
- Modify: `src/interactive-os/pattern/composePattern.ts:9-13` (Identity.childRole 타입 확장)
- Modify: `src/interactive-os/pattern/types.ts:20-51` (AriaPattern.childRole 타입 확장)
- Modify: `src/interactive-os/primitives/useAriaView.ts:238-239` (getNodeProps에서 함수 호출)

- [ ] **Step 1: Extend childRole type in Identity**

In `src/interactive-os/pattern/composePattern.ts`, change line 11:

```typescript
  childRole?: string | ((entity: Entity, state: NodeState) => string)
```

Add import at the top (after line 2):

```typescript
import type { NodeState } from './types'
```

(Note: `Entity` is already imported via the AriaPattern import chain. Check — if not, add `import type { Entity } from '../store/types'`)

- [ ] **Step 2: Extend childRole type in AriaPattern**

In `src/interactive-os/pattern/types.ts`, change line 22:

```typescript
  childRole?: string | ((entity: Entity, state: NodeState) => string)
```

- [ ] **Step 3: Update useAriaView getNodeProps to call childRole function**

In `src/interactive-os/primitives/useAriaView.ts`, replace line 239:

```typescript
        role: typeof behavior.childRole === 'function'
          ? behavior.childRole(entity, state)
          : (behavior.childRole ?? 'row'),
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Run all tests**

Run: `pnpm test`
Expected: All pass (string childRole still works, function path untested yet)

- [ ] **Step 6: Commit**

```bash
git add src/interactive-os/pattern/composePattern.ts src/interactive-os/pattern/types.ts src/interactive-os/primitives/useAriaView.ts
git commit -m "feat(pattern): childRole 함수 확장 — (entity, state) => string"
```

---

### Task 8: Listbox Grouped 패턴 + APG 테스트 (#38)

**Files:**
- Create: `src/interactive-os/pattern/roles/listboxGrouped.ts`
- Create: `src/interactive-os/__tests__/listbox-grouped-apg.conformance.test.tsx`

- [ ] **Step 1: Write the conformance test**

Create `src/interactive-os/__tests__/listbox-grouped-apg.conformance.test.tsx`:

```typescript
// V1: 2026-03-28-checked-axis-childrole-prd.md
/**
 * APG Conformance: Listbox with Grouped Options
 * https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-grouped/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Aria } from '../primitives/aria'
import { listboxGrouped } from '../pattern/roles/listboxGrouped'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'

// ---------------------------------------------------------------------------
// Fixtures — groups with options
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      fruits: { id: 'fruits', data: { name: 'Fruits' } },
      apple: { id: 'apple', data: { name: 'Apple' } },
      banana: { id: 'banana', data: { name: 'Banana' } },
      vegs: { id: 'vegs', data: { name: 'Vegetables' } },
      carrot: { id: 'carrot', data: { name: 'Carrot' } },
      pea: { id: 'pea', data: { name: 'Pea' } },
    },
    relationships: {
      [ROOT_ID]: ['fruits', 'vegs'],
      fruits: ['apple', 'banana'],
      vegs: ['carrot', 'pea'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderGrouped(data: NormalizedData) {
  return render(
    <Aria behavior={listboxGrouped} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <span {...props} data-testid={`item-${item.id}`}>
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )} />
    </Aria>,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

// ---------------------------------------------------------------------------
// 1. ARIA Structure — heterogeneous childRole
// ---------------------------------------------------------------------------

describe('APG Listbox Grouped — ARIA Structure', () => {
  it('container has role="listbox"', () => {
    const { container } = renderGrouped(fixtureData())
    expect(container.querySelector('[role="listbox"]')).not.toBeNull()
  })

  it('group nodes have role="group"', () => {
    const { container } = renderGrouped(fixtureData())
    expect(getNode(container, 'fruits')?.getAttribute('role')).toBe('group')
    expect(getNode(container, 'vegs')?.getAttribute('role')).toBe('group')
  })

  it('leaf nodes have role="option"', () => {
    const { container } = renderGrouped(fixtureData())
    expect(getNode(container, 'apple')?.getAttribute('role')).toBe('option')
    expect(getNode(container, 'banana')?.getAttribute('role')).toBe('option')
    expect(getNode(container, 'carrot')?.getAttribute('role')).toBe('option')
    expect(getNode(container, 'pea')?.getAttribute('role')).toBe('option')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/interactive-os/__tests__/listbox-grouped-apg.conformance.test.tsx`
Expected: FAIL — `listboxGrouped` does not exist

- [ ] **Step 3: Create listboxGrouped pattern**

Create `src/interactive-os/pattern/roles/listboxGrouped.ts`:

```typescript
// ② 2026-03-28-checked-axis-childrole-prd.md
import type { Entity } from '../../store/types'
import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { navigate } from '../../axis/navigate'
import { select } from '../../axis/select'
import { activate } from '../../axis/activate'

// APG Listbox with Grouped Options
// Groups at level 1 (role="group"), options at level 2+ (role="option")
export const listboxGrouped = composePattern(
  {
    role: 'listbox',
    childRole: (_entity: Entity, state: NodeState) =>
      (state.level ?? 1) === 1 ? 'group' : 'option',
    ariaAttributes: (_node: Entity, state: NodeState) => ({
      'aria-selected': String(state.selected),
    }),
  },
  navigate({ wrap: true }),
  select({ mode: 'single' }),
  activate({ onClick: true }),
)
```

- [ ] **Step 4: Run the test**

Run: `pnpm test -- src/interactive-os/__tests__/listbox-grouped-apg.conformance.test.tsx`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/pattern/roles/listboxGrouped.ts src/interactive-os/__tests__/listbox-grouped-apg.conformance.test.tsx
git commit -m "feat(apg): Listbox Grouped conformance (#38) — heterogeneous childRole"
```

---

### Task 9: Table 패턴 + APG 테스트 (#57)

**Files:**
- Create: `src/interactive-os/pattern/roles/table.ts`
- Create: `src/interactive-os/__tests__/table-apg.conformance.test.tsx`

- [ ] **Step 1: Write the conformance test**

Create `src/interactive-os/__tests__/table-apg.conformance.test.tsx`:

```typescript
// V1: 2026-03-28-checked-axis-childrole-prd.md
/**
 * APG Conformance: Table
 * https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/table/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Aria } from '../primitives/aria'
import { table } from '../pattern/roles/table'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'

// ---------------------------------------------------------------------------
// Fixtures — rowgroup > row > cell
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      tbody: { id: 'tbody', data: { name: 'Body' } },
      row1: { id: 'row1', data: { name: 'Row 1' } },
      cell1a: { id: 'cell1a', data: { name: 'A1' } },
      cell1b: { id: 'cell1b', data: { name: 'B1' } },
      row2: { id: 'row2', data: { name: 'Row 2' } },
      cell2a: { id: 'cell2a', data: { name: 'A2' } },
      cell2b: { id: 'cell2b', data: { name: 'B2' } },
    },
    relationships: {
      [ROOT_ID]: ['tbody'],
      tbody: ['row1', 'row2'],
      row1: ['cell1a', 'cell1b'],
      row2: ['cell2a', 'cell2b'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderTable(data: NormalizedData) {
  return render(
    <Aria behavior={table} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <span {...props} data-testid={`item-${item.id}`}>
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )} />
    </Aria>,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

// ---------------------------------------------------------------------------
// 1. ARIA Structure — 3-level heterogeneous childRole
// ---------------------------------------------------------------------------

describe('APG Table — ARIA Structure', () => {
  it('container has role="table"', () => {
    const { container } = renderTable(fixtureData())
    expect(container.querySelector('[role="table"]')).not.toBeNull()
  })

  it('level 1 nodes have role="rowgroup"', () => {
    const { container } = renderTable(fixtureData())
    expect(getNode(container, 'tbody')?.getAttribute('role')).toBe('rowgroup')
  })

  it('level 2 nodes have role="row"', () => {
    const { container } = renderTable(fixtureData())
    expect(getNode(container, 'row1')?.getAttribute('role')).toBe('row')
    expect(getNode(container, 'row2')?.getAttribute('role')).toBe('row')
  })

  it('level 3 nodes have role="cell"', () => {
    const { container } = renderTable(fixtureData())
    expect(getNode(container, 'cell1a')?.getAttribute('role')).toBe('cell')
    expect(getNode(container, 'cell1b')?.getAttribute('role')).toBe('cell')
    expect(getNode(container, 'cell2a')?.getAttribute('role')).toBe('cell')
    expect(getNode(container, 'cell2b')?.getAttribute('role')).toBe('cell')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/interactive-os/__tests__/table-apg.conformance.test.tsx`
Expected: FAIL — `table` does not exist

- [ ] **Step 3: Create table pattern**

Create `src/interactive-os/pattern/roles/table.ts`:

```typescript
// ② 2026-03-28-checked-axis-childrole-prd.md
import type { Entity } from '../../store/types'
import type { NodeState } from '../types'
import { composePattern } from '../composePattern'

const ROLE_BY_LEVEL: Record<number, string> = {
  1: 'rowgroup',
  2: 'row',
  3: 'cell',
}

// APG Table: static table with rowgroup > row > cell hierarchy
// Table is non-interactive (natural-tab-order, no keyMap)
export const table = composePattern(
  {
    role: 'table',
    childRole: (_entity: Entity, state: NodeState) =>
      ROLE_BY_LEVEL[state.level ?? 1] ?? 'cell',
    ariaAttributes: () => ({}),
  },
)
```

- [ ] **Step 4: Run the test**

Run: `pnpm test -- src/interactive-os/__tests__/table-apg.conformance.test.tsx`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/pattern/roles/table.ts src/interactive-os/__tests__/table-apg.conformance.test.tsx
git commit -m "feat(apg): Table conformance (#57) — 3-level heterogeneous childRole"
```

---

### Task 10: APG 매트릭스 갱신 + 전체 검증

**Files:**
- Modify: `docs/2-areas/pattern/apgConformanceMatrix.md`

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All pass (including all new + existing tests)

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Update conformance matrix**

In `docs/2-areas/pattern/apgConformanceMatrix.md`:

- #10 Checkbox Mixed-State: change `⛔` to `🟢`, add `checkboxMixed.ts`
- #38 Listbox Grouped: change `⛔` to `🟢`, add `listboxGrouped.ts`
- #57 Table: change `⛔` to `🟢`, add `table.ts`
- #58 Sortable Table: stays `⛔` (needs sort state — out of scope, or change to `🟢` if table.ts covers structure)
- Update summary: 47 🟢 (+3), 10 ⛔ (-3)
- Gap #5: change to `✅ 해소` — checked axis 신설
- Gap #6: change to `✅ 해소` — childRole 함수 확장

- [ ] **Step 4: Commit**

```bash
git add docs/2-areas/pattern/apgConformanceMatrix.md
git commit -m "chore(apg): 매트릭스 갱신 — #10/#38/#57 해제, checked axis + childRole 해소"
```

---

## Self-Review

**1. Spec coverage:**
- ① S1 checkbox toggle → Task 4 (migration) ✅
- ① S2 mixed-state → Task 6 ✅
- ① S3 switch toggle → Task 4 ✅
- ① S4 buttonToggle → Task 4 ✅
- ① S5 table level roles → Task 9 ✅
- ① S6 listbox grouped → Task 8 ✅
- ② All outputs covered ✅
- ⑧ V1-V9 all mapped to tasks ✅

**2. Placeholder scan:** No TBD/TODO/placeholders found ✅

**3. Type consistency:**
- `checkedTracking` used consistently across AxisConfig, AriaPattern, PatternContextOptions, behaviorCtxOptions ✅
- `NodeState.checked: boolean | 'mixed'` consistent with ariaAttributes usage ✅
- `CHECKED_ID = '__checked__'` consistent across checked.ts, useAria.ts, useAriaZone.ts ✅
- `checkedCommands.toggleCheck()` consistent in createPatternContext, useAriaView click, checked axis ✅
- `childRole: string | ((entity, state) => string)` consistent in Identity, AriaPattern, useAriaView ✅
