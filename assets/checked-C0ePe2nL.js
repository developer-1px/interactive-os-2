var e=`import type { EntityDecl, CheckedNav } from './types'
import type { CommandEngine } from '../engine/createCommandEngine'
import { key } from './types'
import type { NormalizedData } from '../store/types'
import { CHECKED_ID, checkedCommands } from '../core'

// Re-export for backwards compatibility during migration
export { CHECKED_ID, checkedCommands }

function getCheckedIds(store: NormalizedData): string[] {
  return (store.entities[CHECKED_ID]?.checkedIds as string[]) ?? []
}

// ② 2026-03-29-ctx-axis-namespace-prd.md
export function checkedCtx(
  engine: CommandEngine,
  focusedId: string,
): CheckedNav {
  const store = engine.getStore()
  const checkedIds = getCheckedIds(store)
  return {
    is: checkedIds.includes(focusedId),
    toggle: () => checkedCommands.toggleCheck(focusedId),
  }
}

// ② 2026-03-29-compose-pattern-3arg-prd.md
export function checked() {
  const toggle = key(['core:toggle-check'], (ctx) => ctx.checked?.toggle())
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
`;export{e as default};