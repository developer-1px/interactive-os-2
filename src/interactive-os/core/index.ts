import type { CommandHandler } from '../engine/types'
import { buildRegistry } from '../engine/types'

export { FOCUS_ID, focusCommands, GRID_COL_ID, gridColCommands, CELL_RANGE_ID, gridCellRangeCommands } from './focusCommands'
export { SELECTION_ID, SELECTION_ANCHOR_ID, selectionCommands } from './selectionCommands'
export { EXPANDED_ID, expandCommands } from './expandCommands'
export { CHECKED_ID, checkedCommands } from './checkedCommands'
export { EDIT_ID, editCommands, getEditState } from './editCommands'
export { POPUP_ID, popupCommands, getPopupEntity } from './popupCommands'
export { VALUE_ID, valueCommands } from './valueCommands'
export type { ValueRange } from './valueCommands'
export { activateCommands } from './activateCommands'

// Re-import for registry building
import { focusCommands, gridColCommands, gridCellRangeCommands } from './focusCommands'
import { selectionCommands } from './selectionCommands'
import { expandCommands } from './expandCommands'
import { checkedCommands } from './checkedCommands'
import { editCommands } from './editCommands'
import { popupCommands } from './popupCommands'
import { valueCommands } from './valueCommands'

/** All core axis command handlers as a pre-built registry */
export const coreRegistry: Map<string, CommandHandler> = buildRegistry(
  focusCommands,
  gridColCommands,
  gridCellRangeCommands,
  selectionCommands,
  expandCommands,
  checkedCommands,
  popupCommands,
  valueCommands,
  editCommands,
)
