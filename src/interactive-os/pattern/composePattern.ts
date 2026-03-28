import type { Entity } from '../store/types'
import type { Command, Middleware, VisibilityFilter } from '../engine/types'
import type { AriaPattern, NodeState } from './types'
import type { PatternContext, FocusStrategy, KeyMap, Axis, AxisConfig, StructuredAxis } from '../axis/types'
import { extractKeyMap, extractConfig, extractMiddleware, extractVisibilityFilter } from '../axis/types'

export type { Axis, StructuredAxis, KeyMap, AxisConfig }

export interface Identity {
  role: string
  childRole?: string | ((entity: Entity, state: NodeState) => string)
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

  // ② 2026-03-26-core-absorption-prd.md
  // Merge middlewares from axes
  const middlewares: Middleware[] = []
  for (const axis of axes) {
    const mw = extractMiddleware(axis)
    if (mw) middlewares.push(mw)
  }
  const composedMiddleware: Middleware | undefined = middlewares.length === 0
    ? undefined
    : middlewares.length === 1
      ? middlewares[0]
      : (next: (command: Command) => void) => middlewares.reduceRight(
          (acc, mw) => mw(acc),
          next,
        )

  // Collect visibility filters from axes
  const visibilityFilters: VisibilityFilter[] = []
  for (const axis of axes) {
    const vf = extractVisibilityFilter(axis)
    if (vf) visibilityFilters.push(vf)
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
      ...(mergedConfig.checkedTracking !== undefined && { checkedTracking: mergedConfig.checkedTracking }),
      ...(mergedConfig.selectionMode !== undefined && { selectionMode: mergedConfig.selectionMode }),
      ...(mergedConfig.selectOnClick !== undefined && { selectOnClick: mergedConfig.selectOnClick }),
      ...(mergedConfig.activateOnClick !== undefined && { activateOnClick: mergedConfig.activateOnClick }),
      ...(mergedConfig.checkOnClick !== undefined && { checkOnClick: mergedConfig.checkOnClick }),
      ...(mergedConfig.expandOnParentClick !== undefined && { expandOnParentClick: mergedConfig.expandOnParentClick }),
      ...(mergedConfig.selectionFollowsFocus !== undefined && { selectionFollowsFocus: mergedConfig.selectionFollowsFocus }),
      ...(mergedConfig.activationFollowsSelection !== undefined && { activationFollowsSelection: mergedConfig.activationFollowsSelection }),
      ...(mergedConfig.colCount !== undefined && { colCount: mergedConfig.colCount }),
      ...(mergedConfig.valueRange !== undefined && { valueRange: mergedConfig.valueRange }),
      keyMap,
      ...(composedMiddleware && { middleware: composedMiddleware }),
      ...(visibilityFilters.length > 0 && { visibilityFilters }),
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
      ...(mergedConfig.checkedTracking !== undefined && { checkedTracking: mergedConfig.checkedTracking }),
    ...(mergedConfig.selectionMode !== undefined && { selectionMode: mergedConfig.selectionMode }),
    ...(mergedConfig.selectOnClick !== undefined && { selectOnClick: mergedConfig.selectOnClick }),
    ...(mergedConfig.activateOnClick !== undefined && { activateOnClick: mergedConfig.activateOnClick }),
    ...(mergedConfig.checkOnClick !== undefined && { checkOnClick: mergedConfig.checkOnClick }),
    ...(mergedConfig.expandOnParentClick !== undefined && { expandOnParentClick: mergedConfig.expandOnParentClick }),
    ...(mergedConfig.selectionFollowsFocus !== undefined && { selectionFollowsFocus: mergedConfig.selectionFollowsFocus }),
    ...(mergedConfig.activationFollowsSelection !== undefined && { activationFollowsSelection: mergedConfig.activationFollowsSelection }),
    ...(mergedConfig.colCount !== undefined && { colCount: mergedConfig.colCount }),
    ...(mergedConfig.valueRange !== undefined && { valueRange: mergedConfig.valueRange }),
    keyMap,
    ...(composedMiddleware && { middleware: composedMiddleware }),
    ...(visibilityFilters.length > 0 && { visibilityFilters }),
  }
}
