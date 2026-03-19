import type { AriaBehavior, NodeState } from './types'
import { comboboxCommands } from '../plugins/combobox'
import { selectionCommands } from '../plugins/core'
import { createBatchCommand } from '../core/types'

export interface ComboboxOptions {
  selectionMode?: 'single' | 'multiple'
}

export function combobox(options?: ComboboxOptions): AriaBehavior {
  const selectionMode = options?.selectionMode ?? 'single'

  return {
    role: 'combobox',
    childRole: 'option',
    selectionMode,
    keyMap: {
      ArrowDown: (ctx) => {
        const comboboxEntity = ctx.getEntity('__combobox__')
        const isOpen = (comboboxEntity as Record<string, unknown> | undefined)?.isOpen ?? false
        if (!isOpen) {
          ctx.dispatch(comboboxCommands.open())
          return ctx.focusFirst()
        }
        return ctx.focusNext()
      },
      ArrowUp: (ctx) => ctx.focusPrev(),
      Enter: (ctx) => {
        const comboboxEntity = ctx.getEntity('__combobox__')
        const isOpen = (comboboxEntity as Record<string, unknown> | undefined)?.isOpen ?? false
        if (isOpen) {
          if (selectionMode === 'multiple') {
            // Toggle selection, keep dropdown open
            return ctx.toggleSelect()
          }
          // Single mode: select + close
          return createBatchCommand([
            selectionCommands.select(ctx.focused),
            comboboxCommands.close(),
          ])
        }
        return comboboxCommands.open()
      },
      Escape: () => comboboxCommands.close(),
      Home: (ctx) => ctx.focusFirst(),
      End: (ctx) => ctx.focusLast(),
      Backspace: (ctx) => {
        if (selectionMode !== 'multiple') return undefined // single: browser native
        const entity = ctx.getEntity('__combobox__')
        const filterText = (entity as Record<string, unknown> | undefined)?.filterText ?? ''
        if (filterText !== '') return undefined // has text: browser native
        const selected = ctx.selected
        if (selected.length > 0) {
          return selectionCommands.toggleSelect(selected[selected.length - 1])
        }
        return undefined
      },
    },
    focusStrategy: { type: 'aria-activedescendant', orientation: 'vertical' },
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-selected': String(state.selected),
    }),
  }
}
