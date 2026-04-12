import type { AriaPattern } from '../types'
import { composePattern } from '../composePattern'
import type { PatternContext } from '../types'
import { navigate, grid as gridAxis } from '../../axis/navigate'
import { selected } from '../../axis/select'
import { key } from '../../axis/types'
// Grid ui uses rename plugin (via enableEditing), so checking ctx.edit alone is insufficient.
// RENAME_ID literal inlined to keep pattern layer free of plugin imports.
const RENAME_ID = '__rename__'
const isEditing = (ctx: PatternContext): boolean => {
  if (ctx.edit?.active) return true
  const rename = ctx.getEntity?.(RENAME_ID) as { active?: boolean } | undefined
  return rename?.active === true
}

// APG Grid — "Interactive tabular data and layout containers."

// Cell-range key handlers (2D extend) — edit-active gating per PRD #5.
// All extend handlers are defined once at module scope; identity-stable for tests.
const extendCellNext = key(['core:set-col-index', 'core:cell-range-extend'], (ctx) => {
  if (isEditing(ctx)) return
  return ctx.grid?.cellRange?.extendCol('next')
})
const extendCellPrev = key(['core:set-col-index', 'core:cell-range-extend'], (ctx) => {
  if (isEditing(ctx)) return
  return ctx.grid?.cellRange?.extendCol('prev')
})
const extendCellDown = key(['core:focus', 'core:cell-range-extend'], (ctx) => {
  if (isEditing(ctx)) return
  return ctx.grid?.cellRange?.extendRow('next')
})
const extendCellUp = key(['core:focus', 'core:cell-range-extend'], (ctx) => {
  if (isEditing(ctx)) return
  return ctx.grid?.cellRange?.extendRow('prev')
})
const extendCellHome = key(['core:set-col-index', 'core:cell-range-extend'], (ctx) => {
  if (isEditing(ctx)) return
  return ctx.grid?.cellRange?.extendCol('first')
})
const extendCellEnd = key(['core:set-col-index', 'core:cell-range-extend'], (ctx) => {
  if (isEditing(ctx)) return
  return ctx.grid?.cellRange?.extendCol('last')
})
const extendCellModHome = key(['core:focus', 'core:set-col-index', 'core:cell-range-extend'], (ctx) => {
  if (isEditing(ctx)) return
  // Jump to top-left: row "first" + col 0 via extendTo
  const first = ctx.focusFirst()
  const firstRowId = (first.payload as { nodeId?: string } | undefined)?.nodeId
  if (!firstRowId) return
  return ctx.grid?.cellRange?.extendTo(firstRowId, 0)
})
const extendCellModEnd = key(['core:focus', 'core:set-col-index', 'core:cell-range-extend'], (ctx) => {
  if (isEditing(ctx)) return
  const last = ctx.focusLast()
  const lastRowId = (last.payload as { nodeId?: string } | undefined)?.nodeId
  const colCount = ctx.grid?.colCount ?? 1
  if (!lastRowId) return
  return ctx.grid?.cellRange?.extendTo(lastRowId, colCount - 1)
})
const extendCellClick = key(['core:focus', 'core:set-col-index', 'core:cell-range-extend'], (ctx) => {
  if (isEditing(ctx)) return
  const col = ctx.grid?.colIndex ?? 0
  return ctx.grid?.cellRange?.extendTo(ctx.focused, col)
})

export function grid(options: { columns: number; tabCycle?: boolean; initialColIndex?: number }): AriaPattern {
  const nav = navigate('both')
  const sel = selected('multiple', { followFocus: true })
  const g = gridAxis(options.columns, { initialColIndex: options.initialColIndex })

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
      // Grid 2D cell-range overrides — must come AFTER sel.keys/clickKeys
      // so Shift+Arrow / Shift+Click extend cell range instead of row range.
      'Shift+ArrowRight': extendCellNext,
      'Shift+ArrowLeft': extendCellPrev,
      'Shift+ArrowDown': extendCellDown,
      'Shift+ArrowUp': extendCellUp,
      'Shift+Home': extendCellHome,
      'Shift+End': extendCellEnd,
      'Mod+Shift+Home': extendCellModHome,
      'Mod+Shift+End': extendCellModEnd,
      'Shift+Click': extendCellClick,
    },
  )
}

export function layoutGrid(options: { columns: number }): AriaPattern {
  const nav = navigate('both')
  const g = gridAxis(options.columns)
  const sel = selected('multiple', { followFocus: true })

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
