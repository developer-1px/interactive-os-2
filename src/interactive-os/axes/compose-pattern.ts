import type { Entity, Command } from '../core/types'
import type {
  AriaBehavior,
  BehaviorContext,
  FocusStrategy,
  NodeState,
  SelectionMode,
} from '../behaviors/types'

export type Axis = Record<string, (ctx: BehaviorContext) => Command | void>

export interface PatternMetadata {
  role: string
  childRole?: string
  focusStrategy: FocusStrategy
  expandable?: boolean
  selectionMode?: SelectionMode
  activateOnClick?: boolean
  followFocus?: boolean
  colCount?: number
  ariaAttributes: (node: Entity, state: NodeState) => Record<string, string>
}

export function composePattern(metadata: PatternMetadata, ...axes: Axis[]): AriaBehavior {
  const allKeys = new Set<string>()
  for (const axis of axes) {
    for (const key of Object.keys(axis)) {
      allKeys.add(key)
    }
  }

  const keyMap: Record<string, (ctx: BehaviorContext) => Command | void> = {}

  for (const key of allKeys) {
    const handlers = axes.map((axis) => axis[key]).filter(Boolean)

    if (handlers.length === 1) {
      keyMap[key] = handlers[0]
    } else {
      keyMap[key] = (ctx: BehaviorContext): Command | void => {
        for (const handler of handlers) {
          const result = handler(ctx)
          if (result !== undefined) {
            return result
          }
        }
        return undefined
      }
    }
  }

  return {
    ...metadata,
    keyMap,
  }
}
