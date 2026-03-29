import type { Entity, NormalizedData } from '../store/types'
import type { Command, Middleware, VisibilityFilter } from '../engine/types'
import type { AriaPattern, NodeState } from './types'
import type { PatternContext, FocusStrategy, KeyMap, Axis, EntityDecl, CtxFactory } from '../axis/types'

export type { Axis, KeyMap, EntityDecl, CtxFactory }

export interface Identity {
  role: string
  childRole?: string | ((entity: Entity, state: NodeState) => string)
  ariaAttributes?: (node: Entity, state: NodeState) => Record<string, string>
  focusStrategy?: FocusStrategy
  selectionMode?: import('../axis/types').SelectionMode
  colCount?: number
  valueRange?: import('../axis/value').ValueRange
  popupType?: 'menu' | 'listbox' | 'grid' | 'tree' | 'dialog'
  popupModal?: boolean
  expandable?: boolean
  visibilityFilter?: VisibilityFilter
  middleware?: Middleware
  panelRole?: string
  panelVisibility?: 'selected' | 'expanded'
  triggerKeyMap?: Record<string, (ctx: import('../axis/types').PatternContext) => import('../engine/types').Command | void>
  triggerClickMap?: Partial<import('../axis/types').ClickMap>
  // Metadata — not used for behavior dispatch, only for external queries
  selectionFollowsFocus?: boolean
  activationFollowsSelection?: boolean
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

// ② 2026-03-29-axis-config-removal-prd.md
function isStructured(axis: Axis): axis is { keyMap: KeyMap; entities?: EntityDecl[]; middleware?: Middleware; visibilityFilter?: VisibilityFilter; ctxFactory?: CtxFactory } {
  return 'keyMap' in axis
}

function getKeyMap(axis: Axis): KeyMap {
  return isStructured(axis) ? axis.keyMap : axis
}

// ② 2026-03-29-ctx-axis-namespace-prd.md
function collectCtxFactories(axes: Axis[]): CtxFactory[] {
  const factories: CtxFactory[] = []
  for (const axis of axes) {
    if (isStructured(axis) && axis.ctxFactory) {
      factories.push(axis.ctxFactory)
    }
  }
  return factories
}

function collectEntities(axes: Axis[]): EntityDecl[] {
  const entities: EntityDecl[] = []
  const seen = new Set<string>()
  for (const axis of axes) {
    if (isStructured(axis) && axis.entities) {
      for (const e of axis.entities) {
        if (!seen.has(e.id)) {
          seen.add(e.id)
          entities.push(e)
        }
      }
    }
  }
  return entities
}

function composeMiddlewares(middlewares: Middleware[]): Middleware | undefined {
  if (middlewares.length === 0) return undefined
  if (middlewares.length === 1) return middlewares[0]
  return (next: (command: Command) => void, getStore: () => NormalizedData) => middlewares.reduceRight(
    (acc, mw) => mw(acc, getStore),
    next,
  )
}

function collectMiddlewares(axes: Axis[], base?: Middleware): Middleware | undefined {
  const middlewares: Middleware[] = []
  if (base) middlewares.push(base)
  for (const axis of axes) {
    if (isStructured(axis) && axis.middleware) middlewares.push(axis.middleware)
  }
  return composeMiddlewares(middlewares)
}

function collectVisibilityFilters(axes: Axis[], base: VisibilityFilter[] = []): VisibilityFilter[] {
  const filters = [...base]
  for (const axis of axes) {
    if (isStructured(axis) && axis.visibilityFilter) filters.push(axis.visibilityFilter)
  }
  return filters
}

function assembleResult(
  fullMap: KeyMap,
  middleware: Middleware | undefined,
  visibilityFilters: VisibilityFilter[],
  baseClickMap?: KeyMap,
): Pick<AriaPattern, 'keyMap'> & Partial<AriaPattern> {
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
  return 'role' in first && 'keyMap' in first && 'focusStrategy' in first
}

/** Plain inputMap (flat Record<string, handler>) — no keyMap wrapper */
export type InputMap = Record<string, (ctx: PatternContext) => Command | void>

function isAxis(arg: Axis | InputMap): arg is Axis {
  return 'keyMap' in arg
}

function normalizeAxis(arg: Axis | InputMap): Axis {
  return isAxis(arg) ? arg : { keyMap: arg }
}

// ── 3-arg form: composePattern(identity, required[], keyMap) ──
// ② 2026-03-29-compose-pattern-3arg-prd.md

interface Identity3 {
  role: string
  childRole?: string | ((entity: Entity, state: NodeState) => string)
  panel?: string
}

type Handler = (ctx: PatternContext) => Command | void

// ── Main ──

export function composePattern(identity: Identity3, required: (Axis | InputMap)[], keyMap: Record<string, Handler>): AriaPattern
export function composePattern(base: AriaPattern, required: (Axis | InputMap)[], keyMap: Record<string, Handler>): AriaPattern
export function composePattern(config: Identity | AriaPattern, ...rawAxes: (Axis | InputMap)[]): AriaPattern
export function composePattern(config: Identity | AriaPattern | Identity3, ...rest: unknown[]): AriaPattern {
  // 3-arg form: (identity/base, required[], keyMap)
  if (rest.length === 2 && Array.isArray(rest[0])) {
    const required = rest[0] as (Axis | InputMap)[]
    const keyMap = rest[1] as Record<string, Handler>

    // Extract AriaPattern metadata from axis __axisType brands (transitional — auto-ARIA will replace)
    const axisMetadata: Record<string, unknown> = {}
    for (const axis of required) {
      const a = axis as Record<string, unknown>
      switch (a.__axisType) {
        case 'navigate': {
          const navType = a.__navType as string
          if (navType === 'activedescendant') {
            axisMetadata['focusStrategy'] = { type: 'aria-activedescendant', orientation: 'vertical' }
          } else if (navType === 'natural') {
            axisMetadata['focusStrategy'] = { type: 'natural-tab-order', orientation: 'vertical' }
          } else {
            axisMetadata['focusStrategy'] = { type: 'roving-tabindex', orientation: navType }
          }
          break
        }
        case 'selected':
          axisMetadata['selectionMode'] = a.__mode
          if (a.__followFocus) axisMetadata['selectionFollowsFocus'] = true
          break
        case 'expanded':
          axisMetadata['expandable'] = true
          break
        case 'checked':
          // checkedTracking is derived from entity presence in useAriaView
          break
        case 'popup':
          axisMetadata['popupType'] = a.__popupType
          if (a.__popupModal) axisMetadata['popupModal'] = true
          break
        case 'value':
          axisMetadata['valueRange'] = a.range
          break
        case 'grid':
          axisMetadata['colCount'] = a.columns
          break
      }
    }

    // Panel metadata from Identity3
    const id3 = config as Identity3
    if (id3.panel) {
      const hasExpanded = required.some(a => (a as Record<string, unknown>).__axisType === 'expanded')
      axisMetadata['panelRole'] = id3.panel
      axisMetadata['panelVisibility'] = hasExpanded ? 'expanded' : 'selected'
    }

    // Delegate to variadic form: axes from required + keyMap as InputMap
    if (isAriaPattern(config as Identity | AriaPattern)) {
      return composePattern(config as AriaPattern, ...required, keyMap as InputMap)
    }

    // Build Identity from Identity3 + axis metadata
    const fullIdentity: Identity = {
      role: (config as Identity3).role,
      childRole: (config as Identity3).childRole,
      ...axisMetadata,
    }

    return composePattern(fullIdentity, ...required, keyMap as InputMap)
  }

  // Variadic form (legacy): composePattern(config, ...axes)
  const rawAxes = rest as (Axis | InputMap)[]
  const config_ = config as Identity | AriaPattern
  const axes = rawAxes.map(normalizeAxis)
  const entities = collectEntities(axes)

  // AriaPattern base path — pattern-on-pattern recursive override
  if (isAriaPattern(config_)) {
    const { keyMap: baseKM, clickMap: baseCM, middleware: baseMW, visibilityFilters: baseVF, requiredEntities: baseEntities, ...baseProps } = config_
    const mergedEntities = baseEntities ? [...baseEntities] : []
    const seen = new Set(mergedEntities.map(e => e.id))
    for (const e of entities) {
      if (!seen.has(e.id)) { seen.add(e.id); mergedEntities.push(e) }
    }

    const baseFactories = (config_ as AriaPattern).ctxFactories ?? []
    const mergedFactories = [...baseFactories, ...collectCtxFactories(axes)]

    return {
      ...baseProps,
      ...(mergedEntities.length > 0 && { requiredEntities: mergedEntities }),
      ...(mergedFactories.length > 0 && { ctxFactories: mergedFactories }),
      ...assembleResult(
        mergeKeyMaps(axes.map(getKeyMap), baseKM),
        collectMiddlewares(axes, baseMW),
        collectVisibilityFilters(axes, baseVF),
        baseCM,
      ),
    }
  }

  // Identity path
  const axisKeyMaps = axes.map(getKeyMap)
  const keyMap = mergeKeyMaps(axisKeyMaps)
  const middleware = collectMiddlewares(axes, config_.middleware)
  const baseFilters = config_.visibilityFilter ? [config_.visibilityFilter] : []
  const visibilityFilters = collectVisibilityFilters(axes, baseFilters)
  const focusStrategy = config_.focusStrategy ?? DEFAULT_FOCUS_STRATEGY

  return {
    role: config_.role,
    childRole: config_.childRole,
    ariaAttributes: config_.ariaAttributes,
    focusStrategy,
    ...(config_.expandable !== undefined && { expandable: config_.expandable }),
    ...(config_.selectionMode !== undefined && { selectionMode: config_.selectionMode }),
    ...(config_.colCount !== undefined && { colCount: config_.colCount }),
    ...(config_.valueRange !== undefined && { valueRange: config_.valueRange }),
    ...(config_.popupType !== undefined && { popupType: config_.popupType }),
    ...(config_.popupModal !== undefined && { popupModal: config_.popupModal }),
    ...(config_.panelRole !== undefined && { panelRole: config_.panelRole }),
    ...(config_.panelVisibility !== undefined && { panelVisibility: config_.panelVisibility }),
    ...(config_.triggerKeyMap !== undefined && { triggerKeyMap: config_.triggerKeyMap }),
    ...(config_.triggerClickMap !== undefined && { triggerClickMap: config_.triggerClickMap }),
    ...(config_.selectionFollowsFocus !== undefined && { selectionFollowsFocus: config_.selectionFollowsFocus }),
    ...(config_.activationFollowsSelection !== undefined && { activationFollowsSelection: config_.activationFollowsSelection }),
    ...(entities.length > 0 && { requiredEntities: entities }),
    ...(() => { const f = collectCtxFactories(axes); return f.length > 0 ? { ctxFactories: f } : {} })(),
    ...assembleResult(keyMap, middleware, visibilityFilters),
  }
}
