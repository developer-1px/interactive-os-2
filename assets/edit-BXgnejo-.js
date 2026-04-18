var e=`// ② 2026-04-03-command-unification-prd.md
import type { PatternContext, EntityDecl, CtxFactory, EditNav } from './types'
import type { CommandEngine } from '../engine/createCommandEngine'
import type { Command } from '../engine/types'
import { EDIT_ID, editCommands, getEditState } from '../core'

// Re-export for backwards compatibility during migration
export { EDIT_ID, editCommands }

export function editCtx(
  engine: CommandEngine,
  focusedId: string,
): EditNav {
  const state = getEditState(engine.getStore())
  return {
    active: state.active && state.nodeId === focusedId,
    value: state.value,
    invalid: state.invalid,
    start: (initialValue: string) => editCommands.startEdit(focusedId, initialValue),
    update: (value: string) => editCommands.updateEditValue(value),
    commit: () => editCommands.commitEdit(),
    cancel: () => editCommands.cancelEdit(),
    setInvalid: (invalid: boolean) => editCommands.setEditInvalid(invalid),
  }
}

export function edit() {
  const start = (initialValue: string) => (ctx: PatternContext): Command | void =>
    ctx.edit?.start(initialValue)
  const commit = (ctx: PatternContext): Command | void => ctx.edit?.commit()
  const cancel = (ctx: PatternContext): Command | void => ctx.edit?.cancel()

  return {
    keyMap: {} as Record<string, never>,
    entities: [{ id: EDIT_ID, default: { active: false, nodeId: '', value: '', invalid: false } }] as EntityDecl[],
    ctxFactory: ((engine, focusedId) => ({
      edit: editCtx(engine, focusedId),
    })) as CtxFactory,
    stateGen: ((id, store) => {
      const state = getEditState(store)
      return state.active && state.nodeId === id
        ? { editing: true, editValue: state.value, editInvalid: state.invalid }
        : { editing: false }
    }) as import('./types').StateGen,
    start,
    commit,
    cancel,
  }
}
`;export{e as default};