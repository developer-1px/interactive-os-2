var e=`import type { NormalizedData } from '../store/types'
import { defineCommands } from '../engine/defineCommand'

export const EDIT_ID = '__edit__'

interface EditState {
  active: boolean
  nodeId: string
  value: string
  invalid: boolean
}

export function getEditState(store: NormalizedData): EditState {
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
`;export{e as default};