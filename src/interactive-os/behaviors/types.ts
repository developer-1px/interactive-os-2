import type { Entity, Command } from '../core/types'

export type SelectionMode = 'single' | 'multiple'

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
  level?: number
  [key: string]: unknown
}

export interface BehaviorContext {
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

  dispatch(command: Command): void

  getEntity(id: string): Entity | undefined
  getChildren(id: string): string[]
}

export interface AriaBehavior<TState extends NodeState = NodeState> {
  role: string
  /** ARIA role for each node element. Defaults to the behavior's childRole or 'row'. */
  childRole?: string
  keyMap: Record<string, (ctx: BehaviorContext) => Command | void>
  focusStrategy: FocusStrategy
  /** When true, all nodes are expandable regardless of children. Used by accordion, disclosure. */
  expandable?: boolean
  /** Selection mode: 'single' replaces selection, 'multiple' toggles independently. Default: 'multiple' */
  selectionMode?: SelectionMode
  /** When true, clicking a node calls activate(). Used by most behaviors except treegrid/dialog. */
  activateOnClick?: boolean
  ariaAttributes: (node: Entity, state: TState) => Record<string, string>
}
