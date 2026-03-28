// ② 2026-03-24-isomorphic-layer-tree-prd.md
import type { Entity } from '../store/types'
import type { Command } from '../engine/types'
import type { PatternContext, FocusStrategy, SelectionMode } from '../axis/types'
import type { ValueRange } from '../axis/value'
import type { Middleware, VisibilityFilter } from '../engine/types'

export interface NodeState {
  focused: boolean
  selected: boolean
  disabled: boolean
  index: number
  siblingCount: number
  expanded?: boolean
  level?: number
  valueCurrent?: number
  [key: string]: unknown
}

export interface AriaPattern<TState extends NodeState = NodeState> {
  role: string
  /** ARIA role for each node element. Defaults to the behavior's childRole or 'row'. */
  childRole?: string
  keyMap: Record<string, (ctx: PatternContext) => Command | void>
  focusStrategy: FocusStrategy
  /** When true, all nodes are expandable regardless of children. Used by accordion, disclosure. */
  expandable?: boolean
  /** When true, useAria creates __expanded__ entity at init for getVisibleNodes gating. Set by expand axis. */
  expandTracking?: boolean
  /** Selection mode: 'single' replaces selection, 'multiple' toggles independently. Default: 'multiple' */
  selectionMode?: SelectionMode
  /** When true, clicking a node selects it. Shift+Click = range, Ctrl/Cmd+Click = toggle. Auto-set by select() axis. */
  selectOnClick?: boolean
  /** When true, clicking a node calls activate(). Used by most behaviors except treegrid/dialog. */
  activateOnClick?: boolean
  /** When true, clicking a parent node toggles expand even when onActivate is provided. Default: true (APG File Directory). */
  expandOnParentClick?: boolean
  /** When true, focus change auto-selects (select axis middleware). APG "selection follows focus". */
  selectionFollowsFocus?: boolean
  /** When true, selection change calls onActivate (useAria/useAriaZone). Chain: selection → onActivate. */
  activationFollowsSelection?: boolean
  /** Number of columns for grid navigation. When > 1, PatternContext.grid is populated. */
  colCount?: number
  /** Value range for continuous-value widgets (slider, spinbutton). */
  valueRange?: ValueRange
  /** Middleware composed from axes (e.g. anchorResetMiddleware from select axis) */
  middleware?: Middleware
  /** Visibility filters from axes — getVisibleNodes applies these generically */
  visibilityFilters?: VisibilityFilter[]
  ariaAttributes: (node: Entity, state: TState) => Record<string, string>
}

// Re-export axis types for convenience (pattern consumers often need both)
export type { PatternContext, FocusStrategy, SelectionMode, GridNav, ValueNav } from '../axis/types'
