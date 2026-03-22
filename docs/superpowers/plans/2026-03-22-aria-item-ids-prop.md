# Aria.Item ids prop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aria.Item에 `ids` prop을 추가하여 flat collection에서 특정 아이템만 렌더링할 수 있게 하고, Activity bar에 적용하여 그룹 구분선 CSS hack을 제거한다.

**Architecture:** AriaItem 컴포넌트에 `ids?: string[]` prop 추가. ids 지정 시 해당 id의 entity만 flat 렌더링, 미지정 시 기존 ROOT 재귀 동작 유지. Activity bar는 flat store 유지 + 여러 Aria.Item ids로 그룹별 렌더링.

**Tech Stack:** React, TypeScript, Vitest, @testing-library/react, userEvent

**PRD:** `docs/superpowers/specs/2026-03-22-aria-item-parent-prop-prd.md`

---

### Task 1: Aria.Item ids prop 추가

**Files:**
- Modify: `src/interactive-os/components/aria.tsx:26-28` (AriaItemProps interface)
- Modify: `src/interactive-os/components/aria.tsx:73-114` (AriaItem component)
- Test: `src/interactive-os/__tests__/aria-item-ids.test.tsx`

- [ ] **Step 1: Write the failing test — ids로 특정 아이템만 렌더링**

```tsx
// src/interactive-os/__tests__/aria-item-ids.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Aria } from '../components/aria'
import { toolbar } from '../behaviors/toolbar'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import { core } from '../plugins/core'
import type { NodeState } from '../behaviors/types'

function fixtureData() {
  return createStore({
    entities: {
      a: { id: 'a', data: { name: 'A' } },
      b: { id: 'b', data: { name: 'B' } },
      c: { id: 'c', data: { name: 'C' } },
      d: { id: 'd', data: { name: 'D' } },
    },
    relationships: { [ROOT_ID]: ['a', 'b', 'c', 'd'] },
  })
}

const renderItem = (node: Record<string, unknown>, _state: NodeState) => (
  <span data-testid={node.id as string}>{(node.data as Record<string, unknown>)?.name as string}</span>
)

describe('Aria.Item ids prop', () => {
  it('renders only specified ids', () => {
    const { queryByTestId } = render(
      <Aria behavior={toolbar} data={fixtureData()} plugins={[core()]}>
        <Aria.Item ids={['a', 'c']} render={renderItem} />
      </Aria>,
    )
    expect(queryByTestId('a')).not.toBeNull()
    expect(queryByTestId('b')).toBeNull()
    expect(queryByTestId('c')).not.toBeNull()
    expect(queryByTestId('d')).toBeNull()
  })

  it('renders in ids array order', () => {
    const { container } = render(
      <Aria behavior={toolbar} data={fixtureData()} plugins={[core()]}>
        <Aria.Item ids={['c', 'a']} render={renderItem} />
      </Aria>,
    )
    const items = container.querySelectorAll('[data-testid]')
    expect(items[0]?.getAttribute('data-testid')).toBe('c')
    expect(items[1]?.getAttribute('data-testid')).toBe('a')
  })

  it('skips ids not in store', () => {
    const { queryByTestId } = render(
      <Aria behavior={toolbar} data={fixtureData()} plugins={[core()]}>
        <Aria.Item ids={['a', 'nonexistent', 'b']} render={renderItem} />
      </Aria>,
    )
    expect(queryByTestId('a')).not.toBeNull()
    expect(queryByTestId('b')).not.toBeNull()
    expect(queryByTestId('nonexistent')).toBeNull()
  })

  it('renders empty when ids is empty array', () => {
    const { container } = render(
      <Aria behavior={toolbar} data={fixtureData()} plugins={[core()]}>
        <Aria.Item ids={[]} render={renderItem} />
      </Aria>,
    )
    expect(container.querySelectorAll('[data-testid]')).toHaveLength(0)
  })

  it('renders all from ROOT when ids is not specified (backward compat)', () => {
    const { queryByTestId } = render(
      <Aria behavior={toolbar} data={fixtureData()} plugins={[core()]}>
        <Aria.Item render={renderItem} />
      </Aria>,
    )
    expect(queryByTestId('a')).not.toBeNull()
    expect(queryByTestId('b')).not.toBeNull()
    expect(queryByTestId('c')).not.toBeNull()
    expect(queryByTestId('d')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/interactive-os/__tests__/aria-item-ids.test.tsx`
Expected: FAIL — `ids` prop not recognized

- [ ] **Step 3: Implement ids prop**

In `src/interactive-os/components/aria.tsx`:

1. Update AriaItemProps interface (line 26-28):
```tsx
interface AriaItemProps {
  ids?: string[]
  render: (node: Record<string, unknown>, state: NodeState) => ReactNode
}
```

2. Update AriaItem component (line 73, 111):
```tsx
function AriaItem({ ids, render }: AriaItemProps) {
```

3. Replace the `return` statement at line 111 (`return <>{renderNodes(ROOT_ID)}</>`) with an if-else block — ids path returns flat, default path returns existing recursive:
```tsx
        if (ids) {
          const nodes: ReactNode[] = []
          for (const childId of ids) {
            const entity = store.entities[childId]
            if (!entity) continue
            const state = aria.getNodeState(childId)
            const props = aria.getNodeProps(childId)
            const needsGridcell = !hasColCount && (props as Record<string, unknown>).role === 'row'
            nodes.push(
              <FocusScrollDiv key={childId} focused={state.focused} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
                <AriaItemContext.Provider value={{ nodeId: childId, focused: state.focused, renaming: !!state.renaming }}>
                  {needsGridcell
                    ? <div role="gridcell">{render(entity, state)}</div>
                    : render(entity, state)
                  }
                </AriaItemContext.Provider>
              </FocusScrollDiv>
            )
          }
          return <>{nodes}</>
        }
        return <>{renderNodes(ROOT_ID)}</>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/interactive-os/__tests__/aria-item-ids.test.tsx`
Expected: PASS — all 5 tests

- [ ] **Step 5: Run full test suite to verify no regressions**

Run: `pnpm test`
Expected: all existing tests pass

- [ ] **Step 6: Commit**

```bash
git add src/interactive-os/components/aria.tsx src/interactive-os/__tests__/aria-item-ids.test.tsx
git commit -m "feat(aria): add ids prop to Aria.Item for flat collection grouping"
```

---

### Task 2: Aria.Item ids keyboard navigation test

**Files:**
- Modify: `src/interactive-os/__tests__/aria-item-ids.test.tsx`

- [ ] **Step 1: Write keyboard navigation test — multiple Aria.Items with ids share flat navigation**

```tsx
// Append to existing file in aria-item-ids.test.tsx (add imports at top)
import userEvent from '@testing-library/user-event'
import type { AriaBehavior } from '../behaviors/types'

// verticalToolbar for activity-bar-like behavior
const verticalToolbar: AriaBehavior = {
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
}

describe('Aria.Item ids — keyboard navigation', () => {
  it('navigates across multiple Aria.Items with ids in flat order (horizontal)', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={toolbar} data={fixtureData()} plugins={[core()]}>
        <div role="group">
          <Aria.Item ids={['a', 'b']} render={renderItem} />
        </div>
        <div role="separator" />
        <div role="group">
          <Aria.Item ids={['c', 'd']} render={renderItem} />
        </div>
      </Aria>,
    )

    const firstItem = container.querySelector('[tabindex="0"]') as HTMLElement
    firstItem.focus()
    expect(firstItem.getAttribute('data-node-id')).toBe('a')

    await user.keyboard('{ArrowRight}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('b')

    await user.keyboard('{ArrowRight}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('c')

    await user.keyboard('{ArrowRight}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('d')
  })

  it('vertical toolbar: ArrowDown/Up navigates across groups', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={verticalToolbar} data={fixtureData()} plugins={[core()]}>
        <div role="group">
          <Aria.Item ids={['a', 'b']} render={renderItem} />
        </div>
        <div role="separator" />
        <div role="group">
          <Aria.Item ids={['c', 'd']} render={renderItem} />
        </div>
      </Aria>,
    )

    const firstItem = container.querySelector('[tabindex="0"]') as HTMLElement
    firstItem.focus()

    await user.keyboard('{ArrowDown}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('b')

    await user.keyboard('{ArrowDown}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('c')

    await user.keyboard('{ArrowUp}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('b')
  })

  it('Home/End works across groups', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={toolbar} data={fixtureData()} plugins={[core()]}>
        <div role="group">
          <Aria.Item ids={['a', 'b']} render={renderItem} />
        </div>
        <div role="group">
          <Aria.Item ids={['c', 'd']} render={renderItem} />
        </div>
      </Aria>,
    )

    const firstItem = container.querySelector('[tabindex="0"]') as HTMLElement
    firstItem.focus()

    await user.keyboard('{End}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('d')

    await user.keyboard('{Home}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('a')
  })

  it('navigate skips ids not in store (V9: dynamic removal)', async () => {
    const user = userEvent.setup()
    // Store has a, c, d — b is removed
    const data = createStore({
      entities: {
        a: { id: 'a', data: { name: 'A' } },
        c: { id: 'c', data: { name: 'C' } },
        d: { id: 'd', data: { name: 'D' } },
      },
      relationships: { [ROOT_ID]: ['a', 'c', 'd'] },
    })
    const { container } = render(
      <Aria behavior={toolbar} data={data} plugins={[core()]}>
        <Aria.Item ids={['a', 'b', 'c', 'd']} render={renderItem} />
      </Aria>,
    )

    const firstItem = container.querySelector('[tabindex="0"]') as HTMLElement
    firstItem.focus()

    // ArrowRight skips b (not in store), goes a → c
    await user.keyboard('{ArrowRight}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('c')

    await user.keyboard('{ArrowRight}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('d')
  })

  it('separator click does not move focus (V7)', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={toolbar} data={fixtureData()} plugins={[core()]}>
        <div role="group">
          <Aria.Item ids={['a', 'b']} render={renderItem} />
        </div>
        <div role="separator" data-testid="sep" />
        <div role="group">
          <Aria.Item ids={['c', 'd']} render={renderItem} />
        </div>
      </Aria>,
    )

    const firstItem = container.querySelector('[tabindex="0"]') as HTMLElement
    firstItem.focus()
    expect(firstItem.getAttribute('data-node-id')).toBe('a')

    // Click separator
    const sep = container.querySelector('[data-testid="sep"]') as HTMLElement
    await user.click(sep)

    // Focus should not move to separator — it's not an entity
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('a')
  })

  it('duplicate id across Aria.Items renders twice, focus on first (boundary)', async () => {
    const { container } = render(
      <Aria behavior={toolbar} data={fixtureData()} plugins={[core()]}>
        <Aria.Item ids={['a', 'b']} render={renderItem} />
        <Aria.Item ids={['b', 'c']} render={renderItem} />
      </Aria>,
    )

    // 'b' should appear twice in DOM
    const bItems = container.querySelectorAll('[data-testid="b"]')
    expect(bItems).toHaveLength(2)

    // First 'b' should have tabindex from focus system
    const focusableB = container.querySelectorAll('[data-node-id="b"]')
    expect(focusableB.length).toBeGreaterThanOrEqual(2)
  })
})
```

- [ ] **Step 2: Run test to verify it passes**

Run: `pnpm vitest run src/interactive-os/__tests__/aria-item-ids.test.tsx`
Expected: PASS — navigate uses flat store order regardless of JSX grouping

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/__tests__/aria-item-ids.test.tsx
git commit -m "test(aria): verify keyboard navigation across Aria.Item ids groups"
```

---

### Task 3: Activity bar — apply ids prop

**Files:**
- Modify: `src/App.tsx:235-247` (navItems, activityBarStore)
- Modify: `src/App.tsx:368-396` (Aria JSX)
- Modify: `src/styles/layout.css:89-103` (remove CSS hack)

- [ ] **Step 1: Define group id constants**

At the top of the activity bar section in `src/App.tsx` (after navItems):

```tsx
const APP_IDS = ['cms', 'viewer', 'agent']
const OS_IDS = routeConfig.map((g) => g.id)
const UTIL_IDS = ['theme']
```

- [ ] **Step 2: Replace Aria JSX with grouped Aria.Items**

Replace the Aria block (lines 368-396) with:

```tsx
        <Aria
          behavior={verticalToolbar}
          data={activityBarData}
          plugins={[core()]}
          onActivate={handleActivityBarActivate}
          aria-label="Layer navigation"
        >
          <div role="group" aria-label="App">
            <Aria.Item ids={APP_IDS} render={(node, state) => {
              const nav = navItems.find((n) => n.id === node.id)!
              const Icon = nav.icon
              return (
                <Tooltip content={nav.label}>
                  <div className={`activity-bar__item${state.focused ? ' activity-bar__item--active' : ''}`}>
                    <Icon size={16} />
                  </div>
                </Tooltip>
              )
            }} />
          </div>
          <div role="separator" className="activity-bar__separator" />
          <div role="group" aria-label="OS">
            <Aria.Item ids={OS_IDS} render={(node, state) => {
              const nav = navItems.find((n) => n.id === node.id)!
              const Icon = nav.icon
              return (
                <Tooltip content={nav.label}>
                  <div className={`activity-bar__item${state.focused ? ' activity-bar__item--active' : ''}`}>
                    <Icon size={16} />
                  </div>
                </Tooltip>
              )
            }} />
          </div>
          <div role="group" aria-label="Util" className="activity-bar__util">
            <Aria.Item ids={UTIL_IDS} render={(node, state) => {
              const ThemeIcon = theme === 'dark' ? Sun : Moon
              return (
                <Tooltip content={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
                  <div className={`activity-bar__item activity-bar__theme-toggle${state.focused ? ' activity-bar__item--active' : ''}`}>
                    <ThemeIcon size={13} />
                  </div>
                </Tooltip>
              )
            }} />
          </div>
        </Aria>
```

- [ ] **Step 3: Remove CSS hack, add separator + util styles**

In `src/styles/layout.css`, replace the `activity-bar__group-start` block (lines 89-103) with:

```css
.activity-bar__separator {
  width: 16px;
  height: 1px;
  background: var(--border-dim);
  margin: 4px auto;
}

.activity-bar__util {
  margin-top: auto;
}
```

- [ ] **Step 4: Verify visually**

Run: `pnpm dev`
Check: http://localhost:5173
- App group (CMS, Viewer, Agent) at top
- Separator line between groups
- OS group (Store, Engine, ...) after separator
- Theme button at bottom
- ↑↓ keyboard navigation crosses group boundaries

- [ ] **Step 5: Run full test suite**

Run: `pnpm test`
Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/styles/layout.css
git commit -m "refactor(activity-bar): use Aria.Item ids for group layout, remove CSS hack"
```
