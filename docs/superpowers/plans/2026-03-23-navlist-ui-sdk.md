# NavList UI SDK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `useNavList` hook + `<NavList>` component as the first hook-first UI SDK product, then replace App.tsx Sidebar with it.

**Architecture:** NavList is an activation-focused navigation list (followFocus + onActivate). `useNavList` hook supports two modes: standalone (creates own engine) or zone (receives external engine). `<NavList>` is a convenience wrapper that uses the hook internally. A custom `navlist` behavior is composed from `activate({ onClick: true, followFocus: true }) + navigate({ orientation: 'vertical' })` — no `select` axis (unlike listbox).

**Tech Stack:** React, interactive-os (behaviors/axes/hooks/plugins), CSS Modules with Surface tokens

**PRD:** `docs/superpowers/prds/2026-03-23-sidebar-ui-sdk-prd.md`

---

### File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/interactive-os/behaviors/navlist.ts` | Create | NavList behavior: activate(followFocus) + navigate(vertical), no select |
| `src/interactive-os/ui/useNavList.ts` | Create | Hook: standalone or zone mode, returns rootProps/getItemProps/state/dispatch |
| `src/interactive-os/ui/NavList.tsx` | Create | Convenience component wrapping useNavList |
| `src/interactive-os/ui/NavList.module.css` | Create | Surface token-based styling |
| `src/interactive-os/__tests__/navlist.integration.test.tsx` | Create | Integration tests: keyboard, click, followFocus, edge cases |
| `src/App.tsx` | Modify:268-322 | Replace Sidebar function with `<NavList>` |
| `src/pages/showcaseRegistry.tsx` | Modify | Add NavList entry |
| `src/pages/showcaseFixtures.ts` | Modify | Add makeNavListData() |

---

### Task 1: NavList Behavior

**Files:**
- Create: `src/interactive-os/behaviors/navlist.ts`

- [ ] **Step 1: Create navlist behavior**

```typescript
import type { NodeState } from './types'
import type { Entity } from '../core/types'
import { composePattern } from '../axes/composePattern'
import { activate } from '../axes/activate'
import { navigate } from '../axes/navigate'

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
  activate({ onClick: true, followFocus: true }),
  navigate({ orientation: 'vertical' }),
)

// Remove Space key — NavList is activation-only, Space is for selection (ListBox)
const { Space: _, ...keyMap } = base.keyMap
export const navlist = { ...base, keyMap }
```

Key differences from `listbox` behavior:
- No `select` axis — NavList is activation-only (followFocus = page change), not selection (multi-select toggle)
- Space key removed — PRD specifies Space = N/A for NavList (differentiator from ListBox)
- `aria-selected` reflects focused state (followFocus = focused is "current")

- [ ] **Step 2: Verify behavior composes without error**

Run: `npx vitest run src/interactive-os/__tests__/navlist --passWithNoTests`
Expected: no import errors (tests don't exist yet, but import check passes via build)

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/behaviors/navlist.ts
git commit -m "feat: add navlist behavior — activation + followFocus, no select"
```

---

### Task 2: useNavList Hook

**Files:**
- Create: `src/interactive-os/ui/useNavList.ts`
- Reference: `src/interactive-os/hooks/useAria.ts` (standalone mode API)
- Reference: `src/interactive-os/hooks/useAriaZone.ts` (zone mode API)

- [ ] **Step 1: Create useNavList hook**

The hook supports two modes based on whether `engine` is provided:

```typescript
import { useMemo } from 'react'
import type { Command, NormalizedData, Plugin } from '../core/types'
import type { NodeState, BehaviorContext } from '../behaviors/types'
import type { CommandEngine } from '../core/createCommandEngine'
import { navlist } from '../behaviors/navlist'
import { useAria } from '../hooks/useAria'
import { useAriaZone } from '../hooks/useAriaZone'
import { core } from '../plugins/core'

interface UseNavListBaseOptions {
  plugins?: Plugin[]
  keyMap?: Record<string, (ctx: BehaviorContext) => Command | void>
  onActivate?: (nodeId: string) => void
  initialFocus?: string
  'aria-label'?: string
}

interface UseNavListStandaloneOptions extends UseNavListBaseOptions {
  data: NormalizedData
  onChange?: (data: NormalizedData) => void
  engine?: undefined
  scope?: undefined
  store?: undefined
}

interface UseNavListZoneOptions extends UseNavListBaseOptions {
  engine: CommandEngine
  scope: string
  store: NormalizedData
  data?: undefined
  onChange?: undefined
}

export type UseNavListOptions = UseNavListStandaloneOptions | UseNavListZoneOptions

export interface UseNavListReturn {
  rootProps: Record<string, unknown>
  getItemProps: (id: string) => Record<string, unknown>
  getItemState: (id: string) => NodeState
  focused: string
  dispatch: (command: Command) => void
  getStore: () => NormalizedData
}

export function useNavList(options: UseNavListOptions): UseNavListReturn {
  // Zone mode: delegate to useAriaZone
  if (options.engine) {
    return useNavListZone(options as UseNavListZoneOptions)
  }
  // Standalone mode: delegate to useAria
  return useNavListStandalone(options as UseNavListStandaloneOptions)
}

function useNavListStandalone(options: UseNavListStandaloneOptions): UseNavListReturn {
  const {
    data,
    plugins = [core()],
    keyMap,
    onChange,
    onActivate,
    initialFocus,
    'aria-label': ariaLabel,
  } = options

  const aria = useAria({
    behavior: navlist,
    data,
    plugins,
    keyMap,
    onChange,
    onActivate,
    initialFocus,
  })

  return {
    rootProps: {
      ...aria.containerProps,
      role: 'listbox',
      'aria-label': ariaLabel,
      'aria-orientation': 'vertical',
      'data-aria-container': '',
    },
    getItemProps: aria.getNodeProps,
    getItemState: aria.getNodeState,
    focused: aria.focused,
    dispatch: aria.dispatch,
    getStore: aria.getStore,
  }
}

function useNavListZone(options: UseNavListZoneOptions): UseNavListReturn {
  const {
    engine,
    scope,
    store,
    plugins,
    keyMap,
    onActivate,
    initialFocus,
    'aria-label': ariaLabel,
  } = options

  const aria = useAriaZone({
    engine,
    store,
    behavior: navlist,
    scope,
    plugins,
    keyMap,
    onActivate,
    initialFocus,
  })

  return {
    rootProps: {
      ...aria.containerProps,
      role: 'listbox',
      'aria-label': ariaLabel,
      'aria-orientation': 'vertical',
      'data-aria-container': '',
    },
    getItemProps: aria.getNodeProps,
    getItemState: aria.getNodeState,
    focused: aria.focused,
    dispatch: aria.dispatch,
    getStore: aria.getStore,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/interactive-os/ui/useNavList.ts
git commit -m "feat: add useNavList hook — standalone and zone modes"
```

---

### Task 3: Integration Tests

**Files:**
- Create: `src/interactive-os/__tests__/navlist.integration.test.tsx`
- Reference: `src/interactive-os/__tests__/follow-focus.test.tsx` (pattern reference)

Tests verify PRD ⑧ scenarios V1, V3, V6–V10. V2 (App.tsx replacement) is verified manually in Task 6. V4 (zone mode) and V5 (visual) are verified separately.

- [ ] **Step 1: Write integration tests**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { NavList } from '../ui/NavList'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'

function makeNavData(labels: string[]): NormalizedData {
  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const ids: string[] = []
  for (const label of labels) {
    const id = label.toLowerCase()
    entities[id] = { id, data: { label } }
    ids.push(id)
  }
  return createStore({ entities, relationships: { [ROOT_ID]: ids } })
}

// Test wrapper that renders activated ID as visible DOM output
function NavListWithActivatedDisplay({ data, ...rest }: { data: NormalizedData; 'aria-label': string }) {
  const [activated, setActivated] = useState('')
  return (
    <>
      <NavList data={data} onActivate={setActivated} {...rest} />
      <div data-testid="activated">{activated}</div>
    </>
  )
}

describe('NavList', () => {
  // V1: ArrowDown moves focus + activates
  it('ArrowDown moves focus to next item and activates it', async () => {
    const user = userEvent.setup()
    render(<NavListWithActivatedDisplay data={makeNavData(['Alpha', 'Beta', 'Gamma'])} aria-label="Test nav" />)

    await user.click(screen.getByRole('option', { name: 'Alpha' }))
    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('option', { name: 'Beta' })).toHaveFocus()
    expect(screen.getByTestId('activated')).toHaveTextContent('beta')
  })

  // V1 supplement: ArrowUp
  it('ArrowUp moves focus to previous item and activates it', async () => {
    const user = userEvent.setup()
    render(<NavListWithActivatedDisplay data={makeNavData(['Alpha', 'Beta', 'Gamma'])} aria-label="Test nav" />)

    await user.click(screen.getByRole('option', { name: 'Beta' }))
    await user.keyboard('{ArrowUp}')

    expect(screen.getByRole('option', { name: 'Alpha' })).toHaveFocus()
    expect(screen.getByTestId('activated')).toHaveTextContent('alpha')
  })

  // V1 supplement: Home/End
  it('Home moves to first, End moves to last', async () => {
    const user = userEvent.setup()
    render(<NavListWithActivatedDisplay data={makeNavData(['Alpha', 'Beta', 'Gamma'])} aria-label="Test nav" />)

    await user.click(screen.getByRole('option', { name: 'Beta' }))
    await user.keyboard('{Home}')
    expect(screen.getByRole('option', { name: 'Alpha' })).toHaveFocus()

    await user.keyboard('{End}')
    expect(screen.getByRole('option', { name: 'Gamma' })).toHaveFocus()
    expect(screen.getByTestId('activated')).toHaveTextContent('gamma')
  })

  // V1 supplement: Click activates
  it('click on item focuses and activates it', async () => {
    const user = userEvent.setup()
    render(<NavListWithActivatedDisplay data={makeNavData(['Alpha', 'Beta'])} aria-label="Test nav" />)

    await user.click(screen.getByRole('option', { name: 'Beta' }))
    expect(screen.getByRole('option', { name: 'Beta' })).toHaveFocus()
    expect(screen.getByTestId('activated')).toHaveTextContent('beta')
  })

  // V6: Empty data renders without error
  it('renders empty listbox without error', () => {
    render(<NavList data={createStore({ entities: {}, relationships: { [ROOT_ID]: [] } })} aria-label="Empty nav" />)
    expect(screen.getByRole('listbox', { name: 'Empty nav' })).toBeInTheDocument()
  })

  // V3: Custom renderItem
  it('supports custom renderItem', () => {
    render(
      <NavList
        data={makeNavData(['Alpha'])}
        renderItem={(node) => <span data-testid="custom">{(node.data as { label: string }).label}!</span>}
        aria-label="Custom nav"
      />
    )
    expect(screen.getByTestId('custom')).toHaveTextContent('Alpha!')
  })

  // V7: External activeId change syncs focus
  it('syncs focus when data changes with new FOCUS_ID', async () => {
    const user = userEvent.setup()
    function ExternalSync() {
      const [data, setData] = useState(makeNavData(['Alpha', 'Beta', 'Gamma']))
      return (
        <>
          <NavList data={data} aria-label="Sync nav" />
          <button onClick={() => {
            setData(prev => ({
              ...prev,
              entities: { ...prev.entities, __focus__: { id: '__focus__', focusedId: 'gamma' } },
            }))
          }}>Focus Gamma</button>
        </>
      )
    }
    render(<ExternalSync />)
    await user.click(screen.getByRole('option', { name: 'Alpha' }))
    await user.click(screen.getByRole('button', { name: 'Focus Gamma' }))
    expect(screen.getByRole('option', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'true')
  })

  // V8: Nonexistent activeId fallback — verified by E4 boundary
  it('handles nonexistent activeId gracefully', () => {
    const data = makeNavData(['Alpha', 'Beta'])
    const withBadFocus = {
      ...data,
      entities: { ...data.entities, __focus__: { id: '__focus__', focusedId: 'nonexistent' } },
    }
    render(<NavList data={withBadFocus} aria-label="Bad focus nav" />)
    // Should render without error, first item gets focus
    expect(screen.getByRole('listbox', { name: 'Bad focus nav' })).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  // V10: Long list — End key reaches last item
  it('End key reaches last item in a long list', async () => {
    const user = userEvent.setup()
    const labels = Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`)
    render(<NavList data={makeNavData(labels)} aria-label="Long nav" />)

    await user.click(screen.getByRole('option', { name: 'Item 1' }))
    await user.keyboard('{End}')
    expect(screen.getByRole('option', { name: 'Item 30' })).toHaveFocus()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/interactive-os/__tests__/navlist.integration.test.tsx`
Expected: FAIL — `NavList` not yet exported

- [ ] **Step 3: Commit test file**

```bash
git add src/interactive-os/__tests__/navlist.integration.test.tsx
git commit -m "test: add NavList integration tests (red phase)"
```

---

### Task 4: NavList Component

**Files:**
- Create: `src/interactive-os/ui/NavList.tsx`
- Reference: `src/interactive-os/ui/ListBox.tsx` (existing pattern)

- [ ] **Step 1: Create NavList component**

```tsx
import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { useNavList } from './useNavList'
import { core } from '../plugins/core'
import { ROOT_ID } from '../core/types'
import { getChildren } from '../core/createStore'

interface NavListProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState) => React.ReactNode
  initialFocus?: string
  'aria-label'?: string
}

const defaultRenderItem = (item: Record<string, unknown>, _state: NodeState): React.ReactNode => (
  <span>
    {(item.data as Record<string, unknown>)?.label as string ?? (item.data as Record<string, unknown>)?.name as string ?? item.id as string}
  </span>
)

export function NavList({
  data,
  plugins = [core()],
  onChange,
  onActivate,
  renderItem = defaultRenderItem,
  initialFocus,
  'aria-label': ariaLabel,
}: NavListProps) {
  const nav = useNavList({
    data,
    plugins,
    onChange,
    onActivate,
    initialFocus,
    'aria-label': ariaLabel,
  })

  const store = nav.getStore()
  const childIds = getChildren(store, ROOT_ID)

  return (
    <div {...(nav.rootProps as React.HTMLAttributes<HTMLDivElement>)}>
      {childIds.map((id) => {
        const entity = store.entities[id]
        if (!entity) return null
        const state = nav.getItemState(id)
        const props = nav.getItemProps(id)
        return (
          <div key={id} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
            {renderItem(entity, state)}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run src/interactive-os/__tests__/navlist.integration.test.tsx`
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/ui/NavList.tsx
git commit -m "feat: add NavList component — convenience wrapper over useNavList"
```

---

### Task 5: NavList Styles

**Files:**
- Create: `src/interactive-os/ui/NavList.module.css`
- Modify: `src/interactive-os/ui/NavList.tsx` (import styles)
- Reference: `src/styles/tokens.css` (Surface token variables)

- [ ] **Step 1: Check existing Surface token variables**

Read `src/styles/tokens.css` to find available `--surface-*`, `--text-*`, `--border-*`, `--focus-*` tokens.

- [ ] **Step 2: Create NavList.module.css**

Style the NavList container and items with Surface tokens. States: default, hover, focused, active (current page).

```css
.root {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
}

.item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 20px;
  transition: background-color 0.1s, color 0.1s;
  outline: none;
}

.item:hover {
  background-color: var(--surface-hover);
  color: var(--text-primary);
}

.item[data-focused="true"] {
  background-color: var(--surface-active);
  color: var(--text-primary);
}

.item:focus-visible {
  box-shadow: 0 0 0 2px var(--focus-ring);
}
```

- [ ] **Step 3: Update NavList.tsx to use styles**

Import `styles` from `NavList.module.css` and apply `styles.root` to container, `styles.item` to each item div. Add `data-focused={state.focused}` to item divs.

- [ ] **Step 4: Visual verification**

Run: `npm run dev` and navigate to `http://localhost:5173/ui`
Check: NavList demo renders with proper styling in both dark/light themes.

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/ui/NavList.module.css src/interactive-os/ui/NavList.tsx
git commit -m "feat: add NavList styles — Surface tokens, focus/hover/active states"
```

---

### Task 6: Replace App.tsx Sidebar

**Files:**
- Modify: `src/App.tsx:268-322` (Sidebar function)

- [ ] **Step 1: Replace Sidebar with NavList**

Current Sidebar (lines 268-322) uses `<Aria behavior={listbox}>` with manual store management. Replace with `<NavList>`:

```tsx
function Sidebar({ activeGroup, activeItemPath }: { activeGroup: RouteGroup; activeItemPath?: string }) {
  const navigate = useNavigate()

  const handleActivate = useCallback((nodeId: string) => {
    navigate(`/${activeGroup.id}/${nodeId}`)
  }, [navigate, activeGroup.id])

  const sidebarStore = useMemo(() => {
    const base = sidebarStores[activeGroup.id]
    if (!activeItemPath || !base.entities[activeItemPath]) return base
    return {
      ...base,
      entities: {
        ...base.entities,
        [FOCUS_ID]: { id: FOCUS_ID, focusedId: activeItemPath },
      },
    }
  }, [activeGroup.id, activeItemPath])

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-mark" />
          <h1>interactive-os</h1>
        </div>
        <span className="version">v0.1.0</span>
      </div>
      <div className="sidebar-section-title">{activeGroup.label}</div>
      <NavList
        key={activeGroup.id}
        data={sidebarStore}
        onActivate={handleActivate}
        renderItem={(node) => {
          const item = activeGroup.items.find((i) => i.path === node.id)
          return (
            <div className="sidebar-link">
              {(node.data as { label: string }).label}
              {item?.status === 'wip' && <span className="badge-wip">wip</span>}
              {item?.status === 'placeholder' && <span className="badge-wip">soon</span>}
            </div>
          )
        }}
        aria-label={`${activeGroup.label} pages`}
      />
    </nav>
  )
}
```

Update imports: add `NavList` from `./interactive-os/ui/NavList`, remove `Aria` and `listbox` if no longer used elsewhere in App.tsx (they are still used for ActivityBar, so keep them).

- [ ] **Step 2: Verify in browser**

Run: `npm run dev`
Navigate to any OS route (e.g., `/store/listbox`)
Check: Sidebar renders, keyboard navigation works (↑↓), clicking navigates to correct page, active item highlighted.

- [ ] **Step 3: Run existing tests**

Run: `npx vitest run`
Expected: All existing tests pass (no regression).

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: replace App.tsx Sidebar with NavList component"
```

---

### Task 7: Showcase Registration

**Files:**
- Modify: `src/pages/showcaseRegistry.tsx`
- Modify: `src/pages/showcaseFixtures.ts`

- [ ] **Step 1: Add makeNavListData to fixtures**

```typescript
export function makeNavListData(): NormalizedData {
  return createStore({
    entities: {
      home: { id: 'home', data: { label: 'Home' } },
      products: { id: 'products', data: { label: 'Products' } },
      about: { id: 'about', data: { label: 'About' } },
      settings: { id: 'settings', data: { label: 'Settings' } },
      help: { id: 'help', data: { label: 'Help' } },
    },
    relationships: {
      [ROOT_ID]: ['home', 'products', 'about', 'settings', 'help'],
    },
  })
}
```

- [ ] **Step 2: Add NavList entry to showcaseRegistry**

```typescript
{
  slug: 'navlist',
  name: 'NavList',
  description: 'Vertical navigation list with keyboard navigation and followFocus activation.',
  usage: `import { NavList } from 'interactive-os/ui/NavList'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    home: { id: 'home', data: { label: 'Home' } },
    about: { id: 'about', data: { label: 'About' } },
  },
  relationships: { __root__: ['home', 'about'] },
})

<NavList data={data} onActivate={(id) => navigate(id)} />`,
  render: (data, onChange) => <NavList data={data} onChange={onChange} onActivate={() => {}} />,
  makeData: makeNavListData,
}
```

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:5173/ui/navlist`
Check: NavList demo renders, keyboard works, description and usage code shown.

- [ ] **Step 4: Commit**

```bash
git add src/pages/showcaseRegistry.tsx src/pages/showcaseFixtures.ts
git commit -m "feat: add NavList to UI showcase"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass including new navlist tests.

- [ ] **Step 2: Browser verification checklist**

Navigate to `http://localhost:5173/store/listbox` (or any OS route):
- [ ] Sidebar renders with NavList
- [ ] ↑↓ arrow keys navigate items
- [ ] Home/End jump to first/last
- [ ] Click navigates to page
- [ ] Active item is visually highlighted
- [ ] Tab into sidebar focuses last active item
- [ ] Works in both dark and light themes

Navigate to `http://localhost:5173/ui/navlist`:
- [ ] NavList demo renders in showcase
- [ ] Live demo is interactive

- [ ] **Step 3: Commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: NavList final adjustments after verification"
```
