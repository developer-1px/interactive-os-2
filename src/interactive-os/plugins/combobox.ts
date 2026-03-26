import type { Command } from '../engine/types'
import { createBatchCommand } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import { definePlugin } from './definePlugin'
import { selectionCommands } from '../axis/select'

const COMBOBOX_ID = '__combobox__'

function getComboboxState(store: NormalizedData) {
  return {
    isOpen: (store.entities[COMBOBOX_ID]?.isOpen as boolean) ?? false,
    filterText: (store.entities[COMBOBOX_ID]?.filterText as string) ?? '',
  }
}

export const comboboxCommands = {
  open(): Command {
    let prevOpen: boolean
    return {
      type: 'combobox:open',
      payload: null,
      execute(store) {
        prevOpen = getComboboxState(store).isOpen
        return {
          ...store,
          entities: {
            ...store.entities,
            [COMBOBOX_ID]: { ...store.entities[COMBOBOX_ID], id: COMBOBOX_ID, isOpen: true },
          },
        }
      },
      undo(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [COMBOBOX_ID]: { ...store.entities[COMBOBOX_ID], id: COMBOBOX_ID, isOpen: prevOpen },
          },
        }
      },
    }
  },

  close(): Command {
    let prevOpen: boolean
    return {
      type: 'combobox:close',
      payload: null,
      execute(store) {
        prevOpen = getComboboxState(store).isOpen
        return {
          ...store,
          entities: {
            ...store.entities,
            [COMBOBOX_ID]: { ...store.entities[COMBOBOX_ID], id: COMBOBOX_ID, isOpen: false },
          },
        }
      },
      undo(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [COMBOBOX_ID]: { ...store.entities[COMBOBOX_ID], id: COMBOBOX_ID, isOpen: prevOpen },
          },
        }
      },
    }
  },

  setFilter(text: string): Command {
    let prevText: string
    return {
      type: 'combobox:set-filter',
      payload: { text },
      execute(store) {
        prevText = getComboboxState(store).filterText
        return {
          ...store,
          entities: {
            ...store.entities,
            [COMBOBOX_ID]: { ...store.entities[COMBOBOX_ID], id: COMBOBOX_ID, filterText: text },
          },
        }
      },
      undo(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [COMBOBOX_ID]: { ...store.entities[COMBOBOX_ID], id: COMBOBOX_ID, filterText: prevText },
          },
        }
      },
    }
  },

  create(label: string): Command {
    const id = `created-${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    let addedId: string
    return {
      type: 'combobox:create',
      payload: { label },
      execute(store) {
        addedId = id
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
      undo(store) {
        const { [addedId]: _, ...restEntities } = store.entities
        void _
        return {
          ...store,
          entities: restEntities,
          relationships: {
            ...store.relationships,
            [ROOT_ID]: (store.relationships[ROOT_ID] ?? []).filter(i => i !== addedId),
          },
        }
      },
    }
  },
}

export function combobox(options?: { selectionMode?: 'single' | 'multiple' }) {
  const selectionMode = options?.selectionMode ?? 'single'

  return definePlugin({
    name: 'combobox',
    commands: {
      open: comboboxCommands.open,
      close: comboboxCommands.close,
      setFilter: comboboxCommands.setFilter,
      create: comboboxCommands.create,
    },
    keyMap: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ArrowDown: (ctx: any) => {
        const entity = ctx.getEntity('__combobox__')
        const isOpen = (entity as Record<string, unknown> | undefined)?.isOpen === true
        if (!isOpen) {
          ctx.dispatch(comboboxCommands.open())
          return ctx.focusFirst()
        }
        return ctx.focusNext()
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Enter: (ctx: any) => {
        const entity = ctx.getEntity('__combobox__')
        const isOpen = (entity as Record<string, unknown> | undefined)?.isOpen === true
        if (isOpen) {
          if (selectionMode === 'multiple') {
            return ctx.toggleSelect()
          }
          return createBatchCommand([
            selectionCommands.select(ctx.focused),
            comboboxCommands.close(),
          ])
        }
        return comboboxCommands.open()
      },
      Escape: () => comboboxCommands.close(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Backspace: (ctx: any) => {
        if (selectionMode !== 'multiple') return undefined
        const entity = ctx.getEntity('__combobox__')
        const filterText = (entity as Record<string, unknown> | undefined)?.filterText ?? ''
        if (filterText !== '') return undefined
        const selected = ctx.selected
        if (selected.length > 0) {
          return selectionCommands.toggleSelect(selected[selected.length - 1])
        }
        return undefined
      },
    },
  })
}
