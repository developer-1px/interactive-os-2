import type { AriaPattern, NodeState } from '../types'
import type { PatternContext } from '../../axis/types'
import { composePattern } from '../composePattern'

export interface ComboboxOptions {
  selectionMode?: 'single' | 'multiple'
}

export function combobox(options?: ComboboxOptions): AriaPattern {
  const selectionMode = options?.selectionMode ?? 'single'

  // APG combobox pattern: navigation only, open/close is combobox plugin's responsibility
  const navV = {
    ArrowDown: (ctx: PatternContext) => ctx.focusNext(),
    ArrowUp: (ctx: PatternContext) => ctx.focusPrev(),
    Home: (ctx: PatternContext) => ctx.focusFirst(),
    End: (ctx: PatternContext) => ctx.focusLast(),
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
    navV,
  )
}
