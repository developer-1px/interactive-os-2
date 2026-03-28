import type { Command } from '../engine/types'
import { ROOT_ID } from '../store/types'
import { definePlugin } from './definePlugin'

const COMBOBOX_ID = '__combobox__'

export const comboboxCommands = {
  open(): Command {
    return {
      type: 'combobox:open',
      execute(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [COMBOBOX_ID]: { ...store.entities[COMBOBOX_ID], id: COMBOBOX_ID, isOpen: true },
          },
        }
      },
    }
  },

  close(): Command {
    return {
      type: 'combobox:close',
      execute(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [COMBOBOX_ID]: { ...store.entities[COMBOBOX_ID], id: COMBOBOX_ID, isOpen: false },
          },
        }
      },
    }
  },

  setFilter(text: string): Command {
    return {
      type: 'combobox:set-filter',
      payload: { text },
      execute(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [COMBOBOX_ID]: { ...store.entities[COMBOBOX_ID], id: COMBOBOX_ID, filterText: text },
          },
        }
      },
    }
  },

  create(label: string): Command {
    const id = `created-${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    return {
      type: 'combobox:create',
      payload: { label },
      execute(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [id]: { id, data: { label } },
          },
          relationships: {
            ...store.relationships,
            [ROOT_ID]: [...(store.relationships[ROOT_ID] ?? []), id],
          },
        }
      },
    }
  },
}

export function combobox() {
  return definePlugin({
    name: 'combobox',
    commands: {
      open: comboboxCommands.open,
      close: comboboxCommands.close,
      setFilter: comboboxCommands.setFilter,
      create: comboboxCommands.create,
    },
  })
}
