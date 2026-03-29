import type { Command } from '../engine/types'
import type { CommandEngine } from '../engine/createCommandEngine'
import { getVisibleNodes } from '../engine/getVisibleNodes'
import type { VisibilityFilter } from '../engine/types'
import type { PatternContext, CtxFactory } from './types'
import { FOCUS_ID } from '../axis/navigate'
import { defineCommands } from '../engine/defineCommand'

function getFocusedId(engine: CommandEngine): string {
  return (engine.getStore().entities[FOCUS_ID]?.focusedId as string) ?? ''
}

// ② 2026-03-29-compose-pattern-3arg-prd.md
const activateCommands = defineCommands({
  activate: {
    type: 'core:activate' as const,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store) => store,
  },
})

export interface PatternContextOptions {
  visibilityFilters?: VisibilityFilter[]
  overrideFocused?: string
  ctxFactories?: CtxFactory[]
}

// ② 2026-03-29-compose-pattern-3arg-prd.md
export function createPatternContext(engine: CommandEngine, options?: PatternContextOptions): PatternContext {
  const focusedId = options?.overrideFocused ?? getFocusedId(engine)

  let _visibleNodes: string[] | null = null
  const visibleNodes = (): string[] => {
    if (!_visibleNodes) _visibleNodes = getVisibleNodes(engine.getStore(), options?.visibilityFilters)
    return _visibleNodes
  }

  // Pure merge — all capabilities come from ctxFactories (navigate, selected, expanded, etc.)
  const merged = (options?.ctxFactories ?? []).reduce<Record<string, unknown>>((acc, factory) => {
    return { ...acc, ...factory(engine, focusedId, visibleNodes) }
  }, {})

  return {
    // activate — always present (pure event, not an axis)
    activate(): Command {
      return activateCommands.activate(focusedId)
    },
    ...merged,
  } as PatternContext
}
