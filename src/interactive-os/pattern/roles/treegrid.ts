import type { AriaPattern } from '../types'
import { composePattern } from '../composePattern'
import { navigate, grid as gridAxis } from '../../axis/navigate'
import { selected } from '../../axis/select'
import { expanded } from '../../axis/expand'
import { activateHandler } from '../../axis/activate'
import { key } from '../../axis/types'

// APG Treegrid — "Hierarchical data grid."
// Row ↔ Cell mode handlers (composite — uses exp + grid closures)

export function treegrid(columns: number): AriaPattern {
  const nav = navigate('vertical')
  const sel = selected('multiple', { followFocus: true })
  const exp = expanded()
  const g = gridAxis(columns, { initialColIndex: -1 })

  // APG: row mode (-1) → expand or focusChild; cell mode (0+) → next col
  const arrowRight = key(['core:set-col-index', 'core:focus', 'core:expand'], (ctx) => {
    if (ctx.grid && ctx.grid.colIndex >= 0) return ctx.grid.focusNextCol()
    if (ctx.expanded?.is) return ctx.focusChild()
    return ctx.expanded?.set(true)
  })

  const arrowLeft = key(['core:set-col-index', 'core:collapse', 'core:focus'], (ctx) => {
    if (ctx.grid && ctx.grid.colIndex >= 0) {
      if (ctx.grid.colIndex === 0) return ctx.grid.focusRow()
      return ctx.grid.focusPrevCol()
    }
    return ctx.expanded?.is ? ctx.expanded.set(false) : ctx.focusParent()
  })

  const home = key(['core:set-col-index', 'core:focus'], (ctx) => {
    if (ctx.grid && ctx.grid.colIndex >= 0) return ctx.grid.focusFirstCol()
    return ctx.focusFirst()
  })

  const end = key(['core:set-col-index', 'core:focus'], (ctx) => {
    if (ctx.grid && ctx.grid.colIndex >= 0) return ctx.grid.focusLastCol()
    return ctx.focusLast()
  })

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
