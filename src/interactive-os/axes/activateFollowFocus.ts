import { activate } from './activate'

/**
 * Alias for `activate` axis.
 * The follow-focus behavior itself is controlled by `PatternConfig.followFocus`,
 * not by the keyMap — this alias exists for readability at the composition site
 * (e.g., `composePattern(metadata, navH(), activateFollowFocus)`).
 */
export const activateFollowFocus = activate
