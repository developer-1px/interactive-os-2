// ② 2026-03-24-isomorphic-layer-tree-prd.md
import type React from 'react'
import type { Entity } from '../store/types'
import type { FocusStrategy, SelectionMode, ClickMap, EntityDecl, CtxFactory, KeyHandler } from '../axis/types'
import type { ValueRange } from '../axis/value'
import type { Middleware, VisibilityFilter } from '../engine/types'

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
  /** Slot ARIA props — generated when pattern has panelRole (accordion, tabs). Spread onto slot container. */
  slotProps?: React.HTMLAttributes<HTMLElement>
  [key: string]: unknown
}

// ② 2026-03-29-axis-config-removal-prd.md
export interface AriaPattern<TState extends NodeState = NodeState> {
  role: string
  childRole?: string | ((entity: Entity, state: NodeState) => string)
  keyMap: Record<string, KeyHandler>
  focusStrategy: FocusStrategy
  /** When true, all nodes are expandable regardless of children. Used by accordion, disclosure. */
  expandable?: boolean
  /** Selection mode: 'single' replaces selection, 'multiple' toggles independently. */
  selectionMode?: SelectionMode
  /** Number of columns for grid navigation. When > 1, PatternContext.grid is populated. */
  colCount?: number
  /** Value range for continuous-value widgets (slider, spinbutton). */
  valueRange?: ValueRange
  /** Popup type — when set, trigger node gets aria-haspopup automatically. */
  popupType?: 'menu' | 'listbox' | 'grid' | 'tree' | 'dialog'
  /** When true, popup is modal (aria-modal="true", focus trap). */
  popupModal?: boolean
  /** Panel role — when set, Aria.Panel renders with this ARIA role (tabpanel, region). */
  panelRole?: string
  /** Panel visibility condition — 'selected' for tabs, 'expanded' for accordion. */
  panelVisibility?: 'selected' | 'expanded'
  /** Trigger-specific keyMap — Aria.Trigger binds these instead of the main keyMap. */
  triggerKeyMap?: Record<string, KeyHandler>
  /** Trigger-specific clickMap — modifier → handler for Aria.Trigger clicks. */
  triggerClickMap?: Partial<ClickMap>
  /** Middleware composed from axes (e.g. anchorResetMiddleware from select axis) */
  middleware?: Middleware
  /** Visibility filters from axes — getVisibleNodes applies these generically */
  visibilityFilters?: VisibilityFilter[]
  /** Declarative click bindings from unified inputMap — 'Click', 'Shift+Click', 'Mod+Click' etc. */
  clickMap?: Record<string, KeyHandler>
  ariaAttributes?: (node: Entity, state: TState) => Record<string, string>
  /** Meta-entities that must exist in the store for this pattern to work. Axes declare these. */
  requiredEntities?: EntityDecl[]
  /** Ctx factories from axes — createPatternContext calls these to populate namespace properties. */
  ctxFactories?: CtxFactory[]
  /** Per-node ARIA generators from axes — useAriaView calls these to produce aria-* attributes. OCP. */
  ariaGens?: import('../axis/types').AriaGen[]
  /** Per-node state generators from axes — useAriaView calls these to populate NodeState. OCP. */
  stateGens?: import('../axis/types').StateGen[]
  /** Spatial navigation selector — when set, useAriaView activates DOM-based spatial bridge. */
  spatialSelector?: string | (() => string)
  // Metadata — not used for behavior dispatch, only for external queries (e.g. tests)
  selectionFollowsFocus?: boolean
  activationFollowsSelection?: boolean
}

// Re-export axis types for convenience (pattern consumers often need both)
export type { PatternContext, FocusStrategy, SelectionMode, GridNav, ValueNav, ClickMap, EntityDecl, CtxFactory } from '../axis/types'
