import { activate } from './activate'
import type { KeyMap } from './composePattern'

/**
 * Pre-built activate axis with default options.
 * The follow-focus behavior itself is controlled by axis config (followFocus),
 * not by the keyMap — this alias exists for backward compatibility.
 */
const result = activate()
export const activateFollowFocus: KeyMap = result.keyMap
