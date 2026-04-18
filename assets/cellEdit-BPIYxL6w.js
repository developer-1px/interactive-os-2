var e=`// ② 2026-03-25-cell-edit-plugin-prd.md
import type { Plugin } from './types'
import { definePlugin } from './definePlugin'
import { key } from '../axis/types'
import { clipboardCommands } from './clipboard'

export function cellEdit(): Plugin {
  return definePlugin({
    name: 'cellEdit',
    keyMap: {
      'Delete': key(['clipboard:clearCellValue'], (ctx) => clipboardCommands.clearCellValue(ctx.focused, ctx.grid?.colIndex ?? 0)),
      'Mod+X': key(['clipboard:cutCellValue'], (ctx) => clipboardCommands.cutCellValue(ctx.focused, ctx.grid?.colIndex ?? 0)),
      'Mod+C': key(['clipboard:copyCellValue'], (ctx) => clipboardCommands.copyCellValue(ctx.focused, ctx.grid?.colIndex ?? 0)),
      'Mod+V': key(['clipboard:pasteCellValue'], (ctx) => clipboardCommands.pasteCellValue(ctx.focused, ctx.grid?.colIndex ?? 0)),
      'Enter': key(['core:focus'], (ctx) => ctx.focusNext()),
      'Shift+Enter': key(['core:focus'], (ctx) => ctx.focusPrev()),
    },
  })
}
`;export{e as default};