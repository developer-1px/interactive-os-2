// ② 2026-03-24-isomorphic-layer-tree-prd.md
import type { Entity } from '../store/types'
import type { Command } from '../engine/types'
import type { PatternContext, FocusStrategy, SelectionMode } from '../axis/types'
import type { ValueRange } from '../plugins/core'

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
  /** Selection mode: 'single' replaces selection, 'multiple' toggles independently. Default: 'multiple' */
  selectionMode?: SelectionMode
  /** When true, clicking a node selects it. Shift+Click = range, Ctrl/Cmd+Click = toggle. Auto-set by select() axis. */
  selectOnClick?: boolean
  /** When true, clicking a node calls activate(). Used by most behaviors except treegrid/dialog. */
  activateOnClick?: boolean
  /** When true, focus change auto-triggers onActivate. Per-item opt-out via entity.data.followFocus=false. */
  followFocus?: boolean
  /** Number of columns for grid navigation. When > 1, PatternContext.grid is populated. */
  colCount?: number
  /** Value range for continuous-value widgets (slider, spinbutton). */
  valueRange?: ValueRange
  ariaAttributes: (node: Entity, state: TState) => Record<string, string>
}

// Re-export axis types for convenience (pattern consumers often need both)
export type { PatternContext, FocusStrategy, SelectionMode, GridNav, ValueNav } from '../axis/types'
