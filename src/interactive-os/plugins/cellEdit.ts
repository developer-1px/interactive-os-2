// ② 2026-03-25-cell-edit-plugin-prd.md
import type { Plugin } from './types'
import { definePlugin } from './definePlugin'
import { clipboardCommands } from './clipboard'

export function cellEdit(): Plugin {
  return definePlugin({
    name: 'cellEdit',
    keyMap: {
      'Delete': (ctx) => clipboardCommands.clearCellValue(ctx.focused, ctx.grid?.colIndex ?? 0),
      'Mod+X': (ctx) => clipboardCommands.cutCellValue(ctx.focused, ctx.grid?.colIndex ?? 0),
      'Mod+C': (ctx) => clipboardCommands.copyCellValue(ctx.focused, ctx.grid?.colIndex ?? 0),
      'Mod+V': (ctx) => clipboardCommands.pasteCellValue(ctx.focused, ctx.grid?.colIndex ?? 0),
      'Enter': (ctx) => ctx.focusNext(),
      'Shift+Enter': (ctx) => ctx.focusPrev(),
    },
  })
}
