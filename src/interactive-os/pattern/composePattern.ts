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

// Extract AriaPattern metadata from __axisType brands (transitional — auto-ARIA will replace)
function extractAxisMetadata(axes: (Axis | InputMap)[]): Record<string, unknown> {
  const meta: Record<string, unknown> = {}
  for (const axis of axes) {
    const a = axis as Record<string, unknown>
    switch (a.__axisType) {
      case 'navigate': {
        const navType = a.__navType as string
        if (navType === 'activedescendant') {
          meta['focusStrategy'] = { type: 'aria-activedescendant', orientation: 'vertical' }
        } else if (navType === 'natural') {
          meta['focusStrategy'] = { type: 'natural-tab-order', orientation: 'vertical' }
        } else {
          meta['focusStrategy'] = { type: 'roving-tabindex', orientation: navType }
        }
        break
      }
      case 'selected':
        meta['selectionMode'] = a.__mode
        if (a.__followFocus) meta['selectionFollowsFocus'] = true
        break
      case 'expanded':
        meta['expandable'] = true
        break
      case 'popup':
        meta['popupType'] = a.__popupType
        if (a.__popupModal) meta['popupModal'] = true
        break
      case 'value':
        meta['valueRange'] = a.range
        break
      case 'grid':
        meta['colCount'] = a.columns
        break
    }
  }
  return meta
}

// ── Main ──

export function composePattern(config: Identity | AriaPattern | Identity3, ...rest: unknown[]): AriaPattern {
  // ── 3-arg form: composePattern(identity|base, required[], keyMap) ──
  if (rest.length === 2 && Array.isArray(rest[0])) {
    const required = rest[0] as (Axis | InputMap)[]
    const keyMap = rest[1] as Record<string, Handler>
    const axes = required.map(normalizeAxis)

    // AriaPattern base → decorator path
    if ('keyMap' in config) {
      const base = config as AriaPattern
      const { keyMap: baseKM, clickMap: baseCM, middleware: baseMW, visibilityFilters: baseVF, requiredEntities: baseEntities, ...baseProps } = base
      const entities = collectEntities(axes)
      const mergedEntities = baseEntities ? [...baseEntities] : []
      const seen = new Set(mergedEntities.map(e => e.id))
      for (const e of entities) { if (!seen.has(e.id)) { seen.add(e.id); mergedEntities.push(e) } }
      const baseFactories = base.ctxFactories ?? []
      const mergedFactories = [...baseFactories, ...collectCtxFactories(axes)]
      const axisMeta = extractAxisMetadata(required)

      return {
        ...baseProps,
        ...axisMeta,
        ...(mergedEntities.length > 0 && { requiredEntities: mergedEntities }),
        ...(mergedFactories.length > 0 && { ctxFactories: mergedFactories }),
        ...assembleResult(
          mergeKeyMaps([{ keyMap } as unknown as KeyMap, ...axes.map(getKeyMap)].slice(0, 1).concat(axes.map(getKeyMap)), baseKM),
          collectMiddlewares(axes, baseMW),
          collectVisibilityFilters(axes, baseVF),
          baseCM,
        ),
      }
    }

    // Identity3 → direct AriaPattern construction
    const id3 = config as Identity3
    const axisMeta = extractAxisMetadata(required)
    const entities = collectEntities(axes)
    const ctxFactories = collectCtxFactories(axes)
    const middleware = collectMiddlewares(axes)
    const visibilityFilters = collectVisibilityFilters(axes)
    const focusStrategy = (axisMeta['focusStrategy'] as FocusStrategy) ?? DEFAULT_FOCUS_STRATEGY

    // Panel
    if (id3.panel) {
      const hasExpanded = required.some(a => (a as Record<string, unknown>).__axisType === 'expanded')
      axisMeta['panelRole'] = id3.panel
      axisMeta['panelVisibility'] = hasExpanded ? 'expanded' : 'selected'
    }

    const { keyMap: splitKey, clickMap } = splitInputMap(keyMap)

    return {
      role: id3.role,
      childRole: id3.childRole,
      focusStrategy,
      ...(axisMeta['selectionMode'] !== undefined && { selectionMode: axisMeta['selectionMode'] }),
      ...(axisMeta['expandable'] !== undefined && { expandable: axisMeta['expandable'] }),
      ...(axisMeta['popupType'] !== undefined && { popupType: axisMeta['popupType'] }),
      ...(axisMeta['popupModal'] !== undefined && { popupModal: axisMeta['popupModal'] }),
      ...(axisMeta['valueRange'] !== undefined && { valueRange: axisMeta['valueRange'] }),
      ...(axisMeta['colCount'] !== undefined && { colCount: axisMeta['colCount'] }),
      ...(axisMeta['panelRole'] !== undefined && { panelRole: axisMeta['panelRole'] }),
      ...(axisMeta['panelVisibility'] !== undefined && { panelVisibility: axisMeta['panelVisibility'] }),
      ...(axisMeta['selectionFollowsFocus'] !== undefined && { selectionFollowsFocus: axisMeta['selectionFollowsFocus'] }),
      keyMap: mergeKeyMaps(axes.map(getKeyMap).concat([splitKey])),
      ...(Object.keys(clickMap).length > 0 && { clickMap }),
      ...(middleware && { middleware }),
      ...(visibilityFilters.length > 0 && { visibilityFilters }),
      ...(entities.length > 0 && { requiredEntities: entities }),
      ...(ctxFactories.length > 0 && { ctxFactories }),
    } as AriaPattern
  }

  // ── Variadic form (legacy + decorator): composePattern(config, ...axes) ──
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
