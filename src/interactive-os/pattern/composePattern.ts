import type { Entity } from '../store/types'
import type { Command, Middleware, VisibilityFilter } from '../engine/types'
import type { AriaPattern, NodeState } from './types'
import type { PatternContext, FocusStrategy, KeyMap, Axis, AxisConfig } from '../axis/types'

export type { Axis, KeyMap, AxisConfig }

export interface Identity {
  role: string
  childRole?: string | ((entity: Entity, state: NodeState) => string)
  ariaAttributes: (node: Entity, state: NodeState) => Record<string, string>
  // Structural config — declared directly, no config function needed
  focusStrategy?: FocusStrategy
  expandTracking?: boolean
  checkedTracking?: boolean
  selectionMode?: import('../axis/types').SelectionMode
  colCount?: number
  valueRange?: import('./types').ValueRange
  popupType?: 'menu' | 'listbox' | 'grid' | 'tree' | 'dialog'
  popupModal?: boolean
  // ② 2026-03-28-aria-panel-trigger-prd.md
  panelRole?: string
  panelVisibility?: 'selected' | 'expanded'
  triggerKeyMap?: Record<string, (ctx: import('../axis/types').PatternContext) => import('../engine/types').Command | void>
  triggerClickMap?: Partial<import('../axis/types').ClickMap>
}


const DEFAULT_FOCUS_STRATEGY: FocusStrategy = {
  type: 'natural-tab-order',
  orientation: 'vertical',
}

// ── Shared helpers ──

const CLICK_RE = /(?:^|[+])Click$/

function isClickBinding(key: string): boolean {
  return CLICK_RE.test(key)
}

function splitInputMap(inputMap: KeyMap): { keyMap: KeyMap; clickMap: KeyMap } {
  const keyMap: KeyMap = {}
  const clickMap: KeyMap = {}
  for (const key of Object.keys(inputMap)) {
    if (isClickBinding(key)) {
      clickMap[key] = inputMap[key]
    } else {
      keyMap[key] = inputMap[key]
    }
  }
  return { keyMap, clickMap }
}

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
    if (axis.config) Object.assign(merged, axis.config)
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
    if (axis.middleware) middlewares.push(axis.middleware)
  }
  return composeMiddlewares(middlewares)
}

function collectVisibilityFilters(axes: Axis[], base: VisibilityFilter[] = []): VisibilityFilter[] {
  const filters = [...base]
  for (const axis of axes) {
    if (axis.visibilityFilter) filters.push(axis.visibilityFilter)
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
  fullMap: KeyMap,
  middleware: Middleware | undefined,
  visibilityFilters: VisibilityFilter[],
  baseClickMap?: KeyMap,
): Partial<AriaPattern> {
  const { keyMap, clickMap: axisClickMap } = splitInputMap(fullMap)
  const clickMap = (baseClickMap || Object.keys(axisClickMap).length > 0)
    ? { ...baseClickMap, ...axisClickMap }
    : undefined
  return {
    keyMap,
    ...(clickMap && { clickMap }),
    ...(middleware && { middleware }),
    ...(visibilityFilters.length > 0 && { visibilityFilters }),
  }
}

// ── Type guards ──

// ② 2026-03-28-compose-pattern-recursive-prd.md
function isAriaPattern(first: Identity | AriaPattern): first is AriaPattern {
  return 'role' in first && 'keyMap' in first && 'ariaAttributes' in first
}

/** Plain inputMap (flat Record<string, handler>) — no keyMap wrapper */
export type InputMap = Record<string, (ctx: PatternContext) => Command | void>

function isAxis(arg: Axis | InputMap): arg is Axis {
  return 'keyMap' in arg
}

function normalizeAxis(arg: Axis | InputMap): Axis {
  return isAxis(arg) ? arg : { keyMap: arg }
}

// ── Main ──

export function composePattern(config: Identity | AriaPattern, ...rawAxes: (Axis | InputMap)[]): AriaPattern {
  const axes = rawAxes.map(normalizeAxis)
  // AriaPattern base path — pattern-on-pattern recursive override
  if (isAriaPattern(config)) {
    const { keyMap: baseKM, clickMap: baseCM, middleware: baseMW, visibilityFilters: baseVF, ...baseProps } = config
    const axisKeyMaps = axes.map(a => a.keyMap)
    const mergedConfig = mergeAxisConfigs(axes)

    return {
      ...baseProps,
      ...applyAxisConfig(mergedConfig),
      ...assembleResult(
        mergeKeyMaps(axisKeyMaps, baseKM),
        collectMiddlewares(axes, baseMW),
        collectVisibilityFilters(axes, baseVF),
        baseCM,
      ),
    }
  }

  // Identity path
  const axisKeyMaps = axes.map(a => a.keyMap)
  const keyMap = mergeKeyMaps(axisKeyMaps)
  const mergedConfig = mergeAxisConfigs(axes)
  const middleware = collectMiddlewares(axes)
  const visibilityFilters = collectVisibilityFilters(axes)
  // Identity config > axis config > default
  const focusStrategy = config.focusStrategy ?? mergedConfig.tabFocusStrategy ?? mergedConfig.focusStrategy ?? DEFAULT_FOCUS_STRATEGY

  return {
    role: config.role,
    childRole: config.childRole,
    ariaAttributes: config.ariaAttributes,
    focusStrategy,
    ...applyAxisConfig(mergedConfig),
    // Identity structural config overrides axis config
    ...(config.expandTracking !== undefined && { expandTracking: config.expandTracking }),
    ...(config.checkedTracking !== undefined && { checkedTracking: config.checkedTracking }),
    ...(config.selectionMode !== undefined && { selectionMode: config.selectionMode }),
    ...(config.colCount !== undefined && { colCount: config.colCount }),
    ...(config.valueRange !== undefined && { valueRange: config.valueRange }),
    ...(config.popupType !== undefined && { popupType: config.popupType }),
    ...(config.popupModal !== undefined && { popupModal: config.popupModal }),
    ...(config.panelRole !== undefined && { panelRole: config.panelRole }),
    ...(config.panelVisibility !== undefined && { panelVisibility: config.panelVisibility }),
    ...(config.triggerKeyMap !== undefined && { triggerKeyMap: config.triggerKeyMap }),
    ...(config.triggerClickMap !== undefined && { triggerClickMap: config.triggerClickMap }),
    ...assembleResult(keyMap, middleware, visibilityFilters),
  }
}
