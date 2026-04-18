var e=`import type { PatternContext } from '../pattern/types'
import type { Axis } from '../axis/types'
import { key } from '../axis/types'
import { ROOT_ID } from '../store/types'
import { navigate } from '../axis/navigate'
import { focusCommands } from '../core'
import { selected } from '../axis/select'
import { composePattern } from '../pattern/composePattern'

// ── Helpers ──

function getSiblings(ctx: PatternContext, nodeId: string): string[] {
  const parent = ctx.getParent(nodeId)
  if (!parent) return ctx.getChildren(ROOT_ID)
  return ctx.getChildren(parent)
}

// ── Axis: vertical navigation within column (siblings) ──

const millerNavV: Axis = {
  ArrowDown: key(['core:focus'], (ctx) => {
    const siblings = getSiblings(ctx, ctx.focused)
    const idx = siblings.indexOf(ctx.focused)
    if (idx >= siblings.length - 1) return focusCommands.setFocus(ctx.focused)
    return focusCommands.setFocus(siblings[idx + 1]!)
  }),

  ArrowUp: key(['core:focus'], (ctx) => {
    const siblings = getSiblings(ctx, ctx.focused)
    const idx = siblings.indexOf(ctx.focused)
    if (idx <= 0) return focusCommands.setFocus(ctx.focused)
    return focusCommands.setFocus(siblings[idx - 1]!)
  }),

  Home: key(['core:focus'], (ctx) => {
    const siblings = getSiblings(ctx, ctx.focused)
    if (siblings.length === 0) return focusCommands.setFocus(ctx.focused)
    return focusCommands.setFocus(siblings[0]!)
  }),

  End: key(['core:focus'], (ctx) => {
    const siblings = getSiblings(ctx, ctx.focused)
    if (siblings.length === 0) return focusCommands.setFocus(ctx.focused)
    return focusCommands.setFocus(siblings[siblings.length - 1]!)
  }),
}

// ── Axis: drill-in / drill-out (←→) ──

const millerDrill: Axis = {
  ArrowRight: key(['core:focus'], (ctx) => {
    const children = ctx.getChildren(ctx.focused)
    if (children.length === 0) return focusCommands.setFocus(ctx.focused)
    return focusCommands.setFocus(children[0]!)
  }),

  ArrowLeft: key(['core:focus'], (ctx) => {
    const parent = ctx.getParent(ctx.focused)
    if (!parent || parent === ROOT_ID) return focusCommands.setFocus(ctx.focused)
    return focusCommands.setFocus(parent)
  }),
}

// ── Compose ──

const nav = navigate('vertical')
const sel = selected('single', { followFocus: true })

export const miller = composePattern(
  {
    role: 'tree',
    childRole: 'treeitem',
    ariaAttributes: (_node, state) => ({
      'aria-level': String((state.level ?? 0) + 1),
      'aria-selected': String(state.selected),
    }),
  },
  [nav, sel, millerNavV, millerDrill],
  {},
)
`;export{e as default};