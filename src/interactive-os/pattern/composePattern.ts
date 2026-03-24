import type { Entity } from '../store/types'
import type { Command } from '../engine/types'
import type { AriaPattern, NodeState } from './types'
import type { PatternContext, FocusStrategy, KeyMap, Axis, AxisConfig } from '../axis/types'
import { extractKeyMap, extractConfig } from '../axis/types'

export interface Identity {
  role: string
  childRole?: string
  ariaAttributes: (node: Entity, state: NodeState) => Record<string, string>
}

// v1 backward compatibility
export type PatternConfig = Omit<AriaPattern, 'keyMap'>

const DEFAULT_FOCUS_STRATEGY: FocusStrategy = {
  type: 'natural-tab-order',
  orientation: 'vertical',
}

function isIdentity(first: Identity | PatternConfig): first is Identity {
  return !('focusStrategy' in first)
}

export function composePattern(config: Identity | PatternConfig, ...axes: Axis[]): AriaPattern {
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
      keyMap[key] = (ctx: PatternContext): Command | void => {
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
    const focusStrategy = mergedConfig.tabFocusStrategy ?? mergedConfig.focusStrategy ?? DEFAULT_FOCUS_STRATEGY

    return {
      role: config.role,
      childRole: config.childRole,
      ariaAttributes: config.ariaAttributes,
      focusStrategy,
      ...(mergedConfig.expandable !== undefined && { expandable: mergedConfig.expandable }),
      ...(mergedConfig.expandTracking !== undefined && { expandTracking: mergedConfig.expandTracking }),
      ...(mergedConfig.selectionMode !== undefined && { selectionMode: mergedConfig.selectionMode }),
      ...(mergedConfig.selectOnClick !== undefined && { selectOnClick: mergedConfig.selectOnClick }),
      ...(mergedConfig.activateOnClick !== undefined && { activateOnClick: mergedConfig.activateOnClick }),
      ...(mergedConfig.followFocus !== undefined && { followFocus: mergedConfig.followFocus }),
      ...(mergedConfig.colCount !== undefined && { colCount: mergedConfig.colCount }),
      ...(mergedConfig.valueRange !== undefined && { valueRange: mergedConfig.valueRange }),
      keyMap,
    }
  }

  // v1 PatternConfig path — backward compatible
  // PatternConfig fields take precedence as base, axis config can override
  return {
    ...(config as PatternConfig),
    ...(mergedConfig.focusStrategy !== undefined && { focusStrategy: mergedConfig.focusStrategy }),
    ...(mergedConfig.tabFocusStrategy !== undefined && { focusStrategy: mergedConfig.tabFocusStrategy }),
    ...(mergedConfig.expandable !== undefined && { expandable: mergedConfig.expandable }),
      ...(mergedConfig.expandTracking !== undefined && { expandTracking: mergedConfig.expandTracking }),
    ...(mergedConfig.selectionMode !== undefined && { selectionMode: mergedConfig.selectionMode }),
    ...(mergedConfig.selectOnClick !== undefined && { selectOnClick: mergedConfig.selectOnClick }),
    ...(mergedConfig.activateOnClick !== undefined && { activateOnClick: mergedConfig.activateOnClick }),
    ...(mergedConfig.followFocus !== undefined && { followFocus: mergedConfig.followFocus }),
    ...(mergedConfig.colCount !== undefined && { colCount: mergedConfig.colCount }),
    ...(mergedConfig.valueRange !== undefined && { valueRange: mergedConfig.valueRange }),
    keyMap,
  }
}
