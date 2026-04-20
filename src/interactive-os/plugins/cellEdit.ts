// ② 2026-03-25-cell-edit-plugin-prd.md
import type { Plugin } from './types'
import { definePlugin } from './definePlugin'
import { key } from '../axis/types'
import { clipboardCommands } from './clipboard'

export function cellEdit(): Plugin {
  return definePlugin({
    name: 'cellEdit',
    keyMap: {
      // Cell-mode only (colIndex >= 0). Row-mode falls through to earlier plugin bindings
      // (crud:Delete, clipboard row-level copy/cut/paste) via the original() chain.
      'Delete': key(['clipboard:clearCellValue'], (ctx, original) => {
        const col = ctx.grid?.colIndex ?? -1
        if (col < 0) return original?.()
        return clipboardCommands.clearCellValue(ctx.focused, col)
      }),
      'Mod+X': key(['clipboard:cutCellValue'], (ctx, original) => {
        const col = ctx.grid?.colIndex ?? -1
        if (col < 0) return original?.()
        return clipboardCommands.cutCellValue(ctx.focused, col)
      }),
      'Mod+C': key(['clipboard:copyCellValue'], (ctx, original) => {
        const col = ctx.grid?.colIndex ?? -1
        if (col < 0) return original?.()
        return clipboardCommands.copyCellValue(ctx.focused, col)
      }),
      'Mod+V': key(['clipboard:pasteCellValue'], (ctx, original) => {
        const col = ctx.grid?.colIndex ?? -1
        if (col < 0) return original?.()
        return clipboardCommands.pasteCellValue(ctx.focused, col)
      }),
      'Enter': key(['core:focus'], (ctx) => ctx.focusNext()),
      'Shift+Enter': key(['core:focus'], (ctx) => ctx.focusPrev()),
    },
  })
}
