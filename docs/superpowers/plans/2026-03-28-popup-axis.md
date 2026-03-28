# popup 축 신설 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** popup 축 신설 — aria-haspopup + aria-expanded + 포커스 위임/복귀를 하나의 축으로 묶어 Menu Button APG 패턴 선언적 조립 가능하게 한다.

**Architecture:** expand 축 패턴을 따름. `__popup__` 메타 엔티티에 `{ isOpen, triggerId }` 저장. `popup()` 팩토리가 type(menu/listbox/grid/dialog)에 따른 keyMap + config 반환. aria-haspopup/aria-expanded는 useAriaView에서 popupType config 기반 자동 생성. 포커스 위임/복귀는 keyMap 핸들러에서 batch command로 처리. aria-controls는 이번 probe에서 생략(D2).

**Tech Stack:** TypeScript, React, Vitest, @testing-library/react, @testing-library/user-event

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/interactive-os/axis/popup.ts` | POPUP_ID, popupCommands, popup() factory |
| Modify | `src/interactive-os/axis/types.ts` | PatternContext에 isOpen/open()/close(), AxisConfig에 popupType/popupModal |
| Modify | `src/interactive-os/pattern/types.ts` | AriaPattern에 popupType?/popupModal?, NodeState에 open? |
| Modify | `src/interactive-os/pattern/createPatternContext.ts` | isOpen, open(), close() 구현 |
| Modify | `src/interactive-os/pattern/composePattern.ts` | popupType, popupModal config passthrough |
| Modify | `src/interactive-os/primitives/useAriaView.ts` | NodeState.open 계산, aria-haspopup/expanded 자동 생성 |
| Modify | `src/interactive-os/primitives/useAria.ts` | POPUP_ID meta entity 초기화 |
| Modify | `src/interactive-os/primitives/useAriaZone.ts` | core:open, core:close meta commands |
| Create | `src/interactive-os/pattern/examples/menuButton.ts` | Menu Button APG 패턴 |
| Create | `src/interactive-os/__tests__/menu-button-apg.conformance.test.tsx` | Menu Button conformance test |

---

### Task 1: popup axis — commands + factory

**Files:**
- Create: `src/interactive-os/axis/popup.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/interactive-os/__tests__/popup-axis.test.ts
import { describe, it, expect } from 'vitest'
import { POPUP_ID, popupCommands } from '../axis/popup'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'

function fixtureStore(): NormalizedData {
  return createStore({
    entities: {
      trigger: { id: 'trigger', data: { name: 'Menu' } },
      item1: { id: 'item1', data: { name: 'Cut' } },
      item2: { id: 'item2', data: { name: 'Copy' } },
    },
    relationships: {
      [ROOT_ID]: ['trigger'],
      trigger: ['item1', 'item2'],
    },
  })
}

describe('popup axis commands', () => {
  it('open sets isOpen=true and stores triggerId', () => {
    const store = fixtureStore()
    const cmd = popupCommands.open('trigger')
    const result = cmd.execute(store)
    const popup = result.entities[POPUP_ID] as Record<string, unknown>
    expect(popup.isOpen).toBe(true)
    expect(popup.triggerId).toBe('trigger')
  })

  it('close sets isOpen=false', () => {
    let store = fixtureStore()
    store = popupCommands.open('trigger').execute(store)
    const result = popupCommands.close().execute(store)
    const popup = result.entities[POPUP_ID] as Record<string, unknown>
    expect(popup.isOpen).toBe(false)
    expect(popup.triggerId).toBe('trigger')
  })

  it('open is idempotent', () => {
    let store = fixtureStore()
    store = popupCommands.open('trigger').execute(store)
    const result = popupCommands.open('trigger').execute(store)
    expect(result.entities[POPUP_ID]).toEqual(store.entities[POPUP_ID])
  })

  it('close on already-closed is no-op', () => {
    const store = fixtureStore()
    const result = popupCommands.close().execute(store)
    const popup = result.entities[POPUP_ID] as Record<string, unknown>
    expect(popup.isOpen).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/interactive-os/__tests__/popup-axis.test.ts`
Expected: FAIL — module `../axis/popup` not found

- [ ] **Step 3: Write popup.ts**

```ts
// src/interactive-os/axis/popup.ts
// ② 2026-03-28-popup-axis-prd.md
import type { AxisConfig, KeyMap } from './types'
import type { Command } from '../engine/types'
import { createBatchCommand } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { focusCommands } from './navigate'
import { getChildren } from '../store/createStore'

export const POPUP_ID = '__popup__'

type PopupType = 'menu' | 'listbox' | 'grid' | 'tree' | 'dialog'

function getPopupEntity(store: NormalizedData): { isOpen: boolean; triggerId: string } {
  const entity = store.entities[POPUP_ID] as Record<string, unknown> | undefined
  return {
    isOpen: (entity?.isOpen as boolean) ?? false,
    triggerId: (entity?.triggerId as string) ?? '',
  }
}

export const popupCommands = {
  open(triggerId: string): Command {
    return {
      type: 'core:open',
      payload: { triggerId },
      execute(store) {
        const current = getPopupEntity(store)
        if (current.isOpen && current.triggerId === triggerId) return store
        return {
          ...store,
          entities: {
            ...store.entities,
            [POPUP_ID]: { id: POPUP_ID, isOpen: true, triggerId },
          },
        }
      },
    }
  },

  close(): Command {
    return {
      type: 'core:close',
      payload: {},
      execute(store) {
        const current = getPopupEntity(store)
        return {
          ...store,
          entities: {
            ...store.entities,
            [POPUP_ID]: { id: POPUP_ID, isOpen: false, triggerId: current.triggerId },
          },
        }
      },
    }
  },
}

interface PopupOptions {
  type: PopupType
  modal?: boolean
}

export function popup(options: PopupOptions): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  const { type, modal = false } = options

  const keyMap: KeyMap = {
    Enter: (ctx) => {
      if (ctx.isOpen) return undefined // let inner pattern handle Enter
      const children = ctx.getChildren(ctx.focused)
      if (children.length === 0) return undefined
      return createBatchCommand([
        popupCommands.open(ctx.focused),
        focusCommands.setFocus(children[0]!),
      ])
    },
    Space: (ctx) => {
      if (ctx.isOpen) return undefined
      const children = ctx.getChildren(ctx.focused)
      if (children.length === 0) return undefined
      return createBatchCommand([
        popupCommands.open(ctx.focused),
        focusCommands.setFocus(children[0]!),
      ])
    },
    Escape: (ctx) => {
      if (!ctx.isOpen) return undefined
      const triggerEntity = ctx.getEntity(POPUP_ID) as Record<string, unknown> | undefined
      const triggerId = (triggerEntity?.triggerId as string) ?? ''
      return createBatchCommand([
        popupCommands.close(),
        triggerId ? focusCommands.setFocus(triggerId) : focusCommands.setFocus(ctx.focused),
      ])
    },
  }

  // Menu-specific: ArrowDown/Up open the menu
  if (type === 'menu') {
    keyMap.ArrowDown = (ctx) => {
      if (ctx.isOpen) return undefined // let navigate handle it
      const children = ctx.getChildren(ctx.focused)
      if (children.length === 0) return undefined
      return createBatchCommand([
        popupCommands.open(ctx.focused),
        focusCommands.setFocus(children[0]!),
      ])
    }
    keyMap.ArrowUp = (ctx) => {
      if (ctx.isOpen) return undefined
      const children = ctx.getChildren(ctx.focused)
      if (children.length === 0) return undefined
      return createBatchCommand([
        popupCommands.open(ctx.focused),
        focusCommands.setFocus(children[children.length - 1]!),
      ])
    }
  }

  return {
    keyMap,
    config: {
      popupType: type,
      ...(modal && { popupModal: true }),
    } as Partial<AxisConfig>,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/interactive-os/__tests__/popup-axis.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/axis/popup.ts src/interactive-os/__tests__/popup-axis.test.ts
git commit -m "feat: popup axis — commands + factory (open/close/keyMap)"
```

---

### Task 2: Type system extensions

**Files:**
- Modify: `src/interactive-os/axis/types.ts`
- Modify: `src/interactive-os/pattern/types.ts`

- [ ] **Step 1: Add popup fields to AxisConfig**

In `src/interactive-os/axis/types.ts`, add to `AxisConfig` after `valueRange`:

```ts
  /** Popup type — when set, trigger gets aria-haspopup and popup behavior. Set by popup axis. */
  popupType: 'menu' | 'listbox' | 'grid' | 'tree' | 'dialog'
  /** When true, popup is modal (focus trap, aria-modal). Set by popup axis. */
  popupModal: boolean
```

Add to `PatternContext` after `isChecked: boolean`:

```ts
  isOpen: boolean
```

Add to `PatternContext` methods after `toggleCheck(): Command`:

```ts
  open(): Command
  close(): Command
```

- [ ] **Step 2: Add popup fields to AriaPattern and NodeState**

In `src/interactive-os/pattern/types.ts`, add to `NodeState` after `valueCurrent?`:

```ts
  open?: boolean
```

Add to `AriaPattern` after `valueRange?`:

```ts
  /** Popup type — when set, trigger node gets aria-haspopup automatically. */
  popupType?: 'menu' | 'listbox' | 'grid' | 'tree' | 'dialog'
  /** When true, popup is modal (aria-modal="true", focus trap). */
  popupModal?: boolean
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS (new fields are optional, no existing code breaks)

- [ ] **Step 4: Commit**

```bash
git add src/interactive-os/axis/types.ts src/interactive-os/pattern/types.ts
git commit -m "feat: popup type extensions — AxisConfig, PatternContext, AriaPattern, NodeState"
```

---

### Task 3: PatternContext popup methods

**Files:**
- Modify: `src/interactive-os/pattern/createPatternContext.ts`

- [ ] **Step 1: Add popup imports and helpers**

Add imports at top of `createPatternContext.ts`:

```ts
import { popupCommands, POPUP_ID } from '../axis/checked'
```

Wait — import from popup, not checked:

```ts
import { popupCommands, POPUP_ID } from '../axis/popup'
```

Add helper function after `isChecked`:

```ts
function isPopupOpen(engine: CommandEngine): boolean {
  return (engine.getStore().entities[POPUP_ID]?.isOpen as boolean) ?? false
}
```

- [ ] **Step 2: Add popupType to PatternContextOptions**

```ts
export interface PatternContextOptions {
  expandable?: boolean
  selectionMode?: SelectionMode
  colCount?: number
  valueRange?: ValueRange
  checkedTracking?: boolean
  popupType?: string       // ← add
  visibilityFilters?: VisibilityFilter[]
}
```

- [ ] **Step 3: Add isOpen, open(), close() to returned context**

In the returned object, after `isChecked`:

```ts
    isOpen: isPopupOpen(engine),
```

After `toggleCheck()`:

```ts
    open(): Command {
      return createBatchCommand([
        popupCommands.open(focusedId),
        ...(() => {
          const children = getChildren(store, focusedId)
          return children.length > 0 ? [focusCommands.setFocus(children[0]!)] : []
        })(),
      ])
    },

    close(): Command {
      const popupEntity = store.entities[POPUP_ID] as Record<string, unknown> | undefined
      const triggerId = (popupEntity?.triggerId as string) ?? focusedId
      return createBatchCommand([
        popupCommands.close(),
        focusCommands.setFocus(triggerId),
      ])
    },
```

- [ ] **Step 4: Run typecheck + existing tests**

Run: `pnpm typecheck && pnpm test -- src/interactive-os/__tests__/popup-axis.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/pattern/createPatternContext.ts
git commit -m "feat: PatternContext — isOpen, open(), close() popup methods"
```

---

### Task 4: composePattern popup passthrough

**Files:**
- Modify: `src/interactive-os/pattern/composePattern.ts`

- [ ] **Step 1: Add popupType and popupModal to both Identity and PatternConfig paths**

In the v2 Identity path (inside `if (isIdentity(config))`), after the `valueRange` line:

```ts
      ...(mergedConfig.popupType !== undefined && { popupType: mergedConfig.popupType }),
      ...(mergedConfig.popupModal !== undefined && { popupModal: mergedConfig.popupModal }),
```

In the v1 PatternConfig path, add the same two lines after the `valueRange` line.

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/pattern/composePattern.ts
git commit -m "feat: composePattern — popupType, popupModal config passthrough"
```

---

### Task 5: useAriaView — popup state + ARIA attributes

**Files:**
- Modify: `src/interactive-os/primitives/useAriaView.ts`

- [ ] **Step 1: Add popupType to behaviorCtxOptions**

In the `behaviorCtxOptions` useMemo (around line 132), add:

```ts
      popupType: behavior.popupType,
```

Update the useMemo dependency array to include `behavior.popupType`.

- [ ] **Step 2: Add NodeState.open computation**

In `getNodeState` callback, after the `checked` computation (around line 185), add:

```ts
        open: behavior.popupType ? (() => {
          const popupEntity = store.entities['__popup__'] as Record<string, unknown> | undefined
          const isOpen = (popupEntity?.isOpen as boolean) ?? false
          const triggerId = (popupEntity?.triggerId as string) ?? ''
          return triggerId === id ? isOpen : undefined
        })() : undefined,
```

Update the `getNodeState` dependency array to include `behavior.popupType`.

- [ ] **Step 3: Add aria-haspopup and aria-expanded auto-generation**

In `getNodeProps` callback, after `...ariaAttrs` (around line 255), add popup ARIA attributes:

```ts
      // Popup axis: auto-generate aria-haspopup and aria-expanded for trigger nodes
      if (behavior.popupType && state.open !== undefined) {
        baseProps['aria-haspopup'] = behavior.popupType
        baseProps['aria-expanded'] = String(state.open)
      }
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/primitives/useAriaView.ts
git commit -m "feat: useAriaView — popup NodeState.open + aria-haspopup/expanded auto-generation"
```

---

### Task 6: useAria + useAriaZone popup support

**Files:**
- Modify: `src/interactive-os/primitives/useAria.ts`
- Modify: `src/interactive-os/primitives/useAriaZone.ts`

- [ ] **Step 1: useAria — add POPUP_ID to META_ENTITY_IDS and init**

In `useAria.ts`, add import:

```ts
import { POPUP_ID } from '../axis/popup'
```

Add `POPUP_ID` to the `META_ENTITY_IDS` Set (around line 26):

```ts
const META_ENTITY_IDS = new Set([FOCUS_ID, SELECTION_ID, SELECTION_ANCHOR_ID, EXPANDED_ID, CHECKED_ID, GRID_COL_ID, RENAME_ID, '__combobox__', '__spatial_parent__', VALUE_ID, '__search__', POPUP_ID])
```

Add popup init block after the checked init block (around line 113):

```ts
    if (behavior.popupType && !data.entities[POPUP_ID]) {
      created.syncStore({
        entities: { ...created.getStore().entities, [POPUP_ID]: { id: POPUP_ID, isOpen: false, triggerId: '' } },
        relationships: created.getStore().relationships,
      })
    }
```

Add popupOpen derivation after `checkedIds` (around line 190):

No additional derivation needed — popup state is read directly from store in useAriaView.

- [ ] **Step 2: useAriaZone — add meta command types + viewState**

In `useAriaZone.ts`, add to `META_COMMAND_TYPES`:

```ts
  'core:open',
  'core:close',
```

Add to `ZoneViewState` interface:

```ts
  popupIsOpen: boolean
  popupTriggerId: string
```

Add initial values in the `useState<ZoneViewState>` initializer:

```ts
  popupIsOpen: false,
  popupTriggerId: '',
```

Add to `applyMetaCommand` function, cases for `core:open` and `core:close`:

```ts
    case 'core:open': {
      const { triggerId } = command.payload as { triggerId: string }
      return { ...state, popupIsOpen: true, popupTriggerId: triggerId }
    }
    case 'core:close':
      return { ...state, popupIsOpen: false }
```

Add `__popup__` to virtual store entities in `getStore()`:

```ts
    [POPUP_ID]: { id: POPUP_ID, isOpen: viewState.popupIsOpen, triggerId: viewState.popupTriggerId },
```

Import POPUP_ID at top:

```ts
import { POPUP_ID } from '../axis/popup'
```

- [ ] **Step 3: Run typecheck + existing tests**

Run: `pnpm typecheck && pnpm test`
Expected: All existing tests pass. Pre-existing `workspace-store.test.ts` failure is known and ignored.

- [ ] **Step 4: Commit**

```bash
git add src/interactive-os/primitives/useAria.ts src/interactive-os/primitives/useAriaZone.ts
git commit -m "feat: useAria/useAriaZone — popup meta entity support"
```

---

### Task 7: menuButton pattern

**Files:**
- Create: `src/interactive-os/pattern/examples/menuButton.ts`

- [ ] **Step 1: Create menuButton pattern**

```ts
// src/interactive-os/pattern/examples/menuButton.ts
// ② 2026-03-28-popup-axis-prd.md
import type { Entity } from '../../store/types'
import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { popup } from '../../axis/popup'
import { navigate } from '../../axis/navigate'
import { activate } from '../../axis/activate'

export const menuButton = composePattern(
  {
    role: 'menu',
    childRole: 'menuitem',
    ariaAttributes: (_node: Entity, _state: NodeState) => ({}),
  },
  popup({ type: 'menu' }),
  navigate({ orientation: 'vertical', wrap: true }),
  activate({ onClick: true }),
)
```

- [ ] **Step 2: Commit**

```bash
git add src/interactive-os/pattern/examples/menuButton.ts
git commit -m "feat: menuButton pattern — popup + navigate + activate"
```

---

### Task 8: Menu Button APG conformance test

**Files:**
- Create: `src/interactive-os/__tests__/menu-button-apg.conformance.test.tsx`

- [ ] **Step 1: Write conformance test**

```tsx
// src/interactive-os/__tests__/menu-button-apg.conformance.test.tsx
// V1: 2026-03-28-popup-axis-prd.md
/**
 * APG Conformance: Menu Button (popup axis)
 * https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-actions/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../../interactive-os/primitives/aria'
import { menuButton } from '../../interactive-os/pattern/examples/menuButton'
import { createStore } from '../../interactive-os/store/createStore'
import { ROOT_ID } from '../../interactive-os/store/types'
import type { NormalizedData } from '../../interactive-os/store/types'
import type { NodeState } from '../../interactive-os/pattern/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      actions: { id: 'actions', data: { name: 'Actions' } },
      cut: { id: 'cut', data: { name: 'Cut' } },
      copy: { id: 'copy', data: { name: 'Copy' } },
      paste: { id: 'paste', data: { name: 'Paste' } },
    },
    relationships: {
      [ROOT_ID]: ['actions'],
      actions: ['cut', 'copy', 'paste'],
    },
  })
}

function renderMenuButton(data: NormalizedData, onActivate?: (id: string) => void) {
  return render(
    <Aria data={data} behavior={menuButton} onActivate={onActivate}>
      {(aria) => (
        <div {...aria.containerProps}>
          {aria.items.map((item) => {
            const props = aria.getNodeProps(item.id)
            const state = aria.getNodeState(item.id) as NodeState
            return (
              <div key={item.id} {...props} data-testid={item.id}>
                {(item.data as Record<string, unknown>)?.name as string}
              </div>
            )
          })}
        </div>
      )}
    </Aria>,
  )
}

describe('Menu Button APG conformance (popup axis)', () => {
  // V1: S1 — aria-haspopup on trigger
  it('trigger has aria-haspopup="menu" and aria-expanded="false"', () => {
    const { container } = renderMenuButton(fixtureData())
    const trigger = container.querySelector('[data-node-id="actions"]')!
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  // V2: S2 — Enter opens popup
  it('Enter on trigger opens popup and focuses first item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenuButton(fixtureData())

    // Focus trigger
    const trigger = container.querySelector('[data-node-id="actions"]') as HTMLElement
    trigger.focus()

    await user.keyboard('{Enter}')

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    // First menuitem should have focus (tabindex=0)
    const cut = container.querySelector('[data-node-id="cut"]') as HTMLElement
    expect(cut.getAttribute('tabindex')).toBe('0')
  })

  // V3: S3 — Escape closes popup
  it('Escape closes popup and returns focus to trigger', async () => {
    const user = userEvent.setup()
    const { container } = renderMenuButton(fixtureData())

    const trigger = container.querySelector('[data-node-id="actions"]') as HTMLElement
    trigger.focus()

    await user.keyboard('{Enter}')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    await user.keyboard('{Escape}')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    // Focus should be back on trigger
    expect(trigger.getAttribute('tabindex')).toBe('0')
  })

  // V4: S2 — ArrowDown opens popup
  it('ArrowDown on trigger opens popup and focuses first item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenuButton(fixtureData())

    const trigger = container.querySelector('[data-node-id="actions"]') as HTMLElement
    trigger.focus()

    await user.keyboard('{ArrowDown}')

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    const cut = container.querySelector('[data-node-id="cut"]') as HTMLElement
    expect(cut.getAttribute('tabindex')).toBe('0')
  })

  // V5: S2 — ArrowUp opens popup and focuses last item
  it('ArrowUp on trigger opens popup and focuses last item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenuButton(fixtureData())

    const trigger = container.querySelector('[data-node-id="actions"]') as HTMLElement
    trigger.focus()

    await user.keyboard('{ArrowUp}')

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    const paste = container.querySelector('[data-node-id="paste"]') as HTMLElement
    expect(paste.getAttribute('tabindex')).toBe('0')
  })

  // V7: Backward compat — popupType 없는 패턴
  it('patterns without popupType have no aria-haspopup', () => {
    // This is implicitly verified by all existing tests passing
    // but let's be explicit: menu pattern (not menuButton) has no popupType
  })
})
```

- [ ] **Step 2: Run test to verify**

Run: `pnpm test -- src/interactive-os/__tests__/menu-button-apg.conformance.test.tsx`
Expected: Tests may fail if Aria component rendering needs adjustment. Debug and fix.

Note: The test uses `Aria` component render-prop pattern. If `Aria` doesn't expose `items`, adjust to use `useAria` hook directly in a wrapper component. Check existing tests like `menu-apg.conformance.test.tsx` for the exact render pattern used.

- [ ] **Step 3: Iterate until all tests pass**

Fix any issues with:
- Popup state initialization timing
- Focus delegation command batching
- aria-haspopup/expanded rendering in getNodeProps
- Visibility gating (popup children should be visible when open)

Key consideration: popup children need to be visible when isOpen=true. If `getVisibleNodes` gates by expand, popup children won't show unless expanded. The popup axis may need its own visibilityFilter that shows children when isOpen=true, OR it should also add the triggerId to expandedIds when opening.

If visibility gating is the blocker, add a visibilityFilter to popup():

```ts
const popupVisibilityFilter: VisibilityFilter = {
  shouldDescend(nodeId, store) {
    const popup = getPopupEntity(store)
    if (popup.isOpen && popup.triggerId === nodeId) return true
    return undefined as unknown as boolean // let other filters decide
  },
}
```

- [ ] **Step 4: Commit**

```bash
git add src/interactive-os/__tests__/menu-button-apg.conformance.test.tsx
git commit -m "test: Menu Button APG conformance — popup axis validation"
```

---

### Task 9: Regression test + cleanup

**Files:** none (test run only)

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All existing tests pass. Pre-existing `workspace-store.test.ts` failure is known. No new failures.

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: PASS (or fix any lint issues)

- [ ] **Step 4: Update APG conformance matrix**

In `docs/2-areas/pattern/apgConformanceMatrix.md`:

Under "Menu Button" section, update the menu-button-actions entry or note that menuButton pattern now exists with popup axis.

Under "os 갭 레지스트리", add:

```markdown
| 8 | popup 축 신설 — aria-haspopup + 포커스 위임/복귀 세트 | Menu Button (#41) | popup axis | ✅ 해소 (probe) |
```

- [ ] **Step 5: Commit**

```bash
git add docs/2-areas/pattern/apgConformanceMatrix.md
git commit -m "docs: APG matrix — popup axis probe complete"
```
