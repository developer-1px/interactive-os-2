// ② 2026-04-03-command-unification-prd.md
import type { PatternContext, EntityDecl, CtxFactory } from './types'
import type { Command } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { defineCommands } from '../engine/defineCommand'

export const EDIT_ID = '__edit__'

interface EditState {
  active: boolean
  nodeId: string
  value: string
  invalid: boolean
}

function getEditState(store: NormalizedData): EditState {
  const entity = store.entities[EDIT_ID]
  return {
    active: (entity?.active as boolean) ?? false,
    nodeId: (entity?.nodeId as string) ?? '',
    value: (entity?.value as string) ?? '',
    invalid: (entity?.invalid as boolean) ?? false,
  }
}

export const editCommands = defineCommands({
  startEdit: {
    type: 'core:edit-start' as const,
    meta: true,
    create: (nodeId: string, initialValue: string) => ({ nodeId, initialValue }),
    handler: (store, { nodeId, initialValue }) => ({
      ...store,
      entities: {
        ...store.entities,
        [EDIT_ID]: { id: EDIT_ID, active: true, nodeId, value: initialValue, invalid: false },
      },
    }),
  },

  updateEditValue: {
    type: 'core:edit-update' as const,
    meta: true,
    create: (value: string) => ({ value }),
    handler: (store, { value }) => ({
      ...store,
      entities: {
        ...store.entities,
        [EDIT_ID]: { ...store.entities[EDIT_ID]!, id: EDIT_ID, value },
      },
    }),
  },

  setEditInvalid: {
    type: 'core:edit-invalid' as const,
    meta: true,
    create: (invalid: boolean) => ({ invalid }),
    handler: (store, { invalid }) => ({
      ...store,
      entities: {
        ...store.entities,
        [EDIT_ID]: { ...store.entities[EDIT_ID]!, id: EDIT_ID, invalid },
      },
    }),
  },

  commitEdit: {
    type: 'core:edit-commit' as const,
    meta: true,
    handler: (store) => ({
      ...store,
      entities: {
        ...store.entities,
        [EDIT_ID]: { id: EDIT_ID, active: false, nodeId: '', value: '', invalid: false },
      },
    }),
  },

  cancelEdit: {
    type: 'core:edit-cancel' as const,
    meta: true,
    handler: (store) => ({
      ...store,
      entities: {
        ...store.entities,
        [EDIT_ID]: { id: EDIT_ID, active: false, nodeId: '', value: '', invalid: false },
      },
    }),
  },
})

export function editCtx(
  engine: import('../engine/createCommandEngine').CommandEngine,
  focusedId: string,
): import('./types').EditNav {
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
