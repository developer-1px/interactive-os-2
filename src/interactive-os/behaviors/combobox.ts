import type { AriaBehavior, NodeState } from './types'
import type { Axis } from '../axes/composePattern'
import { composePattern } from '../axes/composePattern'
import { navV } from '../axes/navV'
import { comboboxCommands } from '../plugins/combobox'
import { selectionCommands } from '../plugins/core'
import { createBatchCommand } from '../core/types'

export interface ComboboxOptions {
  selectionMode?: 'single' | 'multiple'
}

export function combobox(options?: ComboboxOptions): AriaBehavior {
  const selectionMode = options?.selectionMode ?? 'single'

  function getIsOpen(ctx: Parameters<Axis[string]>[0]): boolean {
    const comboboxEntity = ctx.getEntity('__combobox__')
    return (comboboxEntity as Record<string, unknown> | undefined)?.isOpen === true
  }

  const popupToggle: Axis = {
    ArrowDown: (ctx) => {
      if (!getIsOpen(ctx)) {
        ctx.dispatch(comboboxCommands.open())
        return ctx.focusFirst()
      }
      return undefined // fallback to navV
    },
    Enter: (ctx) => {
      const isOpen = getIsOpen(ctx)
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
    Backspace: (ctx) => {
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
  }

  return composePattern(
    {
      role: 'combobox',
      childRole: 'option',
      selectionMode,
      focusStrategy: { type: 'aria-activedescendant', orientation: 'vertical' },
      ariaAttributes: (_node, state: NodeState) => ({
        'aria-selected': String(state.selected),
      }),
    },
    popupToggle,
    navV,
  )
}
