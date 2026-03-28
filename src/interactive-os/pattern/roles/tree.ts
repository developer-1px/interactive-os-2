import type { NodeState } from '../types'
import type { Entity } from '../../store/types'
import type { AxisConfig, KeyMap } from '../../axis/types'
import { composePattern } from '../composePattern'
import { selectConfig, toggleSelect, extendSelectionNext, extendSelectionPrev, extendSelectionFirst, extendSelectionLast } from '../../axis/select'
import { activateConfig, activateHandler } from '../../axis/activate'
import { expandConfig, expandOrFocusChild, collapseOrFocusParent } from '../../axis/expand'
import { focusNext, focusPrev, focusFirst, focusLast } from '../../axis/navigate'

const selectOnClick: { keyMap: KeyMap; config: Partial<AxisConfig> } = { keyMap: {}, config: { selectOnClick: true } }

export const tree = composePattern(
  {
    role: 'tree',
    childRole: 'treeitem',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    ariaAttributes: (_node: Entity, state: NodeState) => {
      const attrs: Record<string, string> = {
        'aria-selected': String(state.selected),
        'aria-posinset': String(state.index + 1),
        'aria-setsize': String(state.siblingCount),
      }
      if (state.expanded !== undefined) {
        attrs['aria-expanded'] = String(state.expanded)
      }
      if (state.level !== undefined) {
        attrs['aria-level'] = String(state.level)
      }
      return attrs
    },
  },
  selectConfig({ mode: 'multiple' }),
  selectOnClick,
  activateConfig(),
  expandConfig(),
  {
    // Navigation — vertical
    ArrowDown: focusNext,
    ArrowUp: focusPrev,
    Home: focusFirst,
    End: focusLast,

    // Expand — arrow mode
    ArrowRight: expandOrFocusChild,
    ArrowLeft: collapseOrFocusParent,

    // Selection
    Space: toggleSelect,
    'Shift+ArrowDown': extendSelectionNext,
    'Shift+ArrowUp': extendSelectionPrev,
    'Shift+Home': extendSelectionFirst,
    'Shift+End': extendSelectionLast,

    // Activation
    Enter: activateHandler,
  },
)
