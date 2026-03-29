import type { PatternContext, EntityDecl } from './types'
import type { Command } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { defineCommands } from '../engine/defineCommand'

// ② 2026-03-29-define-command-prd.md
export const CHECKED_ID = '__checked__'

function getCheckedIds(store: NormalizedData): string[] {
  return (store.entities[CHECKED_ID]?.checkedIds as string[]) ?? []
}

export const checkedCommands = defineCommands({
  check: {
    type: 'core:check' as const,
    meta: true,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const current = getCheckedIds(store)
      if (current.includes(nodeId)) return store
      return {
        ...store,
        entities: {
          ...store.entities,
          [CHECKED_ID]: { id: CHECKED_ID, checkedIds: [...current, nodeId] },
        },
      }
    },
  },

  uncheck: {
    type: 'core:uncheck' as const,
    meta: true,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const current = getCheckedIds(store)
      return {
        ...store,
        entities: {
          ...store.entities,
          [CHECKED_ID]: { id: CHECKED_ID, checkedIds: current.filter((id) => id !== nodeId) },
        },
      }
    },
  },

  toggleCheck: {
    type: 'core:toggle-check' as const,
    meta: true,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const current = getCheckedIds(store)
      const checkedIds = current.includes(nodeId)
        ? current.filter((id) => id !== nodeId)
        : [...current, nodeId]
      return {
        ...store,
        entities: {
          ...store.entities,
          [CHECKED_ID]: { id: CHECKED_ID, checkedIds },
        },
      }
    },
  },
})


// ② 2026-03-29-ctx-axis-namespace-prd.md
export function checkedCtx(
  engine: import('../engine/createCommandEngine').CommandEngine,
  focusedId: string,
): import('./types').CheckedNav {
  const store = engine.getStore()
  const checkedIds = getCheckedIds(store)
  return {
    is: checkedIds.includes(focusedId),
    toggle: () => checkedCommands.toggleCheck(focusedId),
  }
}

// ② 2026-03-29-compose-pattern-3arg-prd.md
export function checked() {
  const toggle = (ctx: PatternContext): Command | void => ctx.checked?.toggle()
  return {
    keyMap: {} as Record<string, never>,
    entities: [{ id: CHECKED_ID, default: { checkedIds: [] } }] as EntityDecl[],
    ctxFactory: ((engine, focusedId) => ({
      checked: checkedCtx(engine, focusedId),
    })) as import('./types').CtxFactory,
    stateGen: ((id, store, children) => {
      const checkedIds = getCheckedIds(store)
      const directChecked = checkedIds.includes(id)
      if (children.length === 0) return { checked: directChecked }
      const checkedCount = children.filter(c => checkedIds.includes(c)).length
      if (checkedCount === 0) return { checked: false }
      if (checkedCount === children.length) return { checked: true }
      return { checked: 'mixed' as const }
    }) as import('./types').StateGen,
    ariaGen: ((s, _e, role) => {
      if (s.checked === undefined) return {}
      const attr = role === 'button' ? 'aria-pressed' : 'aria-checked'
      return { [attr]: String(s.checked) }
    }) as import('./types').AriaGen,
    toggle,
  }
}
