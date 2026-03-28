import { createBatchCommand } from '../engine/types'
import { ROOT_ID } from '../store/types'
import { definePlugin } from './definePlugin'
import { defineCommands } from '../engine/defineCommand'
import { selectionCommands } from '../axis/select'

const COMBOBOX_ID = '__combobox__'

export const comboboxCommands = defineCommands({
  open: {
    type: 'combobox:open' as const,
    handler: (store) => ({
      ...store,
      entities: {
        ...store.entities,
        [COMBOBOX_ID]: { ...store.entities[COMBOBOX_ID], id: COMBOBOX_ID, isOpen: true },
      },
    }),
  },

  close: {
    type: 'combobox:close' as const,
    handler: (store) => ({
      ...store,
      entities: {
        ...store.entities,
        [COMBOBOX_ID]: { ...store.entities[COMBOBOX_ID], id: COMBOBOX_ID, isOpen: false },
        __focus__: { id: '__focus__', focusedId: '' },
      },
    }),
  },

  setFilter: {
    type: 'combobox:set-filter' as const,
    create: (text: string) => ({ text }),
    handler: (store, { text }) => ({
      ...store,
      entities: {
        ...store.entities,
        [COMBOBOX_ID]: { ...store.entities[COMBOBOX_ID], id: COMBOBOX_ID, filterText: text },
      },
    }),
  },

  create: {
    type: 'combobox:create' as const,
    create: (label: string) => {
      const id = `created-${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
      return { label, id }
    },
    handler: (store, { label, id }) => ({
      ...store,
      entities: {
        ...store.entities,
        [id]: { id, data: { label } },
      },
      relationships: {
        ...store.relationships,
        [ROOT_ID]: [...(store.relationships[ROOT_ID] ?? []), id],
      },
    }),
  },
})

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
