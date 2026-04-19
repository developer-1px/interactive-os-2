import type { AriaPattern } from '../types'
import { composePattern } from '../composePattern'
import { navigate, grid as gridAxis } from '../../axis/navigate'
import { selected } from '../../axis/select'
import { expanded } from '../../axis/expand'
import { activateHandler } from '../../axis/activate'
import { key } from '../../axis/types'
import { createBatchCommand } from '../../engine/types'

// APG Treegrid — "Hierarchical data grid."
// Row ↔ Cell mode handlers (composite — uses exp + grid closures)

export function treegrid(columns: number): AriaPattern {
  const nav = navigate('vertical')
  const sel = selected('multiple', { followFocus: true })
  const exp = expanded()
  const g = gridAxis(columns, { initialColIndex: -1 })

  // APG Treegrid ArrowRight:
  //   cell mode, not last col → next col
  //   cell mode, last col, expandable & collapsed → expand current row
  //   cell mode, last col, otherwise → next row, last col
  //   row mode, expandable & collapsed → expand
  //   row mode, expandable & expanded → focus first child
  //   row mode, leaf (not expandable) → enter cell mode (col 0)
  const arrowRight = key(['core:set-col-index', 'core:focus', 'core:expand'], (ctx) => {
    if (ctx.grid && ctx.grid.colIndex >= 0) {
      const atLastCol = ctx.grid.colIndex >= ctx.grid.colCount - 1
      if (!atLastCol) return ctx.grid.focusNextCol()
      if (ctx.expanded?.isExpandable && !ctx.expanded.is) return ctx.expanded.set(true)
      const nextRowCmd = ctx.focusNext()
      if ((nextRowCmd.payload as Record<string, unknown>)?.nodeId === ctx.focused) return
      return createBatchCommand([nextRowCmd, ctx.grid.focusLastCol()])
    }
    if (ctx.expanded?.isExpandable) {
      if (!ctx.expanded.is) return ctx.expanded.set(true)
      return ctx.focusChild()
    }
    // leaf node (or no expanded axis): enter cell mode
    return ctx.grid?.focusFirstCol()
  })

  // APG Treegrid ArrowLeft:
  //   cell mode, col > 0 → prev col
  //   cell mode, col 0 → return to row mode
  //   row mode, expanded → collapse
  //   row mode, collapsed/leaf → focus parent
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
      '*': exp.expandSiblings,
      'Mod+ArrowRight': exp.expandDescendants,
      ...sel.keys,
      ...sel.clickKeys,
    },
  )
}
