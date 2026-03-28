// ② 2026-03-24-isomorphic-layer-tree-prd.md
// axis가 계약을 정의, pattern이 구현
import type { Entity } from '../store/types'
import type { Command } from '../engine/types'
import type { ValueRange } from './value'
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

export interface PatternContext {
  focused: string
  selected: string[]
  isExpanded: boolean
  isChecked: boolean
  isOpen: boolean

  focusNext(options?: { wrap?: boolean }): Command
  focusPrev(options?: { wrap?: boolean }): Command
  focusFirst(): Command
  focusLast(): Command
  focusParent(): Command
  focusChild(): Command

  expand(): Command
  collapse(): Command
  activate(): Command
  toggleCheck(): Command
  open(): Command
  close(): Command
  toggleSelect(): Command
  extendSelection(direction: 'next' | 'prev' | 'first' | 'last'): Command
  extendSelectionTo(targetId: string, navigableIds?: string[]): Command

  dispatch(command: Command): void

  getEntity(id: string): Entity | undefined
  getChildren(id: string): string[]
  getParent(id: string): string | undefined

  grid?: GridNav
  value?: ValueNav
}

export type KeyMap = Record<string, (ctx: PatternContext) => Command | void>

/** Modifier-keyed click handler map for declarative click binding. Keys: 'default' | 'shift' | 'ctrl' | 'meta' | 'alt'. */
export type ClickMap = Record<string, (ctx: PatternContext) => Command | void>

export interface AxisConfig {
  focusStrategy: FocusStrategy
  tabFocusStrategy: FocusStrategy
  expandable: boolean
  /** When true, useAria creates __expanded__ entity at init so getVisibleNodes gates child visibility. Set by expand axis. */
  expandTracking: boolean
  /** When true, useAria creates __checked__ entity at init. Set by checked axis. */
  checkedTracking: boolean
  selectionMode: SelectionMode
  selectOnClick: boolean
  activateOnClick: boolean
  /** When true, clicking a node calls toggleCheck(). Set by checked axis. */
  checkOnClick: boolean
  /** When true, clicking a parent node toggles expand even when onActivate is provided. Default: true. Set by activate({ expandOnClick }). */
  expandOnParentClick: boolean
  selectionFollowsFocus: boolean
  activationFollowsSelection: boolean
  colCount: number
  valueRange: ValueRange
  /** Popup type — when set, trigger gets aria-haspopup and popup behavior. Set by popup axis. */
  popupType: 'menu' | 'listbox' | 'grid' | 'tree' | 'dialog'
  /** When true, popup is modal (focus trap, aria-modal). Set by popup axis. */
  popupModal: boolean
}

/** Axis: plain inputMap (key/click bindings) or structured object with config/middleware. */
export type Axis = KeyMap | {
  keyMap: KeyMap
  config?: Partial<AxisConfig>
  middleware?: Middleware
  visibilityFilter?: VisibilityFilter
}
