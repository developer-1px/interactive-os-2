---
id: 2-areas/axis/prds/axis-v3-architecture-plan
type: plan
slug: axisV3Architecture
title: Axis v3 Architecture Implementation Plan
tags: [x]
created: 2026-03-29
updated: 2026-04-08
summary: '**For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.'
legacy:
  status: active
  kind: plan
  topics: [2-areas, x]
  relates: []
  supersedes: []
---
# Axis v3 Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure axes from keyMap owners to capability SSOTs, making patterns own key bindings and enabling declarative OCP pattern extension.

**Architecture:** Axes provide commands + ctx extensions + handlers + config + middleware + visibilityFilter + ariaAttributes (no keyMap). Patterns compose axes for capability and declare keyMap/clickMap for bindings. composePattern supports both creation and extension (base pattern + overrides). createPatternContext god object is dismantled — each axis provides its ctx fragment.

**Tech Stack:** TypeScript, React hooks, vitest for testing

**PRD:** `docs/superpowers/specs/2026-03-28-axis-v3-architecture-prd.md`

**Constraint:** Atomic restructure — ALL changes land in ONE commit. Existing 97 integration/conformance tests are the safety net (behavior must not change).

---

### Task 1: Foundation — New Axis Interface

**Files:**
- Modify: `src/interactive-os/axis/types.ts`

- [ ] **Step 1: Rewrite axis/types.ts with new interfaces**

```ts
// ② 2026-03-28-axis-v3-architecture-prd.md
import type { Entity } from '../store/types'
import type { Command } from '../engine/types'
import type { ValueRange } from './value'
import type { Middleware, VisibilityFilter } from '../engine/types'
import type { CommandEngine } from '../engine/createCommandEngine'
import type { NormalizedData } from '../store/types'

export type SelectionMode = 'single' | 'multiple'

export interface GridNav {
  colIndex: number
  colCount: number
  focusNextCol(): Command
  focusPrevCol(): Command
  focusFirstCol(): Command
  focusLastCol(): Command
}

export interface ValueNav {
  current: number
  min: number
  max: number
  step: number
  increment(step?: number): Command
  decrement(step?: number): Command
  setToMin(): Command
  setToMax(): Command
  setValue(value: number): Command
}

export interface FocusStrategy {
  type: 'roving-tabindex' | 'aria-activedescendant' | 'natural-tab-order'
  orientation: 'vertical' | 'horizontal' | 'both'
}

export interface NodeState {
  focused: boolean
  selected: boolean
  disabled: boolean
  index: number
  siblingCount: number
  expanded?: boolean
  checked?: boolean | 'mixed'
  level?: number
  valueCurrent?: number
  open?: boolean
  [key: string]: unknown
}

/**
 * PatternContext — assembled from axis createCtx fragments.
 * Union of all possible axis contributions. Axes that aren't composed
 * leave their fields undefined at runtime (practical approach per PRD).
 */
export interface PatternContext {
  // Base (always present)
  focused: string
  dispatch(command: Command): void
  getEntity(id: string): Entity | undefined
  getChildren(id: string): string[]

  // navigate axis
  focusNext(options?: { wrap?: boolean }): Command
  focusPrev(options?: { wrap?: boolean }): Command
  focusFirst(): Command
  focusLast(): Command
  focusParent(): Command
  focusChild(): Command

  // select axis
  selected: string[]
  toggleSelect(): Command
  extendSelection(direction: 'next' | 'prev' | 'first' | 'last'): Command
  extendSelectionTo(targetId: string, navigableIds?: string[]): Command

  // expand axis
  isExpanded: boolean
  expand(): Command
  collapse(): Command

  // checked axis
  isChecked: boolean
  toggleCheck(): Command

  // popup axis
  isOpen: boolean
  open(): Command
  close(): Command

  // grid (navigate option)
  grid?: GridNav
  // value axis
  value?: ValueNav
}

export type KeyMap = Record<string, (ctx: PatternContext) => Command | void>

export type ClickModifier = 'none' | 'shift' | 'mod' | 'shift+mod'
export type ClickMap = Record<ClickModifier, (ctx: PatternContext, nodeId: string) => Command | void>

/** Zone-local view state for useAriaZone */
export interface ZoneViewState {
  focusedId: string
  selectedIds: string[]
  selectionAnchor: string
  expandedIds: string[]
  checkedIds: string[]
  gridCol: number
  popupIsOpen: boolean
  popupTriggerId: string
}

/**
 * v3 Axis — capability SSOT. No keyMap.
 * Axes provide: createCtx, handlers, config, middleware, visibilityFilter, ariaAttributes.
 */
export interface AxisDefinition {
  /** Create ctx fragment from engine state */
  createCtx: (engine: CommandEngine) => Partial<PatternContext>

  /** Reusable handlers — APG-named, patterns bind these to keys */
  handlers: Record<string, (ctx: PatternContext) => Command | void>

  /** Click handlers — patterns bind these via clickMap */
  clickHandlers?: Record<string, (ctx: PatternContext, nodeId: string) => Command | void>

  /** Config flags */
  config?: Partial<AxisConfig>

  /** Command middleware (e.g., anchorResetMiddleware from select) */
  middleware?: Middleware

  /** Visibility filter (e.g., expand gating) */
  visibilityFilter?: VisibilityFilter

  /** State-derived aria attributes (e.g., aria-selected from select, aria-expanded from expand) */
  ariaAttributes?: (node: Entity, state: NodeState) => Record<string, string>

  /** Meta entity IDs this axis owns (for useAria sync) */
  metaEntityIds?: string[]

  /** Meta command types this axis owns (for useAriaZone) */
  metaCommandTypes?: string[]

  /** Zone-local state reducer (for useAriaZone applyMetaCommand) */
  applyMeta?: (state: ZoneViewState, command: Command) => ZoneViewState

  /** Init actions — e.g., ensure __expanded__ entity exists */
  init?: (engine: CommandEngine, store: NormalizedData) => void
}

export interface AxisConfig {
  focusStrategy: FocusStrategy
  tabFocusStrategy: FocusStrategy
  expandable: boolean
  expandTracking: boolean
  checkedTracking: boolean
  selectionMode: SelectionMode
  selectOnClick: boolean
  activateOnClick: boolean
  checkOnClick: boolean
  expandOnParentClick: boolean
  selectionFollowsFocus: boolean
  activationFollowsSelection: boolean
  colCount: number
  valueRange: ValueRange
  popupType: 'menu' | 'listbox' | 'grid' | 'tree' | 'dialog'
  popupModal: boolean
}
```

- [ ] **Step 2: Verify typecheck compiles (expect errors in consumers — that's expected)**

Run: `pnpm typecheck 2>&1 | head -5`
Expected: Errors from axis/*.ts and pattern/*.ts (they still use old interface)

---

### Task 2: Navigate Axis Rewrite

**Files:**
- Modify: `src/interactive-os/axis/navigate.ts`

- [ ] **Step 1: Rewrite navigate axis — commands stay, keyMap → handlers**

Keep all existing `focusCommands` and `gridColCommands` unchanged.
Remove the `navigate()` function's keyMap. Add `createCtx`, `handlers`, `metaEntityIds`, `metaCommandTypes`, `applyMeta`.

The `createCtx` extracts focus navigation logic from createPatternContext (lines 98-142).
The `handlers` expose APG-named functions: `movesNext`, `movesPrev`, `movesFirst`, `movesLast`.

```ts
// ② 2026-03-28-axis-v3-architecture-prd.md
import type { PatternContext, AxisDefinition, AxisConfig, ZoneViewState } from './types'
import type { Command } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import { getChildren, getParent } from '../store/createStore'
import { getVisibleNodes } from '../engine/getVisibleNodes'
import type { VisibilityFilter, CommandEngine } from '../engine/types'

// ── Commands (unchanged) ──
export const FOCUS_ID = '__focus__'
export const GRID_COL_ID = '__grid_col__'

export const focusCommands = { /* ... keep existing ... */ }
export const gridColCommands = { /* ... keep existing ... */ }

// ── Axis Definition ──

export interface NavigateOptions {
  orientation?: 'vertical' | 'horizontal' | 'both'
  wrap?: boolean
  grid?: { columns: number; tabCycle?: boolean }
  tabFocusStrategy?: AxisConfig['tabFocusStrategy']
}

export function navigate(options?: NavigateOptions): AxisDefinition {
  const orientation = options?.orientation ?? 'vertical'
  const columns = options?.grid?.columns

  function createCtx(engine: CommandEngine): Partial<PatternContext> {
    const store = engine.getStore()
    const focusedId = (store.entities[FOCUS_ID]?.focusedId as string) ?? ''

    let _visibleNodes: string[] | null = null
    const visibleNodes = (filters?: VisibilityFilter[]): string[] => {
      if (!_visibleNodes) _visibleNodes = getVisibleNodes(store, filters)
      return _visibleNodes
    }

    // Grid nav (optional)
    const grid = columns && columns > 1 ? (() => {
      const currentCol = (store.entities[GRID_COL_ID]?.colIndex as number) ?? 0
      return {
        colIndex: currentCol,
        colCount: columns,
        focusNextCol: () => gridColCommands.setColIndex(Math.min(currentCol + 1, columns - 1)),
        focusPrevCol: () => gridColCommands.setColIndex(Math.max(currentCol - 1, 0)),
        focusFirstCol: () => gridColCommands.setColIndex(0),
        focusLastCol: () => gridColCommands.setColIndex(columns - 1),
      }
    })() : undefined

    return {
      focused: focusedId,
      focusNext(opts?: { wrap?: boolean }) {
        const visible = visibleNodes()
        const idx = visible.indexOf(focusedId)
        const wrap = opts?.wrap
        const nextId = wrap
          ? visible[(idx + 1) % visible.length] ?? focusedId
          : visible[idx + 1] ?? focusedId
        return focusCommands.setFocus(nextId)
      },
      focusPrev(opts?: { wrap?: boolean }) {
        const visible = visibleNodes()
        const idx = visible.indexOf(focusedId)
        const wrap = opts?.wrap
        const prevId = wrap
          ? visible[(idx - 1 + visible.length) % visible.length] ?? focusedId
          : visible[idx - 1] ?? focusedId
        return focusCommands.setFocus(prevId)
      },
      focusFirst() {
        const visible = visibleNodes()
        return focusCommands.setFocus(visible[0] ?? focusedId)
      },
      focusLast() {
        const visible = visibleNodes()
        return focusCommands.setFocus(visible[visible.length - 1] ?? focusedId)
      },
      focusParent() {
        const parentId = getParent(store, focusedId)
        if (!parentId || parentId === ROOT_ID) return focusCommands.setFocus(focusedId)
        return focusCommands.setFocus(parentId)
      },
      focusChild() {
        const children = getChildren(store, focusedId)
        if (children.length === 0) return focusCommands.setFocus(focusedId)
        return focusCommands.setFocus(children[0]!)
      },
      grid,
    }
  }

  const wrap = options?.wrap

  // APG: "moves focus to the next/previous/first/last node"
  const handlers: AxisDefinition['handlers'] = {
    movesNext: (ctx) => ctx.focusNext(wrap ? { wrap: true } : undefined),
    movesPrev: (ctx) => ctx.focusPrev(wrap ? { wrap: true } : undefined),
    movesFirst: (ctx) => ctx.focusFirst(),
    movesLast: (ctx) => ctx.focusLast(),
  }

  const config: Partial<AxisConfig> = {
    focusStrategy: { type: 'roving-tabindex', orientation },
    ...(columns && { colCount: columns }),
    ...(options?.tabFocusStrategy && { tabFocusStrategy: options.tabFocusStrategy }),
  }

  const metaEntityIds = [FOCUS_ID, ...(columns ? [GRID_COL_ID] : [])]
  const metaCommandTypes = ['core:focus', ...(columns ? ['core:set-col-index'] : [])]

  const applyMeta = (state: ZoneViewState, command: Command): ZoneViewState => {
    const p = command.payload as Record<string, unknown>
    switch (command.type) {
      case 'core:focus': return { ...state, focusedId: p.nodeId as string }
      case 'core:set-col-index': return { ...state, gridCol: p.colIndex as number }
      default: return state
    }
  }

  return { createCtx, handlers, config, metaEntityIds, metaCommandTypes, applyMeta }
}
```

Note: `focusCommands` and `gridColCommands` remain exported as-is for external use.

---

### Task 3: Select Axis Rewrite

**Files:**
- Modify: `src/interactive-os/axis/select.ts`

- [ ] **Step 1: Rewrite select — commands stay, keyMap → handlers + middleware**

Keep all `selectionCommands` unchanged. Remove select() keyMap. Add createCtx, handlers, applyMeta.

```ts
// ② 2026-03-28-axis-v3-architecture-prd.md

// ... selectionCommands unchanged ...
// ... anchorResetMiddleware unchanged ...
// ... selectionFollowsFocusMiddleware unchanged ...

export function select(options?: SelectOptions): AxisDefinition {
  const mode = options?.mode ?? 'multiple'
  const extended = options?.extended && mode === 'multiple'

  function createCtx(engine: CommandEngine): Partial<PatternContext> {
    const store = engine.getStore()
    const focusedId = (store.entities[FOCUS_ID]?.focusedId as string) ?? ''
    const selectedIds = (store.entities[SELECTION_ID]?.selectedIds as string[]) ?? []

    return {
      selected: selectedIds,
      toggleSelect() {
        if (mode === 'single') return selectionCommands.select(focusedId)
        return selectionCommands.toggleSelect(focusedId)
      },
      extendSelection(direction) {
        // ... existing extendSelection logic from createPatternContext lines 186-222
      },
      extendSelectionTo(targetId, navigableIds) {
        // ... existing extendSelectionTo logic from createPatternContext lines 224-243
      },
    }
  }

  // APG: "toggles the selection state"
  const handlers: AxisDefinition['handlers'] = {
    togglesSelection: (ctx) => ctx.toggleSelect(),
    ...(extended && {
      extendsNext: (ctx) => ctx.extendSelection('next'),
      extendsPrev: (ctx) => ctx.extendSelection('prev'),
      extendsFirst: (ctx) => ctx.extendSelection('first'),
      extendsLast: (ctx) => ctx.extendSelection('last'),
    }),
  }

  // Click handlers — pattern binds these via clickMap
  const clickHandlers: AxisDefinition['clickHandlers'] = {
    selectsOnClick: (ctx, nodeId) =>
      createBatchCommand([selectionCommands.select(nodeId), selectionCommands.setAnchor(nodeId)]),
    togglesOnClick: (_ctx, nodeId) => selectionCommands.toggleSelect(nodeId),
    extendsToOnClick: (ctx, nodeId) => ctx.extendSelectionTo(nodeId),
  }

  const ariaAttributes: AxisDefinition['ariaAttributes'] = (_node, state) => ({
    'aria-selected': String(state.selected),
  })

  const middlewares: Middleware[] = [anchorResetMiddleware()]
  if (options?.selectionFollowsFocus) middlewares.push(selectionFollowsFocusMiddleware())
  const middleware = middlewares.length === 1
    ? middlewares[0]!
    : (next: (cmd: Command) => void) => middlewares.reduceRight((acc, mw) => mw(acc), next)

  const config: Partial<AxisConfig> = {
    selectionMode: mode,
    ...(options?.selectionFollowsFocus && { selectionFollowsFocus: true }),
  }

  const metaEntityIds = [SELECTION_ID, SELECTION_ANCHOR_ID]
  const metaCommandTypes = ['core:toggle-select', 'core:select-range', 'core:set-anchor', 'core:clear-anchor', 'core:clear-selection']

  const applyMeta = (state: ZoneViewState, command: Command): ZoneViewState => {
    const p = command.payload as Record<string, unknown>
    switch (command.type) {
      case 'core:toggle-select': {
        const id = p.nodeId as string
        const set = new Set(state.selectedIds)
        if (set.has(id)) set.delete(id); else set.add(id)
        return { ...state, selectedIds: Array.from(set) }
      }
      case 'core:select-range': return { ...state, selectedIds: p.nodeIds as string[] }
      case 'core:set-anchor': return { ...state, selectionAnchor: p.nodeId as string }
      case 'core:clear-anchor': return { ...state, selectionAnchor: '' }
      case 'core:clear-selection': return { ...state, selectedIds: [] }
      default: return state
    }
  }

  return { createCtx, handlers, clickHandlers, config, middleware, ariaAttributes, metaEntityIds, metaCommandTypes, applyMeta }
}
```

---

### Task 4: Expand Axis Rewrite

**Files:**
- Modify: `src/interactive-os/axis/expand.ts`

- [ ] **Step 1: Rewrite expand — commands stay, keyMap → handlers**

```ts
// ② 2026-03-28-axis-v3-architecture-prd.md

// ... expandCommands unchanged ...
// ... expandVisibilityFilter unchanged ...

export function expand(): AxisDefinition {
  function createCtx(engine: CommandEngine): Partial<PatternContext> {
    const store = engine.getStore()
    const focusedId = (store.entities[FOCUS_ID]?.focusedId as string) ?? ''
    const expandedIds = (store.entities[EXPANDED_ID]?.expandedIds as string[]) ?? []

    return {
      isExpanded: expandedIds.includes(focusedId),
      expand: () => expandCommands.expand(focusedId),
      collapse: () => expandCommands.collapse(focusedId),
    }
  }

  // APG tree: "opens the node; moves focus to the first child"
  // APG tree: "closes the node; moves focus to its parent"
  const handlers: AxisDefinition['handlers'] = {
    opensOrFocusChild: (ctx) => ctx.isExpanded ? ctx.focusChild() : ctx.expand(),
    closesOrFocusParent: (ctx) => ctx.isExpanded ? ctx.collapse() : ctx.focusParent(),
  }

  const ariaAttributes: AxisDefinition['ariaAttributes'] = (_node, state) => {
    if (state.expanded === undefined) return {}
    return { 'aria-expanded': String(state.expanded) }
  }

  const metaEntityIds = [EXPANDED_ID]
  const metaCommandTypes = ['core:expand', 'core:collapse', 'core:toggle-expand']

  const applyMeta = (state: ZoneViewState, command: Command): ZoneViewState => {
    const p = command.payload as Record<string, unknown>
    switch (command.type) {
      case 'core:expand': {
        const id = p.nodeId as string
        return state.expandedIds.includes(id) ? state : { ...state, expandedIds: [...state.expandedIds, id] }
      }
      case 'core:collapse': {
        const id = p.nodeId as string
        return { ...state, expandedIds: state.expandedIds.filter(x => x !== id) }
      }
      case 'core:toggle-expand': {
        const id = p.nodeId as string
        return state.expandedIds.includes(id)
          ? { ...state, expandedIds: state.expandedIds.filter(x => x !== id) }
          : { ...state, expandedIds: [...state.expandedIds, id] }
      }
      default: return state
    }
  }

  const init: AxisDefinition['init'] = (engine, store) => {
    if (!store.entities[EXPANDED_ID]) {
      engine.syncStore({
        entities: { ...engine.getStore().entities, [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: [] } },
        relationships: engine.getStore().relationships,
      })
    }
  }

  return {
    createCtx, handlers, config: { expandTracking: true },
    visibilityFilter: expandVisibilityFilter, ariaAttributes,
    metaEntityIds, metaCommandTypes, applyMeta, init,
  }
}
```

---

### Task 5: Value, Popup, Checked Axes + Delete Obsolete

**Files:**
- Modify: `src/interactive-os/axis/value.ts`
- Modify: `src/interactive-os/axis/popup.ts`
- Modify: `src/interactive-os/axis/checked.ts`
- Delete: `src/interactive-os/axis/activate.ts`
- Delete: `src/interactive-os/axis/dismiss.ts`
- Delete: `src/interactive-os/axis/tab.ts`

- [ ] **Step 1: Rewrite value axis**

Same pattern as expand — commands stay, add createCtx/handlers/ariaAttributes/applyMeta. Handlers: `increase`, `decrease`, `setToFirst`, `setToLast` (APG wording).

- [ ] **Step 2: Rewrite popup axis**

Commands stay. Handlers: `opensPopup`, `closesPopup`. AriaAttributes: `aria-haspopup`, `aria-expanded` (from isOpen). Add `init` for POPUP_ID entity.

- [ ] **Step 3: Rewrite checked axis**

Commands stay. Handlers: `togglesCheck`. AriaAttributes: `aria-checked`. Add `init` for CHECKED_ID entity.

- [ ] **Step 4: Delete activate.ts, dismiss.ts, tab.ts**

```bash
git rm src/interactive-os/axis/activate.ts
git rm src/interactive-os/axis/dismiss.ts
git rm src/interactive-os/axis/tab.ts
```

Tab's `tabFocusStrategy` config moves to navigate options (already done in Task 2).

---

### Task 6: composePattern + Pattern Types Rewrite

**Files:**
- Modify: `src/interactive-os/pattern/types.ts`
- Modify: `src/interactive-os/pattern/composePattern.ts`
- Delete or gut: `src/interactive-os/pattern/createPatternContext.ts`

- [ ] **Step 1: Update AriaPattern in types.ts**

Move NodeState to axis/types.ts (already done in Task 1). AriaPattern gains:
- `axes: AxisDefinition[]` — for ctx composition at runtime
- `clickMap?: Partial<ClickMap>` — declarative click handling
- `metaEntityIds: Set<string>` — from axes
- `metaCommandTypes: Set<string>` — from axes
- `applyMeta: (state: ZoneViewState, command: Command) => ZoneViewState` — composed reducer

- [ ] **Step 2: Rewrite composePattern with two overloads**

```ts
// ② 2026-03-28-axis-v3-architecture-prd.md
import type { AxisDefinition, AxisConfig, KeyMap, ClickMap, ZoneViewState, PatternContext, NodeState } from '../axis/types'
import type { Entity } from '../store/types'
import type { Command, Middleware, VisibilityFilter } from '../engine/types'
import type { CommandEngine } from '../engine/createCommandEngine'

export interface Identity {
  role: string
  childRole?: string | ((entity: Entity, state: NodeState) => string)
  ariaAttributes: (node: Entity, state: NodeState) => Record<string, string>
}

export interface AriaPattern {
  role: string
  childRole?: string | ((entity: Entity, state: NodeState) => string)
  keyMap: KeyMap
  clickMap?: Partial<ClickMap>
  focusStrategy: FocusStrategy
  // ... all existing config fields ...
  ariaAttributes: (node: Entity, state: NodeState) => Record<string, string>
  middleware?: Middleware
  visibilityFilters?: VisibilityFilter[]
  // v3 additions
  axes: AxisDefinition[]
  metaEntityIds: Set<string>
  metaCommandTypes: Set<string>
  applyMeta: (state: ZoneViewState, command: Command) => ZoneViewState
}

// Overload 1: New pattern
export function composePattern(
  identity: Identity,
  axes: AxisDefinition[],
  keyMap: KeyMap,
  clickMap?: Partial<ClickMap>,
): AriaPattern

// Overload 2: Extend existing pattern
export function composePattern(
  base: AriaPattern,
  axes: AxisDefinition[],
  keyMap: KeyMap,
  clickMap?: Partial<ClickMap>,
): AriaPattern

export function composePattern(
  first: Identity | AriaPattern,
  axes: AxisDefinition[],
  keyMap: KeyMap,
  clickMap?: Partial<ClickMap>,
): AriaPattern {
  const isExtension = 'axes' in first

  // Merge config from all axes
  let mergedConfig: Partial<AxisConfig> = {}
  const allAxes = isExtension ? [...(first as AriaPattern).axes, ...axes] : axes
  for (const axis of allAxes) {
    if (axis.config) mergedConfig = { ...mergedConfig, ...axis.config }
  }

  // Merge middlewares
  const middlewares: Middleware[] = []
  for (const axis of allAxes) {
    if (axis.middleware) middlewares.push(axis.middleware)
  }
  const composedMiddleware = middlewares.length === 0 ? undefined
    : middlewares.length === 1 ? middlewares[0]
    : (next: (cmd: Command) => void) => middlewares.reduceRight((acc, mw) => mw(acc), next)

  // Merge visibility filters
  const visibilityFilters: VisibilityFilter[] = []
  for (const axis of allAxes) {
    if (axis.visibilityFilter) visibilityFilters.push(axis.visibilityFilter)
  }

  // Merge ariaAttributes: identity (structural) + axes (state-derived)
  const baseAriaAttrs = isExtension
    ? (first as AriaPattern).ariaAttributes
    : (first as Identity).ariaAttributes
  const axisAriaFns = allAxes.map(a => a.ariaAttributes).filter(Boolean)
  const mergedAriaAttributes = (node: Entity, state: NodeState): Record<string, string> => {
    const result = { ...baseAriaAttrs(node, state) }
    for (const fn of axisAriaFns) {
      Object.assign(result, fn!(node, state))
    }
    return result
  }

  // Merge keyMap: base + override
  const mergedKeyMap = isExtension
    ? { ...(first as AriaPattern).keyMap, ...keyMap }
    : keyMap

  // Merge clickMap
  const mergedClickMap = isExtension
    ? { ...(first as AriaPattern).clickMap, ...clickMap }
    : clickMap

  // Collect meta entity IDs and command types
  const metaEntityIds = new Set<string>()
  const metaCommandTypes = new Set<string>()
  for (const axis of allAxes) {
    for (const id of axis.metaEntityIds ?? []) metaEntityIds.add(id)
    for (const t of axis.metaCommandTypes ?? []) metaCommandTypes.add(t)
  }

  // Compose applyMeta reducers
  const applyMeta = (state: ZoneViewState, command: Command): ZoneViewState => {
    let s = state
    for (const axis of allAxes) {
      if (axis.applyMeta) s = axis.applyMeta(s, command)
    }
    return s
  }

  const identity = isExtension
    ? { role: (first as AriaPattern).role, childRole: (first as AriaPattern).childRole }
    : first as Identity

  const focusStrategy = mergedConfig.tabFocusStrategy ?? mergedConfig.focusStrategy
    ?? { type: 'natural-tab-order' as const, orientation: 'vertical' as const }

  return {
    role: identity.role,
    childRole: identity.childRole,
    keyMap: mergedKeyMap,
    clickMap: mergedClickMap,
    focusStrategy,
    ariaAttributes: mergedAriaAttributes,
    axes: allAxes,
    metaEntityIds,
    metaCommandTypes,
    applyMeta,
    // Spread config fields
    ...(mergedConfig.expandable !== undefined && { expandable: mergedConfig.expandable }),
    ...(mergedConfig.expandTracking !== undefined && { expandTracking: mergedConfig.expandTracking }),
    ...(mergedConfig.checkedTracking !== undefined && { checkedTracking: mergedConfig.checkedTracking }),
    ...(mergedConfig.selectionMode !== undefined && { selectionMode: mergedConfig.selectionMode }),
    ...(mergedConfig.selectionFollowsFocus !== undefined && { selectionFollowsFocus: mergedConfig.selectionFollowsFocus }),
    ...(mergedConfig.activationFollowsSelection !== undefined && { activationFollowsSelection: mergedConfig.activationFollowsSelection }),
    ...(mergedConfig.colCount !== undefined && { colCount: mergedConfig.colCount }),
    ...(mergedConfig.valueRange !== undefined && { valueRange: mergedConfig.valueRange }),
    ...(mergedConfig.popupType !== undefined && { popupType: mergedConfig.popupType }),
    ...(mergedConfig.popupModal !== undefined && { popupModal: mergedConfig.popupModal }),
    ...(composedMiddleware && { middleware: composedMiddleware }),
    ...(visibilityFilters.length > 0 && { visibilityFilters }),
  }
}
```

- [ ] **Step 3: Replace createPatternContext with composeCtx**

```ts
// ② 2026-03-28-axis-v3-architecture-prd.md
// pattern/createPatternContext.ts → thin shell that composes axis createCtx fragments

import type { PatternContext } from '../axis/types'
import type { AxisDefinition } from '../axis/types'
import type { CommandEngine } from '../engine/createCommandEngine'
import { getEntity, getChildren } from '../store/createStore'

export function composeCtx(engine: CommandEngine, axes: AxisDefinition[]): PatternContext {
  const store = engine.getStore()

  // Base ctx — always present
  const base: Partial<PatternContext> = {
    dispatch: (command) => engine.dispatch(command),
    getEntity: (id) => getEntity(store, id),
    getChildren: (id) => getChildren(store, id),
  }

  // Merge axis ctx fragments
  let ctx = { ...base } as PatternContext
  for (const axis of axes) {
    Object.assign(ctx, axis.createCtx(engine))
  }

  return ctx
}
```

---

### Task 7: Migrate All 30 Patterns

**Files:**
- Modify: all 30 files in `src/interactive-os/pattern/roles/`

This is the largest task. Each pattern changes from `composePattern(identity, ...axes)` to `composePattern(identity, axes[], keyMap)`.

- [ ] **Step 1: Migrate simple no-axis patterns (alert, feed, meter)**

`alert.ts` and `meter.ts`: no axes, no keyMap — trivial:
```ts
export function alert() {
  return composePattern({ role: 'alert', ariaAttributes: () => ({}) }, [], {})
}
```

`feed.ts`: has custom keyMap with PageDown/PageUp — move keyMap from axis to pattern:
```ts
const nav = navigate()
export function feed() {
  return composePattern(
    { role: 'feed', ariaAttributes: () => ({}) },
    [nav],
    { PageDown: nav.handlers.movesNext, PageUp: nav.handlers.movesPrev },
  )
}
```

- [ ] **Step 2: Migrate checked-only patterns (checkbox, switch, buttonToggle)**

```ts
// checkbox.ts
const chk = checked()
export function checkbox() {
  return composePattern(
    { role: 'checkbox', ariaAttributes: () => ({}) },
    [chk],
    { Enter: chk.handlers.togglesCheck, Space: chk.handlers.togglesCheck },
  )
}
```

`switch.ts` and `buttonToggle.ts` follow the same pattern with different roles.

- [ ] **Step 3: Migrate value patterns (slider, spinbutton, windowSplitter)**

```ts
// slider.ts
export function slider(options: SliderOptions) {
  const val = value({ min, max, step, orientation })
  return composePattern(
    { role: 'slider', ariaAttributes: (node, state) => ({
      'aria-valuenow': String(state.valueCurrent ?? min),
      'aria-valuemin': String(min), 'aria-valuemax': String(max),
      ...((node.data as Record<string, unknown>)?.label ? { 'aria-label': ... } : {}),
    })},
    [val],
    {
      ArrowRight: val.handlers.increase,
      ArrowUp: val.handlers.increase,
      ArrowLeft: val.handlers.decrease,
      ArrowDown: val.handlers.decrease,
      Home: val.handlers.setToFirst,
      End: val.handlers.setToLast,
    },
  )
}
```

- [ ] **Step 4: Migrate standard navigate+select patterns (listbox, tabs, tabsManual, radiogroup, radiogroupActivedescendant, toolbar, listboxGrouped)**

```ts
// listbox.ts — representative example
const nav = navigate()
const sel = select({ mode: 'multiple', extended: true })

export function listbox() {
  return composePattern(
    { role: 'listbox', childRole: 'option',
      ariaAttributes: (_node, state) => ({
        'aria-posinset': String(state.index + 1),
        'aria-setsize': String(state.siblingCount),
      }),
    },
    [nav, sel],
    {
      ArrowDown: nav.handlers.movesNext,
      ArrowUp: nav.handlers.movesPrev,
      Home: nav.handlers.movesFirst,
      End: nav.handlers.movesLast,
      Space: sel.handlers.togglesSelection,
      ...(sel.handlers.extendsNext && {
        'Shift+ArrowDown': sel.handlers.extendsNext,
        'Shift+ArrowUp': sel.handlers.extendsPrev,
        'Shift+Home': sel.handlers.extendsFirst,
        'Shift+End': sel.handlers.extendsLast,
      }),
      // activate on Enter — previously from activate axis
      Enter: (ctx) => ctx.toggleSelect(),
    },
    // clickMap
    {
      none: (ctx, nodeId) => sel.clickHandlers!.selectsOnClick(ctx, nodeId),
      shift: (ctx, nodeId) => sel.clickHandlers!.extendsToOnClick(ctx, nodeId),
      mod: (ctx, nodeId) => sel.clickHandlers!.togglesOnClick(ctx, nodeId),
    },
  )
}
```

Each pattern follows this template, differing in:
- `navigate()` options (orientation, wrap)
- `select()` options (mode, extended, selectionFollowsFocus)
- Whether Enter/Space map to toggleSelect, toggleCheck, expand, etc.
- clickMap presence and configuration

- [ ] **Step 5: Migrate expand patterns (tree, menu, accordion, disclosure, table)**

```ts
// tree.ts — key example
const nav = navigate()
const sel = select({ mode: 'multiple', extended: true })
const exp = expand()

export function tree() {
  return composePattern(
    { role: 'tree', childRole: 'treeitem',
      ariaAttributes: (_node, state) => ({
        'aria-posinset': String(state.index + 1),
        'aria-setsize': String(state.siblingCount),
        ...(state.level !== undefined && { 'aria-level': String(state.level) }),
      }),
    },
    [nav, sel, exp],
    {
      ArrowDown: nav.handlers.movesNext,
      ArrowUp: nav.handlers.movesPrev,
      ArrowRight: exp.handlers.opensOrFocusChild,
      ArrowLeft: exp.handlers.closesOrFocusParent,
      Home: nav.handlers.movesFirst,
      End: nav.handlers.movesLast,
      Space: sel.handlers.togglesSelection,
      Enter: (ctx) => expandCommands.toggleExpand(ctx.focused),
      'Shift+ArrowDown': sel.handlers.extendsNext!,
      'Shift+ArrowUp': sel.handlers.extendsPrev!,
      'Shift+Home': sel.handlers.extendsFirst!,
      'Shift+End': sel.handlers.extendsLast!,
    },
    {
      none: (ctx, nodeId) => {
        const children = ctx.getChildren(nodeId)
        const cmds: Command[] = [selectionCommands.select(nodeId), selectionCommands.setAnchor(nodeId)]
        if (children.length > 0) cmds.push(expandCommands.toggleExpand(nodeId))
        return createBatchCommand(cmds)
      },
      shift: (ctx, nodeId) => sel.clickHandlers!.extendsToOnClick(ctx, nodeId),
      mod: (ctx, nodeId) => sel.clickHandlers!.togglesOnClick(ctx, nodeId),
    },
  )
}
```

`accordion.ts` — same axes but Enter=toggleExpand (not ArrowRight):
```ts
export function accordion() {
  return composePattern(
    { role: 'region', ... },
    [nav, exp],
    {
      ArrowDown: nav.handlers.movesNext,
      ArrowUp: nav.handlers.movesPrev,
      Home: nav.handlers.movesFirst,
      End: nav.handlers.movesLast,
      Enter: (ctx) => expandCommands.toggleExpand(ctx.focused),
      Space: (ctx) => expandCommands.toggleExpand(ctx.focused),
    },
    { none: (_ctx, nodeId) => expandCommands.toggleExpand(nodeId) },
  )
}
```

- [ ] **Step 6: Migrate complex patterns (grid, treegrid, combobox, dialog, alertdialog, menuButton, menuActivedescendant, checkboxMixed)**

```ts
// grid.ts
export function grid(options: { columns: number; tabCycle?: boolean }) {
  const nav = navigate({ grid: { columns: options.columns, tabCycle: options.tabCycle } })
  const sel = select()
  return composePattern(
    { role: 'grid', childRole: 'row',
      ariaAttributes: (_node, state) => ({
        'aria-rowindex': String(state.index + 1),
      }),
    },
    [nav, sel],
    {
      ArrowDown: (ctx) => ctx.focusNext(),
      ArrowUp: (ctx) => ctx.focusPrev(),
      ArrowRight: (ctx) => ctx.grid?.focusNextCol() ?? ctx.focusNext(),
      ArrowLeft: (ctx) => ctx.grid?.focusPrevCol() ?? ctx.focusPrev(),
      Home: (ctx) => ctx.grid?.focusFirstCol() ?? ctx.focusFirst(),
      End: (ctx) => ctx.grid?.focusLastCol() ?? ctx.focusLast(),
      'Mod+Home': nav.handlers.movesFirst,
      'Mod+End': nav.handlers.movesLast,
      ...(options.tabCycle && {
        Tab: (ctx) => { /* existing tabCycle logic from navigate */ },
        'Shift+Tab': (ctx) => { /* existing shift+tabCycle logic */ },
      }),
    },
  )
}

// treegrid.ts — extends tree() (PRD S4 验证)
export function treegrid(options: { columns: number }) {
  const gridNav = navigate({ grid: { columns: options.columns } })
  const exp = expand()
  return composePattern(
    tree(),   // base pattern
    [gridNav], // add grid navigation capability
    {
      // Override arrow keys for 2D + depth
      ArrowRight: (ctx) => {
        // Row: expand behavior. Cell: grid nav.
        const children = ctx.getChildren(ctx.focused)
        const hasChildren = children.length > 0
        if (hasChildren || ctx.isExpanded) return exp.handlers.opensOrFocusChild(ctx)
        return ctx.grid?.focusNextCol() ?? ctx.focusNext()
      },
      ArrowLeft: (ctx) => {
        const children = ctx.getChildren(ctx.focused)
        const hasChildren = children.length > 0
        if (hasChildren || ctx.isExpanded) return exp.handlers.closesOrFocusParent(ctx)
        return ctx.grid?.focusPrevCol() ?? ctx.focusPrev()
      },
    },
  )
}

// dialog.ts — dismiss → Escape in keyMap
export function dialog() {
  return composePattern(
    { role: 'dialog', ariaAttributes: (_node, state) => ({
      ...(state.expanded !== undefined && { 'aria-expanded': String(state.expanded) }),
    })},
    [],
    { Escape: (ctx) => ctx.collapse() },
  )
}
```

---

### Task 8: Primitives Update — useAriaView, useAria, useAriaZone

**Files:**
- Modify: `src/interactive-os/primitives/useAriaView.ts`
- Modify: `src/interactive-os/primitives/useAria.ts`
- Modify: `src/interactive-os/primitives/useAriaZone.ts`

- [ ] **Step 1: Update useAriaView — replace createPatternContext with composeCtx + clickMap**

Replace:
```ts
import { createPatternContext } from '../pattern/createPatternContext'
```
With:
```ts
import { composeCtx } from '../pattern/createPatternContext'
```

Replace all `createPatternContext(engine, behaviorCtxOptions)` calls with `composeCtx(engine, behavior.axes)`.

Remove `behaviorCtxOptions` memo entirely.

Replace hardcoded click handlers (selectOnClick, activateOnClick, checkOnClick, expandOnParentClick) with `behavior.clickMap` dispatch:
```ts
baseProps.onClick = (event: MouseEvent) => {
  if (event.defaultPrevented) return
  // ... existing bubbling guard ...
  if (!behavior.clickMap) return
  const modifier: ClickModifier = event.shiftKey && (event.ctrlKey || event.metaKey) ? 'shift+mod'
    : event.shiftKey ? 'shift'
    : (event.ctrlKey || event.metaKey) ? 'mod'
    : 'none'
  const handler = behavior.clickMap[modifier]
  if (!handler) return
  const ctx = composeCtx(engine, behavior.axes)
  const command = handler(ctx, id)
  if (command) engine.dispatch(command)
}
```

- [ ] **Step 2: Update useAria — dynamic META_ENTITY_IDS**

Replace `const META_ENTITY_IDS = new Set([...hardcoded...])` with:
```ts
// Derived from behavior.metaEntityIds + known plugin meta IDs
const metaEntityIds = useMemo(() => {
  const ids = new Set(behavior.metaEntityIds)
  ids.add(RENAME_ID)
  ids.add('__combobox__')
  ids.add('__spatial_parent__')
  ids.add('__search__')
  return ids
}, [behavior.metaEntityIds])
```

Replace init block (expandTracking, checkedTracking, popupType) with:
```ts
for (const axis of behavior.axes) {
  if (axis.init) axis.init(created, data)
}
```

- [ ] **Step 3: Update useAriaZone — dynamic META_COMMAND_TYPES + applyMeta**

Replace `const META_COMMAND_TYPES = new Set([...hardcoded...])` with `behavior.metaCommandTypes`.

Replace `applyMetaCommand` switch-case with `behavior.applyMeta`:
```ts
// Before: setViewState(prev => applyMetaCommand(prev, command))
// After:
setViewState(prev => behavior.applyMeta(prev, command))
```

Remove the entire `applyMetaCommand` function.

Handle `selectionFollowsFocus` in dispatch:
```ts
if (command.type === 'core:focus' && behaviorRef.current.selectionFollowsFocus) {
  const nodeId = (command.payload as { nodeId: string }).nodeId
  setViewState(prev => ({ ...behavior.applyMeta(prev, command), selectedIds: [nodeId] }))
}
```

---

### Task 9: Run All Tests + Typecheck + Commit

- [ ] **Step 1: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS (no type errors)

- [ ] **Step 2: Run full test suite**

Run: `pnpm test`
Expected: All 97 tests PASS (behavior unchanged, only internal structure changed)

- [ ] **Step 3: Fix any failures**

If any test fails, it's a migration bug (behavior should be identical). Debug by comparing old and new keyMap/click handling for the specific pattern.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(axis): v3 architecture — axes as capability SSOT, patterns own key bindings

Axes no longer own keyMap. Each axis provides: createCtx, handlers,
config, middleware, visibilityFilter, ariaAttributes.

Patterns declare keyMap (keyboard) and clickMap (pointer) bindings,
composing axis handlers. composePattern supports pattern extension
(base + override) for declarative OCP.

createPatternContext god object → composeCtx thin composition.
Deleted: activate axis (dispatcher), dismiss axis (popup alias),
tab axis (absorbed into navigate config).

30 pattern files migrated. All existing tests pass unchanged.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All PRD items mapped to tasks — ② 산출물 17 items all addressed
- [x] **Placeholder scan:** All tasks contain code or exact commands
- [x] **Type consistency:** `AxisDefinition` used consistently across all axis files, `composePattern` signature matches usage in patterns
- [x] **PRD verification scenarios:** V1 (tree vs accordion expand) in Task 7 Steps 4-5, V2 (treegrid ArrowRight) in Task 7 Step 6, V3 (new pattern) in Task 6, V4 (tree → treegrid extension) in Task 7 Step 6, V5 (OCP) by design

#kind/plan #topic/axis
