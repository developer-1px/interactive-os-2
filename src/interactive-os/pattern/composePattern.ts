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
  // ② 2026-03-28-aria-panel-trigger-prd.md
  panelRole?: string
  panelVisibility?: 'selected' | 'expanded'
  triggerKeyMap?: Record<string, (ctx: import('../axis/types').PatternContext) => import('../engine/types').Command | void>
  triggerClickMap?: Partial<import('../axis/types').ClickMap>
}

// v1 backward compatibility
export type PatternConfig = Omit<AriaPattern, 'keyMap'>

const DEFAULT_FOCUS_STRATEGY: FocusStrategy = {
  type: 'natural-tab-order',
  orientation: 'vertical',
}

// ── Shared helpers ──

function mergeKeyMaps(keyMaps: KeyMap[], baseKeyMap?: KeyMap): KeyMap {
  const allKeys = new Set(keyMaps.flatMap(Object.keys))
  if (baseKeyMap) for (const key of Object.keys(baseKeyMap)) allKeys.add(key)

  const result: KeyMap = {}
  for (const key of allKeys) {
    const axisHandlers = keyMaps.map((km) => km[key]).filter(Boolean)
    const baseHandler = baseKeyMap?.[key]
    const handlers = baseHandler ? [...axisHandlers, baseHandler] : axisHandlers

    if (handlers.length === 1) {
      result[key] = handlers[0]
    } else if (handlers.length > 1) {
      result[key] = (ctx: PatternContext): Command | void => {
        for (const handler of handlers) {
          const r = handler(ctx)
          if (r !== undefined) return r
        }
        return undefined
      }
    }
  }
  return result
}

function mergeAxisConfigs(axes: Axis[]): Partial<AxisConfig> {
  const merged: Partial<AxisConfig> = {}
  for (const axis of axes) {
    const c = extractConfig(axis)
    if (c) Object.assign(merged, c)
  }
  return merged
}

function composeMiddlewares(middlewares: Middleware[]): Middleware | undefined {
  if (middlewares.length === 0) return undefined
  if (middlewares.length === 1) return middlewares[0]
  return (next: (command: Command) => void) => middlewares.reduceRight(
    (acc, mw) => mw(acc),
    next,
  )
}

function collectMiddlewares(axes: Axis[], base?: Middleware): Middleware | undefined {
  const middlewares: Middleware[] = []
  if (base) middlewares.push(base)
  for (const axis of axes) {
    const mw = extractMiddleware(axis)
    if (mw) middlewares.push(mw)
  }
  return composeMiddlewares(middlewares)
}

function collectVisibilityFilters(axes: Axis[], base: VisibilityFilter[] = []): VisibilityFilter[] {
  const filters = [...base]
  for (const axis of axes) {
    const vf = extractVisibilityFilter(axis)
    if (vf) filters.push(vf)
  }
  return filters
}

function applyAxisConfig(mergedConfig: Partial<AxisConfig>): Partial<AriaPattern> {
  return {
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
    ...(mergedConfig.popupType !== undefined && { popupType: mergedConfig.popupType }),
    ...(mergedConfig.popupModal !== undefined && { popupModal: mergedConfig.popupModal }),
  }
}

function assembleResult(
  keyMap: KeyMap,
  middleware: Middleware | undefined,
  visibilityFilters: VisibilityFilter[],
): Partial<AriaPattern> {
  return {
    keyMap,
    ...(middleware && { middleware }),
    ...(visibilityFilters.length > 0 && { visibilityFilters }),
  }
}

// ── Type guards ──

// ② 2026-03-28-compose-pattern-recursive-prd.md
function isAriaPattern(first: Identity | PatternConfig | AriaPattern): first is AriaPattern {
  return 'role' in first && 'keyMap' in first && 'ariaAttributes' in first
}

function isIdentity(first: Identity | PatternConfig): first is Identity {
  return !('focusStrategy' in first)
}

// ── Main ──

export function composePattern(config: Identity | PatternConfig | AriaPattern, ...axes: Axis[]): AriaPattern {
  // AriaPattern base path — pattern-on-pattern recursive override
  if (isAriaPattern(config)) {
    const { keyMap: baseKM, middleware: baseMW, visibilityFilters: baseVF, ...baseProps } = config
    const axisKeyMaps = axes.map(extractKeyMap)
    const mergedConfig = mergeAxisConfigs(axes)

    return {
      ...baseProps,
      ...applyAxisConfig(mergedConfig),
      ...assembleResult(
        mergeKeyMaps(axisKeyMaps, baseKM),
        collectMiddlewares(axes, baseMW),
        collectVisibilityFilters(axes, baseVF),
      ),
    }
  }

  // Identity / PatternConfig paths
  const axisKeyMaps = axes.map(extractKeyMap)
  const keyMap = mergeKeyMaps(axisKeyMaps)
  const mergedConfig = mergeAxisConfigs(axes)
  const middleware = collectMiddlewares(axes)
  const visibilityFilters = collectVisibilityFilters(axes)

  if (isIdentity(config)) {
    const focusStrategy = mergedConfig.tabFocusStrategy ?? mergedConfig.focusStrategy ?? DEFAULT_FOCUS_STRATEGY

    return {
      role: config.role,
      childRole: config.childRole,
      ariaAttributes: config.ariaAttributes,
      focusStrategy,
      ...applyAxisConfig(mergedConfig),
      ...(config.panelRole !== undefined && { panelRole: config.panelRole }),
      ...(config.panelVisibility !== undefined && { panelVisibility: config.panelVisibility }),
      ...(config.triggerKeyMap !== undefined && { triggerKeyMap: config.triggerKeyMap }),
      ...(config.triggerClickMap !== undefined && { triggerClickMap: config.triggerClickMap }),
      ...assembleResult(keyMap, middleware, visibilityFilters),
    }
  }

  // v1 PatternConfig path — backward compatible
  return {
    ...(config as PatternConfig),
    ...applyAxisConfig(mergedConfig),
    ...assembleResult(keyMap, middleware, visibilityFilters),
  }
}
