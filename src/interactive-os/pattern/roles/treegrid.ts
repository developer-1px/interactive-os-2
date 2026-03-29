import type { AriaPattern } from '../types'
import type { PatternContext } from '../../axis/types'
import type { Command } from '../../engine/types'
import { composePattern } from '../composePattern'
import { navigate, grid as gridAxis } from '../../axis/navigate'
import { selected } from '../../axis/select'
import { expanded } from '../../axis/expand'
import { activateHandler } from '../../axis/activate'

// APG Treegrid — "Hierarchical data grid."
// Row ↔ Cell mode handlers (composite — uses exp + grid closures)

export function treegrid(columns: number): AriaPattern {
  const nav = navigate('vertical')
  const sel = selected('multiple')
  const exp = expanded()
  const g = gridAxis(columns)

  // APG: "If a row is focused and expanded, focuses the first cell."
  const arrowRight = (ctx: PatternContext): Command | void => {
    if (ctx.grid && ctx.grid.colIndex >= 0) return ctx.grid.focusNextCol()
    if (ctx.expanded?.is) return ctx.grid ? ctx.grid.focusFirstCol() : ctx.focusChild()
    return ctx.expanded?.set(true)
  }

  const arrowLeft = (ctx: PatternContext): Command | void => {
    if (ctx.grid && ctx.grid.colIndex >= 0) {
      if (ctx.grid.colIndex === 0) return ctx.grid.focusRow()
      return ctx.grid.focusPrevCol()
    }
    return ctx.expanded?.is ? ctx.expanded.set(false) : ctx.focusParent()
  }

  const home = (ctx: PatternContext): Command | void => {
    if (ctx.grid && ctx.grid.colIndex >= 0) return ctx.grid.focusFirstCol()
    return ctx.focusFirst()
  }

  const end = (ctx: PatternContext): Command | void => {
    if (ctx.grid && ctx.grid.colIndex >= 0) return ctx.grid.focusLastCol()
    return ctx.focusLast()
  }

  return composePattern(
    { role: 'treegrid', childRole: 'row' },
    [nav, sel, exp, g],
    {
      ArrowDown: nav.next,
      ArrowUp: nav.prev,
      ArrowRight: arrowRight,
      ArrowLeft: arrowLeft,
      Home: home,
      End: end,
      'Mod+Home': nav.first,
      'Mod+End': nav.last,
      Tab: g.tabCycleNext,
      'Shift+Tab': g.tabCyclePrev,
      Enter: activateHandler,
      Space: sel.toggle,
      ...sel.keys,
      ...sel.clickKeys,
    },
  )
}
