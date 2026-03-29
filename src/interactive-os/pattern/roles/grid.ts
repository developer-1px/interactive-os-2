import type { AriaPattern } from '../types'
import { composePattern } from '../composePattern'
import { navigate, grid as gridAxis } from '../../axis/navigate'
import { selected } from '../../axis/select'

// APG Grid — "Interactive tabular data and layout containers."

export function grid(options: { columns: number; tabCycle?: boolean }): AriaPattern {
  const nav = navigate('both')
  const sel = selected('multiple')
  const g = gridAxis(options.columns)

  return composePattern(
    { role: 'grid', childRole: 'row' },
    [nav, sel, g],
    {
      ArrowRight: g.focusNextCol,
      ArrowLeft: g.focusPrevCol,
      ArrowDown: nav.next,
      ArrowUp: nav.prev,
      Home: g.focusFirstCol,
      End: g.focusLastCol,
      'Mod+Home': nav.first,
      'Mod+End': nav.last,
      ...(options.tabCycle && {
        Tab: g.tabCycleNext,
        'Shift+Tab': g.tabCyclePrev,
      }),
      Space: sel.toggle,
      ...sel.keys,
      ...sel.clickKeys,
    },
  )
}

export function layoutGrid(options: { columns: number }): AriaPattern {
  const nav = navigate('both')
  const g = gridAxis(options.columns)
  const sel = selected('multiple')

  return composePattern(
    { role: 'grid', childRole: 'row' },
    [nav, g, sel],
    {
      ArrowRight: g.focusNextCol,
      ArrowLeft: g.focusPrevCol,
      ArrowDown: nav.next,
      ArrowUp: nav.prev,
      Home: nav.first,
      End: nav.last,
      ...sel.clickKeys,
    },
  )
}
