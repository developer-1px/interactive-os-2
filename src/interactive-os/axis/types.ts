// ② 2026-03-24-isomorphic-layer-tree-prd.md
// axis가 계약을 정의, pattern이 구현
import type { Entity } from '../store/types'
import type { Command } from '../engine/types'
import type { ValueRange } from '../plugins/core'

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

export interface PatternContext {
  focused: string
  selected: string[]
  isExpanded: boolean

  focusNext(options?: { wrap?: boolean }): Command
  focusPrev(options?: { wrap?: boolean }): Command
  focusFirst(): Command
  focusLast(): Command
  focusParent(): Command
  focusChild(): Command

  expand(): Command
  collapse(): Command
  activate(): Command
  toggleSelect(): Command
  extendSelection(direction: 'next' | 'prev' | 'first' | 'last'): Command
  extendSelectionTo(targetId: string, navigableIds?: string[]): Command

  /** Spatial: enter child container (sets spatial parent) */
  enterChild(parentId: string): Command
  /** Spatial: exit to parent container */
  exitToParent(): Command | undefined
  /** Start inline rename */
  startRename(nodeId: string): Command

  dispatch(command: Command): void

  getEntity(id: string): Entity | undefined
  getChildren(id: string): string[]

  grid?: GridNav
  value?: ValueNav
}

export type KeyMap = Record<string, (ctx: PatternContext) => Command | void>

export interface AxisConfig {
  focusStrategy: FocusStrategy
  tabFocusStrategy: FocusStrategy
  expandable: boolean
  /** When true, useAria creates __expanded__ entity at init so getVisibleNodes gates child visibility. Set by expand axis. */
  expandTracking: boolean
  selectionMode: SelectionMode
  selectOnClick: boolean
  activateOnClick: boolean
  followFocus: boolean
  colCount: number
  valueRange: ValueRange
}

export interface StructuredAxis {
  keyMap: KeyMap
  config?: Partial<AxisConfig>
}

// Axis can be either a plain KeyMap (v1 compat) or a structured object
export type Axis = KeyMap | StructuredAxis

export function isStructuredAxis(axis: Axis): axis is StructuredAxis {
  return 'keyMap' in axis && typeof axis.keyMap === 'object' && !('execute' in axis.keyMap)
}

export function extractKeyMap(axis: Axis): KeyMap {
  return isStructuredAxis(axis) ? axis.keyMap : axis
}

export function extractConfig(axis: Axis): Partial<AxisConfig> | undefined {
  return isStructuredAxis(axis) ? axis.config : undefined
}
