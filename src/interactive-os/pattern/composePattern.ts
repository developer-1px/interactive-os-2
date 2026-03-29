import type { NormalizedData } from '../store/types'
import type { Entity } from '../store/types'
import type { Command, Middleware, VisibilityFilter } from '../engine/types'
import type { AriaPattern, NodeState } from './types'
import type { PatternContext, FocusStrategy, KeyMap, Axis, EntityDecl, CtxFactory } from '../axis/types'

export interface Identity {
  role: string
  childRole?: string | ((entity: Entity, state: NodeState) => string)
  panel?: string
  // Transitional — auto-ARIA will replace
  ariaAttributes?: (node: Entity, state: NodeState) => Record<string, string>
}

const DEFAULT_FOCUS_STRATEGY: FocusStrategy = {
  type: 'natural-tab-order',
  orientation: 'vertical',
}

// ── Helpers ──

const CLICK_RE = /(?:^|[+])Click$/

function splitInputMap(inputMap: KeyMap): { keyMap: KeyMap; clickMap: KeyMap } {
  const keyMap: KeyMap = {}
  const clickMap: KeyMap = {}
  for (const key of Object.keys(inputMap)) {
    if (CLICK_RE.test(key)) {
      clickMap[key] = inputMap[key]
    } else {
      keyMap[key] = inputMap[key]
    }
  }
  return { keyMap, clickMap }
}

function mergeKeyMaps(keyMaps: KeyMap[]): KeyMap {
  const allKeys = new Set(keyMaps.flatMap(Object.keys))
  const result: KeyMap = {}
  for (const key of allKeys) {
    const handlers = keyMaps.map((km) => km[key]).filter(Boolean)
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

function isStructured(axis: Axis): axis is { keyMap: KeyMap; entities?: EntityDecl[]; middleware?: Middleware; visibilityFilter?: VisibilityFilter; ctxFactory?: CtxFactory; meta?: Record<string, unknown> } {
  return 'keyMap' in axis
}

function getKeyMap(axis: Axis): KeyMap {
  return isStructured(axis) ? axis.keyMap : axis
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

function collectCtxFactories(axes: Axis[]): CtxFactory[] {
  const factories: CtxFactory[] = []
  for (const axis of axes) {
    if (isStructured(axis) && axis.ctxFactory) {
      factories.push(axis.ctxFactory)
    }
  }
  return factories
}

function composeMiddlewares(middlewares: Middleware[]): Middleware | undefined {
  if (middlewares.length === 0) return undefined
  if (middlewares.length === 1) return middlewares[0]
  return (next: (command: Command) => void, getStore: () => NormalizedData) => middlewares.reduceRight(
    (acc, mw) => mw(acc, getStore),
    next,
  )
}

function collectMiddlewares(axes: Axis[]): Middleware | undefined {
  const middlewares: Middleware[] = []
  for (const axis of axes) {
    if (isStructured(axis) && axis.middleware) middlewares.push(axis.middleware)
  }
  return composeMiddlewares(middlewares)
}

function collectVisibilityFilters(axes: Axis[]): VisibilityFilter[] {
  const filters: VisibilityFilter[] = []
  for (const axis of axes) {
    if (isStructured(axis) && axis.visibilityFilter) filters.push(axis.visibilityFilter)
  }
  return filters
}

function collectMeta(axes: Axis[]): Record<string, unknown> {
  const meta: Record<string, unknown> = {}
  for (const axis of axes) {
    if (isStructured(axis) && axis.meta) {
      Object.assign(meta, axis.meta)
    }
  }
  return meta
}

// ── Main ──

export function composePattern(
  config: Identity,
  required: Axis[],
  inputMap: KeyMap,
): AriaPattern {
  const meta = collectMeta(required)
  const { keyMap, clickMap } = splitInputMap(inputMap)
  const entities = collectEntities(required)
  const ctxFactories = collectCtxFactories(required)
  const middleware = collectMiddlewares(required)
  const visibilityFilters = collectVisibilityFilters(required)
  const focusStrategy = (meta.focusStrategy as FocusStrategy) ?? DEFAULT_FOCUS_STRATEGY

  // Panel inference from identity
  if (config.panel) {
    meta.panelRole = config.panel
    meta.panelVisibility = meta.expandable ? 'expanded' : 'selected'
  }

  return {
    role: config.role,
    childRole: config.childRole,
    focusStrategy,
    ...(config.ariaAttributes && { ariaAttributes: config.ariaAttributes }),
    ...(meta.selectionMode !== undefined && { selectionMode: meta.selectionMode }),
    ...(meta.expandable !== undefined && { expandable: meta.expandable }),
    ...(meta.popupType !== undefined && { popupType: meta.popupType }),
    ...(meta.popupModal !== undefined && { popupModal: meta.popupModal }),
    ...(meta.valueRange !== undefined && { valueRange: meta.valueRange }),
    ...(meta.colCount !== undefined && { colCount: meta.colCount }),
    ...(meta.panelRole !== undefined && { panelRole: meta.panelRole }),
    ...(meta.panelVisibility !== undefined && { panelVisibility: meta.panelVisibility }),
    ...(meta.selectionFollowsFocus !== undefined && { selectionFollowsFocus: meta.selectionFollowsFocus }),
    ...(meta.activationFollowsSelection !== undefined && { activationFollowsSelection: meta.activationFollowsSelection }),
    keyMap: mergeKeyMaps(required.map(getKeyMap).concat([keyMap])),
    ...(Object.keys(clickMap).length > 0 && { clickMap }),
    ...(middleware && { middleware }),
    ...(visibilityFilters.length > 0 && { visibilityFilters }),
    ...(entities.length > 0 && { requiredEntities: entities }),
    ...(ctxFactories.length > 0 && { ctxFactories }),
  } as AriaPattern
}
