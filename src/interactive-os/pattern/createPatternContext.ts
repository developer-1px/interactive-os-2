import type { Entity } from '../store/types'
import { ROOT_ID } from '../store/types'
import type { Command } from '../engine/types'
import type { CommandEngine } from '../engine/createCommandEngine'
import { getVisibleNodes } from '../engine/getVisibleNodes'
import type { VisibilityFilter } from '../engine/types'
import type { PatternContext, CtxFactory } from './types'
import { getEntity, getChildren, getParent } from '../store/createStore'
import { focusCommands, FOCUS_ID } from '../axis/navigate'
import { defineCommands } from '../engine/defineCommand'

function getFocusedId(engine: CommandEngine): string {
  return (engine.getStore().entities[FOCUS_ID]?.focusedId as string) ?? ''
}

// ② 2026-03-29-ctx-axis-namespace-prd.md
const activateCommands = defineCommands({
  activate: {
    type: 'core:activate' as const,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store) => store, // pure event — no state change, intercepted by keymapHelpers
  },
})

export interface PatternContextOptions {
  visibilityFilters?: VisibilityFilter[]
  /** Override focused node — used by clickMap to set ctx.focused to the clicked node */
  overrideFocused?: string
  /** Ctx factories from axes — called to populate namespace properties on PatternContext */
  ctxFactories?: CtxFactory[]
}

// ② 2026-03-29-compose-pattern-3arg-prd.md
export function createPatternContext(engine: CommandEngine, options?: PatternContextOptions): PatternContext {
  const store = engine.getStore()
  const focusedId = options?.overrideFocused ?? getFocusedId(engine)

  // Lazy-cached visible nodes — computed at most once per context
  let _visibleNodes: string[] | null = null
  const visibleNodes = (): string[] => {
    if (!_visibleNodes) _visibleNodes = getVisibleNodes(store, options?.visibilityFilters)
    return _visibleNodes
  }

  // ── Axis namespace merge — ctxFactories provide all capabilities ──
  const axisNamespaces = (options?.ctxFactories ?? []).reduce<Record<string, unknown>>((acc, factory) => {
    return { ...acc, ...factory(engine, focusedId, visibleNodes) }
  }, {})

  // ── Base: always present (navigate ctxFactory provides these when using 3-arg form) ──
  // Fallback for legacy variadic form where navigate ctxFactory isn't in required[]
  const hasNavigateCtx = 'focused' in axisNamespaces

  const base: Record<string, unknown> = hasNavigateCtx
    ? {}
    : {
        focused: focusedId,
        focusNext(opts?: { wrap?: boolean }): Command {
          const visible = visibleNodes()
          const idx = visible.indexOf(focusedId)
          let nextId: string
          if (opts?.wrap) {
            nextId = visible[(idx + 1) % visible.length] ?? focusedId
          } else {
            nextId = visible[idx + 1] ?? focusedId
          }
          return focusCommands.setFocus(nextId)
        },
        focusPrev(opts?: { wrap?: boolean }): Command {
          const visible = visibleNodes()
          const idx = visible.indexOf(focusedId)
          let prevId: string
          if (opts?.wrap) {
            prevId = visible[(idx - 1 + visible.length) % visible.length] ?? focusedId
          } else {
            prevId = visible[idx - 1] ?? focusedId
          }
          return focusCommands.setFocus(prevId)
        },
        focusFirst(): Command {
          const visible = visibleNodes()
          return focusCommands.setFocus(visible[0] ?? focusedId)
        },
        focusLast(): Command {
          const visible = visibleNodes()
          return focusCommands.setFocus(visible[visible.length - 1] ?? focusedId)
        },
        focusParent(): Command {
          const parentId = getParent(store, focusedId)
          if (!parentId || parentId === ROOT_ID) return focusCommands.setFocus(focusedId)
          return focusCommands.setFocus(parentId)
        },
        focusChild(): Command {
          const children = getChildren(store, focusedId)
          if (children.length === 0) return focusCommands.setFocus(focusedId)
          return focusCommands.setFocus(children[0]!)
        },
        dispatch(command: Command): void {
          engine.dispatch(command)
        },
        getEntity(id: string): Entity | undefined {
          return getEntity(store, id)
        },
        getChildren(id: string): string[] {
          return getChildren(store, id)
        },
        getParent(id: string): string | undefined {
          return getParent(store, id)
        },
      }

  return {
    ...base,
    // activate — always present (pure event, not an axis)
    activate(): Command {
      return activateCommands.activate(focusedId)
    },
    // Axis namespaces from ctxFactories
    ...axisNamespaces,
  } as PatternContext
}
