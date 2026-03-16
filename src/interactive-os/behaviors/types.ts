import type { Entity, Command } from '../core/types'

export interface FocusStrategy {
  type: 'roving-tabindex' | 'aria-activedescendant'
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

  focusNext(): Command
  focusPrev(): Command
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
  keyMap: Record<string, (ctx: BehaviorContext) => Command | void>
  focusStrategy: FocusStrategy
  ariaAttributes: (node: Entity, state: TState) => Record<string, string>
}
