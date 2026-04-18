var e=`import type { Entity } from '../store/types'
import type { Command } from '../engine/types'
import type { CommandEngine } from '../engine/createCommandEngine'
import { getVisibleNodes } from '../engine/getVisibleNodes'
import type { VisibilityFilter } from '../engine/types'
import type { PatternContext, CtxFactory } from './types'
import { getEntity, getChildren, getSlotChildren, getParent } from '../store/createStore'
import { FOCUS_ID, activateCommands } from '../core'

function getFocusedId(engine: CommandEngine): string {
  return (engine.getStore().entities[FOCUS_ID]?.focusedId as string) ?? ''
}

export interface PatternContextOptions {
  visibilityFilters?: VisibilityFilter[]
  overrideFocused?: string
  ctxFactories?: CtxFactory[]
}

// ② 2026-03-29-compose-pattern-3arg-prd.md
export function createPatternContext(engine: CommandEngine, options?: PatternContextOptions): PatternContext {
  const store = engine.getStore()
  const focusedId = options?.overrideFocused ?? getFocusedId(engine)

  let _visibleNodes: string[] | null = null
  const visibleNodes = (): string[] => {
    if (!_visibleNodes) _visibleNodes = getVisibleNodes(store, options?.visibilityFilters)
    return _visibleNodes
  }

  // Axis capabilities from ctxFactories (navigate, selected, expanded, etc.)
  const axisNamespaces = (options?.ctxFactories ?? []).reduce<Record<string, unknown>>((acc, factory) => {
    return { ...acc, ...factory(engine, focusedId, visibleNodes) }
  }, {})

  return {
    // ── Infrastructure (always present) ──
    focused: focusedId,
    activate: () => activateCommands.activate(focusedId),
    dispatch: (command: Command) => engine.dispatch(command),
    getEntity: (id: string): Entity | undefined => getEntity(store, id),
    getChildren: (id: string): string[] => getChildren(store, id),
    getSlotChildren: (id: string): string[] => getSlotChildren(store, id),
    getParent: (id: string): string | undefined => getParent(store, id),

    // ── Axis capabilities (from ctxFactories) ──
    ...axisNamespaces,
  } as PatternContext
}
`;export{e as default};