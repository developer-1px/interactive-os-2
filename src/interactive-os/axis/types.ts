// ② 2026-03-24-isomorphic-layer-tree-prd.md
// axis가 계약을 정의, pattern이 구현
import type { Entity } from '../store/types'
import type { Command } from '../engine/types'
import type { Middleware, VisibilityFilter } from '../engine/types'

export type SelectionMode = 'single' | 'multiple'

export interface GridNav {
  colIndex: number
  colCount: number
  focusNextCol(): Command
  focusPrevCol(): Command
  focusFirstCol(): Command
  focusLastCol(): Command
  focusRow(): Command
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
  orientation?: 'vertical' | 'horizontal' | 'both'
}

// ② 2026-03-29-ctx-axis-namespace-prd.md
/** aria-selected 변화 범주 */
export interface SelectedNav {
  ids: string[]
  toggle(): Command
  range(ids: string[]): Command
  extend(direction: 'next' | 'prev' | 'first' | 'last'): Command
  extendTo(targetId: string, navigableIds?: string[]): Command
}

/** aria-expanded 변화 범주 */
export interface ExpandedNav {
  is: boolean
  set(value: boolean): Command
  toggle(): Command
}

/** aria-checked / aria-pressed 변화 범주 */
export interface CheckedNav {
  is: boolean
  toggle(): Command
}

/** popup open/close 변화 범주 (aria-expanded + focus 복합) */
export interface PopupNav {
  isOpen: boolean
  open(): Command
  close(): Command
}

// ② 2026-03-29-ctx-axis-namespace-prd.md
export interface PatternContext {
  // ── Base (focus + store access + activate event) ──
  focused: string
  focusNext(options?: { wrap?: boolean }): Command
  focusPrev(options?: { wrap?: boolean }): Command
  focusFirst(): Command
  focusLast(): Command
  focusParent(): Command
  focusChild(): Command
  activate(): Command
  dispatch(command: Command): void
  getEntity(id: string): Entity | undefined
  getChildren(id: string): string[]
  getParent(id: string): string | undefined

  // ── aria-* 변화 범주 namespace (optional) ──
  selected?: SelectedNav
  expanded?: ExpandedNav
  checked?: CheckedNav
  popup?: PopupNav
  grid?: GridNav
  value?: ValueNav
}

export type KeyMap = Record<string, (ctx: PatternContext) => Command | void>

/** Modifier-keyed click handler map for declarative click binding. Keys: 'default' | 'shift' | 'ctrl' | 'meta' | 'alt'. */
export type ClickMap = Record<string, (ctx: PatternContext) => Command | void>

// ② 2026-03-29-axis-config-removal-prd.md
/** Declarative entity requirement — axis declares what meta-entities it needs in the store. */
export interface EntityDecl {
  id: string
  default: Record<string, unknown>
}

/** Factory that creates an axis namespace on PatternContext. Called by createPatternContext. */
export type CtxFactory = (engine: import('../engine/createCommandEngine').CommandEngine, focusedId: string, visibleNodes: () => string[]) => Record<string, unknown>

/** Per-node ARIA attribute generator. Called during render for each visible node. */
export type AriaGen = (
  state: Record<string, unknown>,
  entity: Record<string, unknown>,
  childRole: string,
) => Record<string, string>

/** Axis: plain inputMap (key/click bindings) or structured object with entities/middleware/visibilityFilter/ctxFactory. */
export type Axis = KeyMap | {
  keyMap: KeyMap
  entities?: EntityDecl[]
  middleware?: Middleware
  visibilityFilter?: VisibilityFilter
  ctxFactory?: CtxFactory
  /** AriaPattern contributions — composePattern spreads these into the result. OCP: no switch-case. */
  meta?: Record<string, unknown>
  /** Per-node ARIA generation — axis declares how its state maps to aria-* attributes. */
  ariaGen?: AriaGen
}
