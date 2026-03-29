# Aria.Panel + Aria.Trigger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Aria.Panel and Aria.Trigger primitives so multi-zone APG patterns (Tabs, Accordion, MenuButton) can express their native DOM structure.

**Architecture:** Panel is a store-iterating renderer (same as Item) that controls visibility via selected/expanded state and auto-generates aria-labelledby/aria-controls cross-references. Trigger is a popup entry point that reads triggerKeyMap from composePattern and wires popup axis open/close to DOM events. Neither component hardcodes key bindings — composePattern owns all key→handler decisions.

**Tech Stack:** React, vitest, @testing-library/react, userEvent

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/interactive-os/pattern/types.ts` | Modify | Add `panelRole`, `panelVisibility`, `triggerKeyMap`, `triggerClickMap` to AriaPattern |
| `src/interactive-os/pattern/composePattern.ts` | Modify | Accept triggerKeyMap/triggerClickMap, pass through panelRole/panelVisibility from Identity |
| `src/interactive-os/primitives/aria.tsx` | Modify | Add AriaPanel and AriaTrigger components, export on Aria object |
| `src/interactive-os/pattern/roles/tabs.ts` | Modify | Add panelRole/panelVisibility |
| `src/interactive-os/pattern/roles/accordion.ts` | Modify | Add panelRole/panelVisibility |
| `src/interactive-os/pattern/roles/menuButton.ts` | Modify | Add triggerKeyMap |
| `src/interactive-os/pattern/examples/TabsAutomatic.tsx` | Modify | Use Aria.Panel |
| `src/interactive-os/pattern/examples/Accordion.tsx` | Modify | Use Aria.Panel |
| `src/interactive-os/pattern/examples/MenuActions.tsx` | Modify | Use Aria.Trigger |
| `src/interactive-os/__tests__/aria-panel.test.tsx` | Create | Panel conformance tests (V1, V2, V5, V7) |
| `src/interactive-os/__tests__/aria-trigger.test.tsx` | Create | Trigger conformance tests (V3, V4, V8, V9) |

---

### Task 1: AriaPattern type extensions

**Files:**
- Modify: `src/interactive-os/pattern/types.ts`

- [ ] **Step 1: Add panelRole, panelVisibility, triggerKeyMap, triggerClickMap to AriaPattern**

```ts
// Add after popupModal field (line ~51):

  /** Panel role — when set, Aria.Panel renders with this ARIA role (tabpanel, region). */
  panelRole?: string
  /** Panel visibility condition — 'selected' for tabs, 'expanded' for accordion. */
  panelVisibility?: 'selected' | 'expanded'
  /** Trigger-specific keyMap — Aria.Trigger binds these instead of the main keyMap. */
  triggerKeyMap?: Record<string, (ctx: PatternContext) => Command | void>
  /** Trigger-specific clickMap — modifier → handler for Aria.Trigger clicks. */
  triggerClickMap?: Partial<import('../axis/types').ClickMap>
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS (new optional fields don't break existing code)

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/pattern/types.ts
git commit -m "feat: add panelRole, panelVisibility, triggerKeyMap to AriaPattern type"
```

---

### Task 2: composePattern — Identity extensions

**Files:**
- Modify: `src/interactive-os/pattern/composePattern.ts`

- [ ] **Step 1: Extend Identity interface**

```ts
export interface Identity {
  role: string
  childRole?: string | ((entity: Entity, state: NodeState) => string)
  ariaAttributes: (node: Entity, state: NodeState) => Record<string, string>
  // ② 2026-03-28-aria-panel-trigger-prd.md
  panelRole?: string
  panelVisibility?: 'selected' | 'expanded'
  triggerKeyMap?: Record<string, (ctx: PatternContext) => Command | void>
  triggerClickMap?: Partial<import('../axis/types').ClickMap>
}
```

- [ ] **Step 2: Pass through new fields in the v2 Identity path**

In the `isIdentity(config)` branch of `composePattern`, add after the `visibilityFilters` spread (around line 114):

```ts
      ...(config.panelRole !== undefined && { panelRole: config.panelRole }),
      ...(config.panelVisibility !== undefined && { panelVisibility: config.panelVisibility }),
      ...(config.triggerKeyMap !== undefined && { triggerKeyMap: config.triggerKeyMap }),
      ...(config.triggerClickMap !== undefined && { triggerClickMap: config.triggerClickMap }),
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/interactive-os/pattern/composePattern.ts
git commit -m "feat: composePattern passes panelRole/panelVisibility/triggerKeyMap from Identity"
```

---

### Task 3: Aria.Panel — TDD

**Files:**
- Create: `src/interactive-os/__tests__/aria-panel.test.tsx`
- Modify: `src/interactive-os/primitives/aria.tsx`

- [ ] **Step 1: Write failing test — Panel renders with panelRole and visibility by selected**

```tsx
// V1: 2026-03-28-aria-panel-trigger-prd.md
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState, useMemo, useCallback } from 'react'
import { Aria } from '../primitives/aria'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { composePattern } from '../pattern/composePattern'
import { select } from '../axis/select'
import { navigate } from '../axis/navigate'

// Minimal tabs-like pattern for testing
const testTabs = composePattern(
  {
    role: 'tablist',
    childRole: 'tab',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-selected': String(state.selected),
    }),
    panelRole: 'tabpanel',
    panelVisibility: 'selected',
  },
  select({ mode: 'single', selectionFollowsFocus: true }),
  navigate({ orientation: 'horizontal' }),
)

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      tab1: { id: 'tab1', data: { label: 'Tab 1', content: 'Content 1' } },
      tab2: { id: 'tab2', data: { label: 'Tab 2', content: 'Content 2' } },
      tab3: { id: 'tab3', data: { label: 'Tab 3', content: 'Content 3' } },
    },
    relationships: { [ROOT_ID]: ['tab1', 'tab2', 'tab3'] },
  })
}

const renderTab = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, _state: NodeState) => (
  <div {...props}>{(node.data as Record<string, unknown>).label as string}</div>
)

const renderPanel = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, _state: NodeState) => (
  <div {...props}>{(node.data as Record<string, unknown>).content as string}</div>
)

function TestTabs() {
  const [store, setStore] = useState(fixtureData())
  const behavior = useMemo(() => testTabs, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])
  return (
    <Aria behavior={behavior} data={store} plugins={[]} onChange={onChange} aria-label="Test Tabs">
      <Aria.Item render={renderTab} />
      <Aria.Panel render={renderPanel} />
    </Aria>
  )
}

describe('Aria.Panel', () => {
  it('renders panels with correct role and only selected panel visible', () => {
    const { container } = render(<TestTabs />)

    // All 3 panels should exist
    const panels = container.querySelectorAll('[role="tabpanel"]')
    expect(panels.length).toBe(3)

    // Only first panel should be visible (tab1 is initially selected)
    const visiblePanels = Array.from(panels).filter(
      (p) => !p.hasAttribute('hidden')
    )
    expect(visiblePanels.length).toBe(1)
    expect(visiblePanels[0]!.textContent).toBe('Content 1')
  })

  it('generates aria-labelledby on panel and aria-controls on item', () => {
    const { container } = render(<TestTabs />)

    const tab1 = container.querySelector('[data-node-id="tab1"]')!
    const panels = container.querySelectorAll('[role="tabpanel"]')
    const panel1 = Array.from(panels).find(
      (p) => p.getAttribute('aria-labelledby') === 'tab1'
    )

    expect(panel1).toBeTruthy()
    expect(tab1.getAttribute('aria-controls')).toBe(`panel-tab1`)
    expect(panel1!.getAttribute('id')).toBe(`panel-tab1`)
  })

  it('switches visible panel when selection changes', async () => {
    const user = userEvent.setup()
    const { container } = render(<TestTabs />)

    // Focus tab1, then ArrowRight to tab2
    const tab1 = container.querySelector('[data-node-id="tab1"]') as HTMLElement
    tab1.focus()
    await user.keyboard('{ArrowRight}')

    const panels = container.querySelectorAll('[role="tabpanel"]')
    const visiblePanels = Array.from(panels).filter(
      (p) => !p.hasAttribute('hidden')
    )
    expect(visiblePanels.length).toBe(1)
    expect(visiblePanels[0]!.textContent).toBe('Content 2')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/interactive-os/__tests__/aria-panel.test.tsx`
Expected: FAIL (Aria.Panel doesn't exist yet)

- [ ] **Step 3: Implement AriaPanel in aria.tsx**

Add before the `AriaSearch` function:

```tsx
interface AriaPanelProps {
  render: (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState) => ReactElement
}

function AriaPanelNode({ childId, render, behavior }: { childId: string; render: AriaPanelProps['render']; behavior: AriaPattern }) {
  const aria = React.useContext(AriaInternalContext)
  if (!aria) return null
  const store = aria.getStore()
  const entity = store.entities[childId]
  if (!entity) return null

  const state = aria.getNodeState(childId)
  const panelId = `panel-${childId}`
  const isVisible = behavior.panelVisibility === 'selected' ? state.selected
    : behavior.panelVisibility === 'expanded' ? state.expanded
    : false

  const props: React.HTMLAttributes<HTMLElement> = {
    role: behavior.panelRole,
    id: panelId,
    'aria-labelledby': childId,
    ...(isVisible ? {} : { hidden: true }),
  }

  return cloneElement(
    render(props, entity, state) as React.ReactElement<Record<string, unknown>>,
    { key: panelId },
  )
}

function AriaPanel({ render }: AriaPanelProps) {
  return (
    <AriaInternalContext.Consumer>
      {(aria) => {
        if (!aria) throw new Error('<Aria.Panel> must be inside <Aria>')
        if (!aria.behavior?.panelRole) return null
        const store = aria.getStore()
        const children = getChildren(store, ROOT_ID)
        return (
          <>
            {children.map((childId) => (
              <AriaPanelNode key={childId} childId={childId} render={render} behavior={aria.behavior!} />
            ))}
          </>
        )
      }}
    </AriaInternalContext.Consumer>
  )
}
```

Also update `AriaItemNode` to inject `aria-controls` when `panelRole` is present. In `AriaItemNode`, after `const props = aria.getNodeProps(childId)`:

```tsx
  // Inject aria-controls for Panel cross-reference
  if (aria.behavior?.panelRole) {
    ;(props as Record<string, unknown>)['aria-controls'] = `panel-${childId}`
  }
```

Finally, update the Aria export (line 410):

```tsx
export const Aria = Object.assign(AriaRoot, { Item: AriaItem, Cell: AriaCell, Panel: AriaPanel, Editable: AriaEditable, Search: AriaSearch, SearchHighlight: AriaSearchHighlight })
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/interactive-os/__tests__/aria-panel.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/__tests__/aria-panel.test.tsx src/interactive-os/primitives/aria.tsx
git commit -m "feat: Aria.Panel — store-iterating panel renderer with visibility + ARIA cross-refs"
```

---

### Task 4: Aria.Panel — Accordion (expanded visibility)

**Files:**
- Modify: `src/interactive-os/__tests__/aria-panel.test.tsx`

- [ ] **Step 1: Write failing test — Panel with panelVisibility='expanded'**

Append to `aria-panel.test.tsx`:

```tsx
import { expand, EXPANDED_ID } from '../axis/expand'

const testAccordion = composePattern(
  {
    role: 'region',
    childRole: 'heading',
    ariaAttributes: (_node, state: NodeState) => {
      if (state.expanded !== undefined) return { 'aria-expanded': String(state.expanded) }
      return {}
    },
    panelRole: 'region',
    panelVisibility: 'expanded',
  },
  expand(),
  navigate({ orientation: 'vertical' }),
)

function accordionData(): NormalizedData {
  return createStore({
    entities: {
      h1: { id: 'h1', data: { label: 'Header 1', content: 'Region 1' } },
      h2: { id: 'h2', data: { label: 'Header 2', content: 'Region 2' } },
      [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: ['h1'] },
    },
    relationships: { [ROOT_ID]: ['h1', 'h2'] },
  })
}

const renderHeader = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, _state: NodeState) => (
  <div {...props}>{(node.data as Record<string, unknown>).label as string}</div>
)
const renderRegion = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, _state: NodeState) => (
  <div {...props}>{(node.data as Record<string, unknown>).content as string}</div>
)

function TestAccordion() {
  const [store, setStore] = useState(accordionData())
  const behavior = useMemo(() => testAccordion, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])
  return (
    <Aria behavior={behavior} data={store} plugins={[]} onChange={onChange} aria-label="Test Accordion">
      <Aria.Item render={renderHeader} />
      <Aria.Panel render={renderRegion} />
    </Aria>
  )
}

// V2: 2026-03-28-aria-panel-trigger-prd.md
describe('Aria.Panel (expanded visibility)', () => {
  it('only expanded items show their panel', () => {
    const { container } = render(<TestAccordion />)
    const panels = container.querySelectorAll('[role="region"]')
    // Note: the root also has role="region" from accordion pattern, filter by id
    const panelPanels = Array.from(panels).filter((p) => p.id.startsWith('panel-'))
    expect(panelPanels.length).toBe(2)

    const visible = panelPanels.filter((p) => !p.hasAttribute('hidden'))
    expect(visible.length).toBe(1)
    expect(visible[0]!.textContent).toBe('Region 1')
  })

  it('generates cross-references', () => {
    const { container } = render(<TestAccordion />)
    const h1 = container.querySelector('[data-node-id="h1"]')!
    expect(h1.getAttribute('aria-controls')).toBe('panel-h1')

    const panel1 = container.querySelector('#panel-h1')!
    expect(panel1.getAttribute('aria-labelledby')).toBe('h1')
  })
})
```

- [ ] **Step 2: Run test to verify it passes** (Panel already handles expanded)

Run: `pnpm test -- src/interactive-os/__tests__/aria-panel.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/__tests__/aria-panel.test.tsx
git commit -m "test: Aria.Panel accordion (expanded visibility) conformance"
```

---

### Task 5: Aria.Trigger — TDD

**Files:**
- Create: `src/interactive-os/__tests__/aria-trigger.test.tsx`
- Modify: `src/interactive-os/primitives/aria.tsx`

- [ ] **Step 1: Write failing test — Trigger renders with ARIA attrs and responds to triggerKeyMap**

```tsx
// V3: 2026-03-28-aria-panel-trigger-prd.md
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState, useMemo, useCallback } from 'react'
import { Aria } from '../primitives/aria'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { composePattern } from '../pattern/composePattern'
import { popup, POPUP_ID } from '../axis/popup'
import { navigate } from '../axis/navigate'

const pop = popup({ type: 'menu' })
const nav = navigate({ orientation: 'vertical', wrap: true })

const testMenuButton = composePattern(
  {
    role: 'menu',
    childRole: 'menuitem',
    ariaAttributes: () => ({}),
    triggerKeyMap: {
      Enter: pop.handlers.opensPopup,
      ' ': pop.handlers.opensPopup,
      ArrowDown: pop.handlers.opensPopup,
    },
    triggerClickMap: {
      none: (_ctx, _nodeId) => {
        // toggle: handled by Trigger internally via popup ctx
        return undefined
      },
    },
  },
  pop,
  nav,
)

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      trigger: { id: 'trigger', data: { label: 'Actions' } },
      cut: { id: 'cut', data: { label: 'Cut' } },
      copy: { id: 'copy', data: { label: 'Copy' } },
    },
    relationships: {
      [ROOT_ID]: ['trigger'],
      trigger: ['cut', 'copy'],
    },
  })
}

const renderTrigger = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, _state: NodeState) => (
  <button {...props}>{(node.data as Record<string, unknown>).label as string}</button>
)
const renderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, _state: NodeState) => (
  <div {...props}>{(node.data as Record<string, unknown>).label as string}</div>
)

function TestMenuButton() {
  const [store, setStore] = useState(fixtureData())
  const behavior = useMemo(() => testMenuButton, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])
  return (
    <Aria behavior={behavior} data={store} plugins={[]} onChange={onChange} aria-label="Actions">
      <Aria.Trigger render={renderTrigger} />
      <Aria.Item render={renderItem} />
    </Aria>
  )
}

describe('Aria.Trigger', () => {
  it('renders trigger with aria-haspopup and aria-expanded', () => {
    const { container } = render(<TestMenuButton />)
    const trigger = container.querySelector('button')!
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('Enter opens popup and moves focus to first item', async () => {
    const user = userEvent.setup()
    const { container } = render(<TestMenuButton />)
    const trigger = container.querySelector('button') as HTMLElement
    trigger.focus()
    await user.keyboard('{Enter}')

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    // First menuitem should be focused
    const cut = container.querySelector('[data-node-id="cut"]') as HTMLElement
    expect(document.activeElement).toBe(cut)
  })

  // V4: 2026-03-28-aria-panel-trigger-prd.md
  it('Escape in popup closes and returns focus to trigger', async () => {
    const user = userEvent.setup()
    const { container } = render(<TestMenuButton />)
    const trigger = container.querySelector('button') as HTMLElement
    trigger.focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{Escape}')

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/interactive-os/__tests__/aria-trigger.test.tsx`
Expected: FAIL (Aria.Trigger doesn't exist)

- [ ] **Step 3: Implement AriaTrigger in aria.tsx**

Add before `AriaPanel`:

```tsx
interface AriaTriggerProps {
  render: (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState) => ReactElement
}

function AriaTrigger({ render }: AriaTriggerProps) {
  const aria = React.useContext(AriaInternalContext)
  if (!aria) throw new Error('<Aria.Trigger> must be inside <Aria>')
  const store = aria.getStore()
  const behavior = aria.behavior

  // Trigger is the first root-level node that has children (popup target)
  const rootChildren = getChildren(store, ROOT_ID)
  const triggerId = rootChildren.find((id) => getChildren(store, id).length > 0)
  if (!triggerId) return null

  const entity = store.entities[triggerId]
  if (!entity) return null

  const state = aria.getNodeState(triggerId)
  const popupType = behavior?.popupType
  const isOpen = state.open ?? false

  const props: React.HTMLAttributes<HTMLElement> = {
    'data-node-id': triggerId,
    tabIndex: 0,
    ...(popupType && { 'aria-haspopup': popupType }),
    'aria-expanded': String(isOpen),
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.defaultPrevented) return
      const triggerKeyMap = behavior?.triggerKeyMap
      if (!triggerKeyMap) return

      const key = event.key === ' ' ? ' ' : event.key
      const handler = triggerKeyMap[key]
      if (!handler) return

      event.preventDefault()
      event.stopPropagation()

      const { composeCtx } = require('../pattern/createPatternContext')
      const ctx = behavior.axes?.length
        ? composeCtx(aria.engine, behavior.axes)
        : require('../pattern/createPatternContext').createPatternContext(aria.engine, {})
      const command = handler(ctx)
      if (command) aria.dispatch(command)
    },
    onClick: (event: React.MouseEvent) => {
      if (event.defaultPrevented) return
      event.stopPropagation()

      const { composeCtx } = require('../pattern/createPatternContext')
      const ctx = behavior?.axes?.length
        ? composeCtx(aria.engine, behavior.axes)
        : require('../pattern/createPatternContext').createPatternContext(aria.engine, {})

      // Toggle: if open, close; if closed, open
      if (isOpen) {
        const command = ctx.close()
        if (command) aria.dispatch(command)
      } else {
        const command = ctx.open()
        if (command) aria.dispatch(command)
      }
    },
    onFocus: () => {
      const { focusCommands } = require('../axis/navigate')
      if (triggerId !== store.entities['__focus__']?.focusedId) {
        aria.dispatch(focusCommands.setFocus(triggerId))
      }
    },
  }

  return cloneElement(
    render(props, entity, state) as React.ReactElement<Record<string, unknown>>,
    { key: `trigger-${triggerId}` },
  )
}
```

Update the Aria export:

```tsx
export const Aria = Object.assign(AriaRoot, {
  Item: AriaItem, Cell: AriaCell, Panel: AriaPanel, Trigger: AriaTrigger,
  Editable: AriaEditable, Search: AriaSearch, SearchHighlight: AriaSearchHighlight,
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/interactive-os/__tests__/aria-trigger.test.tsx`
Expected: PASS

- [ ] **Step 5: Run full test suite to check no regressions**

Run: `pnpm test`
Expected: PASS (existing tests unchanged)

- [ ] **Step 6: Commit**

```bash
git add src/interactive-os/__tests__/aria-trigger.test.tsx src/interactive-os/primitives/aria.tsx
git commit -m "feat: Aria.Trigger — popup entry point with triggerKeyMap from composePattern"
```

---

### Task 6: Trigger edge cases — bubbling + backward compat

**Files:**
- Modify: `src/interactive-os/__tests__/aria-trigger.test.tsx`

- [ ] **Step 1: Write test — Trigger keys don't bubble to parent Aria**

```tsx
// V8: 2026-03-28-aria-panel-trigger-prd.md
it('trigger key events do not bubble to Aria container keyMap', async () => {
  const user = userEvent.setup()
  const { container } = render(<TestMenuButton />)
  const trigger = container.querySelector('button') as HTMLElement
  trigger.focus()

  // Space on trigger should open popup, NOT bubble to container
  await user.keyboard(' ')
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
})
```

- [ ] **Step 2: Write test — backward compat: popup pattern without Trigger works**

```tsx
// V6: 2026-03-28-aria-panel-trigger-prd.md
import { useAria } from '../primitives/useAria'
import { menuButton as originalMenuButton } from '../pattern/roles/menuButton'

function LegacyMenuButton({ data }: { data: NormalizedData }) {
  const aria = useAria({ data, behavior: originalMenuButton })
  return (
    <div {...aria.containerProps} data-aria-container="">
      <div {...aria.getNodeProps('trigger')} data-testid="legacy-trigger">Actions</div>
    </div>
  )
}

describe('backward compatibility', () => {
  it('popup pattern works without Aria.Trigger', () => {
    const data = createStore({
      entities: { trigger: { id: 'trigger', data: { label: 'Actions' } } },
      relationships: { [ROOT_ID]: ['trigger'] },
    })
    const { getByTestId } = render(<LegacyMenuButton data={data} />)
    expect(getByTestId('legacy-trigger')).toBeTruthy()
  })
})
```

- [ ] **Step 3: Run tests**

Run: `pnpm test -- src/interactive-os/__tests__/aria-trigger.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/interactive-os/__tests__/aria-trigger.test.tsx
git commit -m "test: Trigger bubbling guard + backward compat without Trigger"
```

---

### Task 7: Pattern updates — tabs, accordion, menuButton

**Files:**
- Modify: `src/interactive-os/pattern/roles/tabs.ts`
- Modify: `src/interactive-os/pattern/roles/accordion.ts`
- Modify: `src/interactive-os/pattern/roles/menuButton.ts`

- [ ] **Step 1: Add panelRole/panelVisibility to tabs**

```ts
// src/interactive-os/pattern/roles/tabs.ts
export const tabs = composePattern(
  {
    role: 'tablist',
    childRole: 'tab',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-selected': String(state.selected),
    }),
    panelRole: 'tabpanel',
    panelVisibility: 'selected',
  },
  select({ mode: 'single', selectionFollowsFocus: true }),
  activate({ onClick: true, activationFollowsSelection: true }),
  navigate({ orientation: 'horizontal' }),
)
```

- [ ] **Step 2: Add panelRole/panelVisibility to accordion**

```ts
// src/interactive-os/pattern/roles/accordion.ts
export const accordion = composePattern(
  {
    role: 'region',
    childRole: 'heading',
    ariaAttributes: (_node, state: NodeState) => {
      const attrs: Record<string, string> = {}
      if (state.expanded !== undefined) {
        attrs['aria-expanded'] = String(state.expanded)
      }
      return attrs
    },
    panelRole: 'region',
    panelVisibility: 'expanded',
  },
  activate({ onClick: true, toggleExpand: true }),
  navigate({ orientation: 'vertical' }),
)
```

- [ ] **Step 3: Add triggerKeyMap to menuButton**

```ts
// src/interactive-os/pattern/roles/menuButton.ts
import { popup } from '../../axis/popup'
import { navigate } from '../../axis/navigate'
import { activate } from '../../axis/activate'

const pop = popup({ type: 'menu' })
const nav = navigate({ orientation: 'vertical', wrap: true })

export const menuButton = composePattern(
  {
    role: 'menu',
    childRole: 'menuitem',
    ariaAttributes: () => ({}),
    triggerKeyMap: {
      Enter: pop.handlers.opensPopup,
      ' ': pop.handlers.opensPopup,
      ArrowDown: pop.handlers.opensPopup,
    },
  },
  pop,
  nav,
  activate({ onClick: true }),
)
```

- [ ] **Step 4: Run typecheck + tests**

Run: `pnpm typecheck && pnpm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/pattern/roles/tabs.ts src/interactive-os/pattern/roles/accordion.ts src/interactive-os/pattern/roles/menuButton.ts
git commit -m "feat: tabs/accordion/menuButton patterns declare panelRole/triggerKeyMap"
```

---

### Task 8: Example updates — TabsAutomatic, Accordion, MenuActions

**Files:**
- Modify: `src/interactive-os/pattern/examples/TabsAutomatic.tsx`
- Modify: `src/interactive-os/pattern/examples/Accordion.tsx`
- Modify: `src/interactive-os/pattern/examples/MenuActions.tsx`

- [ ] **Step 1: Update TabsAutomatic to use Aria.Panel**

```tsx
// src/interactive-os/pattern/examples/TabsAutomatic.tsx
import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { tabs } from '../../pattern/roles/tabs'
import styles from './tabs.module.css'

const items = [
  { id: 'nils-frahm', label: 'Nils Frahm', content: 'Nils Frahm is a German musician, composer and record producer based in Berlin.' },
  { id: 'agnes-obel', label: 'Agnes Obel', content: 'Agnes Caroline Thaarup Obel is a Danish singer/songwriter.' },
  { id: 'joke', label: 'Joke', content: 'Fear before you: knock knock. Who is there? Centipede. Centipede who? You can\'t centipede on a goldfish.' },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    items.map(item => [item.id, { id: item.id, data: { label: item.label, content: item.content } }]),
  ),
  relationships: { [ROOT_ID]: items.map(item => item.id) },
})

const renderTab = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div
      {...props}
      className={styles.tab}
      data-focused={state.focused || undefined}
      data-selected={state.selected || undefined}
    >
      {label}
    </div>
  )
}

const renderPanel = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  _state: NodeState,
): React.ReactElement => {
  const content = (node.data as Record<string, unknown>)?.content as string
  return (
    <div {...props} className={styles.panel}>
      <p>{content}</p>
    </div>
  )
}

export function TabsAutomatic() {
  const [store, setStore] = useState<NormalizedData>(data)
  const behavior = useMemo(() => tabs, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      behavior={behavior}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Entertainment"
    >
      <Aria.Item render={renderTab} />
      <Aria.Panel render={renderPanel} />
    </Aria>
  )
}
```

- [ ] **Step 2: Update Accordion to use Aria.Panel**

```tsx
// src/interactive-os/pattern/examples/Accordion.tsx
import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { accordion } from '../../pattern/roles/accordion'
import { EXPANDED_ID } from '../../axis/expand'
import styles from './accordion.module.css'

const sections = [
  { id: 'personal-information', label: 'Personal Information', content: 'Provide your name, email, phone number, and any other personal details required for identification.' },
  { id: 'billing-address', label: 'Billing Address', content: 'Enter the address associated with your payment method including street address, city, state, and zip code.' },
  { id: 'shipping-address', label: 'Shipping Address', content: 'Provide the address where you would like your order delivered. This may differ from your billing address.' },
]

const data: NormalizedData = createStore({
  entities: {
    ...Object.fromEntries(
      sections.map(s => [s.id, { id: s.id, data: { label: s.label, content: s.content } }]),
    ),
    [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: ['personal-information'] },
  },
  relationships: {
    [ROOT_ID]: sections.map(s => s.id),
  },
})

const renderHeader = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div
      {...props}
      className={styles.header}
      data-focused={state.focused || undefined}
    >
      <span>{label}</span>
      <span className={styles.indicator} aria-hidden="true">
        {state.expanded ? '\u25B2' : '\u25BC'}
      </span>
    </div>
  )
}

const renderRegion = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  _state: NodeState,
): React.ReactElement => {
  const content = (node.data as Record<string, unknown>)?.content as string
  return (
    <div {...props} className={styles.panel}>
      {content}
    </div>
  )
}

export function Accordion() {
  const [store, setStore] = useState<NormalizedData>(data)
  const behavior = useMemo(() => accordion, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      behavior={behavior}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Accordion Example"
    >
      <Aria.Item render={renderHeader} />
      <Aria.Panel render={renderRegion} />
    </Aria>
  )
}
```

- [ ] **Step 3: Update MenuActions to use Aria.Trigger**

```tsx
// src/interactive-os/pattern/examples/MenuActions.tsx
import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { menuButton } from '../../pattern/roles/menuButton'
import styles from './menu.module.css'

const items = [
  { id: 'actions', label: 'Actions', children: ['cut', 'copy', 'paste', 'select-all'] },
  { id: 'cut', label: 'Cut' },
  { id: 'copy', label: 'Copy' },
  { id: 'paste', label: 'Paste' },
  { id: 'select-all', label: 'Select All' },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    items.map(item => [item.id, { id: item.id, data: { label: item.label } }]),
  ),
  relationships: {
    [ROOT_ID]: ['actions'],
    actions: ['cut', 'copy', 'paste', 'select-all'],
  },
})

const renderTrigger = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  _state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <button {...props} className={styles.trigger}>
      {label} ▾
    </button>
  )
}

const renderItem = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div
      {...props}
      className={styles.menuitem}
      data-focused={state.focused || undefined}
    >
      {label}
    </div>
  )
}

export function MenuActions() {
  const [store, setStore] = useState<NormalizedData>(data)
  const behavior = useMemo(() => menuButton, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      behavior={behavior}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Actions"
    >
      <Aria.Trigger render={renderTrigger} />
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
```

- [ ] **Step 4: Run full test suite**

Run: `pnpm typecheck && pnpm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/pattern/examples/TabsAutomatic.tsx src/interactive-os/pattern/examples/Accordion.tsx src/interactive-os/pattern/examples/MenuActions.tsx
git commit -m "feat: update Tabs/Accordion/MenuActions examples to use Aria.Panel/Trigger"
```

---

### Task 9: Backward compat test — listbox without Panel

**Files:**
- Modify: `src/interactive-os/__tests__/aria-panel.test.tsx`

- [ ] **Step 1: Write test — V5: listbox with no Panel works unchanged**

```tsx
// V5: 2026-03-28-aria-panel-trigger-prd.md
import { listbox } from '../pattern/roles/listbox'

describe('backward compatibility', () => {
  it('listbox pattern without Panel works unchanged', () => {
    const data = createStore({
      entities: {
        a: { id: 'a', data: { label: 'A' } },
        b: { id: 'b', data: { label: 'B' } },
      },
      relationships: { [ROOT_ID]: ['a', 'b'] },
    })

    function TestListbox() {
      const [store, setStore] = useState(data)
      const behavior = useMemo(() => listbox(), [])
      const onChange = useCallback((next: NormalizedData) => setStore(next), [])
      return (
        <Aria behavior={behavior} data={store} plugins={[]} onChange={onChange} aria-label="Test">
          <Aria.Item render={(props, node) => <div {...props}>{(node.data as Record<string, unknown>).label as string}</div>} />
        </Aria>
      )
    }

    const { container } = render(<TestListbox />)
    expect(container.querySelectorAll('[role="option"]').length).toBe(2)
    // No panels, no errors
    expect(container.querySelectorAll('[role="tabpanel"]').length).toBe(0)
  })
})
```

- [ ] **Step 2: Run test**

Run: `pnpm test -- src/interactive-os/__tests__/aria-panel.test.tsx`
Expected: PASS

- [ ] **Step 3: Run full suite one final time**

Run: `pnpm test`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add src/interactive-os/__tests__/aria-panel.test.tsx
git commit -m "test: backward compat — listbox without Panel works unchanged"
```
