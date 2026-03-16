import type { AriaBehavior, NodeState } from './types'
import { comboboxCommands } from '../plugins/combobox'
import { selectionCommands } from '../plugins/core'
import { createBatchCommand } from '../core/types'

export const combobox: AriaBehavior = {
  role: 'combobox',
  childRole: 'option',
  selectionMode: 'single',
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
  },
  focusStrategy: { type: 'aria-activedescendant', orientation: 'vertical' },
  ariaAttributes: (_node, state: NodeState) => ({
    'aria-selected': String(state.selected),
  }),
}
