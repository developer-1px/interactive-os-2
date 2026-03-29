import type { CommandHandler } from '../engine/types'
import { buildRegistry } from '../engine/types'
import { focusCommands, gridColCommands } from './navigate'
import { selectionCommands } from './select'
import { expandCommands } from './expand'
import { checkedCommands } from './checked'
import { popupCommands } from './popup'
import { valueCommands } from './value'

/** All core axis command handlers as a pre-built registry */
export const coreRegistry: Map<string, CommandHandler> = buildRegistry(
  focusCommands,
  gridColCommands,
  selectionCommands,
  expandCommands,
  checkedCommands,
  popupCommands,
  valueCommands,
)
