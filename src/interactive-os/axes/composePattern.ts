import type { Entity, Command } from '../core/types'
import type { AriaBehavior, BehaviorContext, FocusStrategy, SelectionMode, NodeState } from '../behaviors/types'

export type KeyMap = Record<string, (ctx: BehaviorContext) => Command | void>

export interface AxisConfig {
  focusStrategy: FocusStrategy
  expandable: boolean
  selectionMode: SelectionMode
  activateOnClick: boolean
  followFocus: boolean
  colCount: number
}

export interface StructuredAxis {
  keyMap: KeyMap
  config?: Partial<AxisConfig>
}

// Axis can be either a plain KeyMap (v1 compat) or a structured object
export type Axis = KeyMap | StructuredAxis

export interface Identity {
  role: string
  childRole?: string
  ariaAttributes: (node: Entity, state: NodeState) => Record<string, string>
}

// v1 backward compatibility
export type PatternConfig = Omit<AriaBehavior, 'keyMap'>

export function isStructuredAxis(axis: Axis): axis is StructuredAxis {
  return 'keyMap' in axis && typeof axis.keyMap === 'object' && !('execute' in axis.keyMap)
}

export function extractKeyMap(axis: Axis): KeyMap {
  return isStructuredAxis(axis) ? axis.keyMap : axis
}

export function extractConfig(axis: Axis): Partial<AxisConfig> | undefined {
  return isStructuredAxis(axis) ? axis.config : undefined
}

const DEFAULT_FOCUS_STRATEGY: FocusStrategy = {
  type: 'natural-tab-order',
  orientation: 'vertical',
}

function isIdentity(first: Identity | PatternConfig): first is Identity {
  return !('focusStrategy' in first)
}

export function composePattern(config: Identity | PatternConfig, ...axes: Axis[]): AriaBehavior {
  // Merge keyMaps from all axes
  const allKeys = new Set<string>()
  const keyMaps = axes.map(extractKeyMap)
  for (const km of keyMaps) {
    for (const key of Object.keys(km)) {
      allKeys.add(key)
    }
  }

  const keyMap: KeyMap = {}
  for (const key of allKeys) {
    const handlers = keyMaps.map((km) => km[key]).filter(Boolean)

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

  // Merge config from structured axes (later overwrites earlier)
  let mergedConfig: Partial<AxisConfig> = {}
  for (const axis of axes) {
    const axisConfig = extractConfig(axis)
    if (axisConfig) {
      mergedConfig = { ...mergedConfig, ...axisConfig }
    }
  }

  // Build behavior
  if (isIdentity(config)) {
    // v2 Identity path
    const focusStrategy = mergedConfig.focusStrategy ?? DEFAULT_FOCUS_STRATEGY

    return {
      role: config.role,
      childRole: config.childRole,
      ariaAttributes: config.ariaAttributes,
      focusStrategy,
      ...(mergedConfig.expandable !== undefined && { expandable: mergedConfig.expandable }),
      ...(mergedConfig.selectionMode !== undefined && { selectionMode: mergedConfig.selectionMode }),
      ...(mergedConfig.activateOnClick !== undefined && { activateOnClick: mergedConfig.activateOnClick }),
      ...(mergedConfig.followFocus !== undefined && { followFocus: mergedConfig.followFocus }),
      ...(mergedConfig.colCount !== undefined && { colCount: mergedConfig.colCount }),
      keyMap,
    }
  }

  // v1 PatternConfig path — backward compatible
  // PatternConfig fields take precedence as base, axis config can override
  return {
    ...config,
    ...(mergedConfig.focusStrategy !== undefined && { focusStrategy: mergedConfig.focusStrategy }),
    ...(mergedConfig.expandable !== undefined && { expandable: mergedConfig.expandable }),
    ...(mergedConfig.selectionMode !== undefined && { selectionMode: mergedConfig.selectionMode }),
    ...(mergedConfig.activateOnClick !== undefined && { activateOnClick: mergedConfig.activateOnClick }),
    ...(mergedConfig.followFocus !== undefined && { followFocus: mergedConfig.followFocus }),
    ...(mergedConfig.colCount !== undefined && { colCount: mergedConfig.colCount }),
    keyMap,
  }
}
