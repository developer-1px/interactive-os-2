# NavList Sidebar ArrowDown Bug -- Debug Flow Report

## Phase 1: Reproduction

### Reproduction path chosen
- **Tool**: vitest integration test (browser extension unavailable; jsdom caveat acknowledged per skill guidelines)
- **Reason**: The bug involves keyboard navigation (ArrowDown) in a grouped NavList sidebar

### Reproduction steps
1. Created a grouped NavList data structure matching the `/ui/NavList` sidebar:
   - ROOT -> groups (`Navigation`, `Selection`) -> items (`navlist`, `tab-list`, `menu-list`, `listbox`, `combobox`)
2. Rendered `<NavList data={groupedData} />`
3. Focused `menu-list` (last item in "Navigation" group)
4. Pressed ArrowDown

### Reproduction result

**Reproduced.**

```
단계: menu-list에 포커스 후 ArrowDown
기대: listbox로 포커스 이동 (다음 그룹의 첫 항목)
실제: 포커스가 menu-list에 머무름 (DOM focus 이동 실패)
증거: engine dispatch 로그에서 core:focus {"nodeId":"Selection"} 확인
      — 그룹 노드로 포커스 시도, DOM 요소 없어서 focus sync 실패
```

Engine dispatch log evidence:
```
[dispatch #5] core:focus | {"nodeId":"Selection"} | menu-list -> Selection
```

The engine model focus moved to "Selection" (a group entity), but no DOM element has `data-node-id="Selection"` so `document.querySelector` returns null and `el.focus()` is never called.

**Additional finding**: Within a group, ArrowDown works correctly (navlist -> tab-list -> menu-list). The bug only manifests at **group boundaries**.

### Note on reproduction tool
The skill mandates real browser for focus/keyboard bugs. Browser extension was unavailable. The jsdom reproduction is directionally correct (engine dispatch logs confirm the model-level bug), but per skill guidelines, browser verification would be needed to confirm the full DOM behavior matches.

---

## Phase 2: Observation Tool Verification

### Checklist
- [x] "이벤트가 안 잡힌다" -- 이벤트는 정상 처리됨. keyDown handler fires, focusNext() runs, engine dispatches setFocus. Problem is AFTER dispatch.
- [x] 정상 동작 교차검증: flat NavList (no groups) passes all ArrowDown tests correctly (9/9 existing tests pass). Tool is reliable for the non-grouped case.
- [x] Engine dispatch logs provide independent verification: `core:focus {"nodeId":"Selection"}` proves the engine is targeting the wrong node (a group instead of an item).

### Conclusion
Observation tools (vitest + engine dispatch logger) are working correctly. The bug is in the target code, not the tools.

---

## Phase 3: Design Intent Understanding

### Gate 1: What is the design intent of this code?

**`getVisibleNodes`** (`/src/interactive-os/engine/getVisibleNodes.ts`): Depth-first walk from ROOT, collecting all non-root node IDs. Designed for tree structures where every node is potentially focusable (e.g., TreeView, TreeGrid).

**`navlist` pattern** (`/src/interactive-os/pattern/navlist.ts`): Composed from `navigate({ orientation: 'vertical' })` and `activate({ onClick: true, followFocus: true })`. Uses `composePattern` with role `listbox` / childRole `option`.

**`NavList` component** (`/src/interactive-os/ui/NavList.tsx`): Renders groups as `<div role="group">` containers (no item props). Only leaf items get `getItemProps()` (which provides `data-node-id`, `tabIndex`, `onKeyDown`). This follows the WAI-ARIA listbox pattern where groups are structural, not focusable.

**Disconnect**: `getVisibleNodes` includes ALL descendants (groups + items), but `NavList` only makes items focusable. The navigation model and the rendering model disagree about what is "navigable".

### Gate 2: Design violation or design gap?

**Design gap.** The `getVisibleNodes` function was designed for flat lists and trees where every node is focusable. Grouped listbox is a pattern where parent nodes (groups) exist in the data model but are NOT focusable navigation targets. The design never accounted for "non-focusable structural nodes in the navigation path."

### Gate 3: Would a fix violate design principles?

Two possible fix directions:

1. **Filter groups in getVisibleNodes**: Add awareness of "group" type nodes to skip them. Risk: couples the generic engine to NavList-specific semantics.

2. **Filter at the pattern level**: The navlist pattern (or NavList component) could provide a custom `getNavigableNodes` that excludes groups. This keeps `getVisibleNodes` generic and lets each pattern define what is navigable.

3. **Skip non-focusable nodes in focusNext/focusPrev**: If a target node has no corresponding DOM element (no `data-node-id`), skip to the next one. This is the most robust approach but may mask other bugs.

The recommended direction is **(2)**: let the pattern or component exclude non-focusable nodes from the navigation list. This follows the `feedback_design_over_request` principle -- the engine's navigation model should match the pattern's semantic model, not be patched at the DOM sync layer.

---

## Phase 4: Fix (not executed -- diagnostic only)

Per instructions, no source code was modified. The fix would involve:

1. **Write a failing test** reproducing the grouped ArrowDown bug (test code drafted during Phase 1)
2. **Modify** `getVisibleNodes` or introduce a pattern-level filter so group nodes are excluded from the flat navigation list when the pattern's childRole indicates only leaf nodes are focusable
3. **Verify** in browser that ArrowDown crosses group boundaries correctly

---

## Summary

| Phase | Status | Key Finding |
|-------|--------|-------------|
| 1. Reproduction | Bug reproduced | `getVisibleNodes` returns group nodes; `focusNext` targets them; DOM focus sync fails (no matching element) |
| 2. Tool verification | Tools verified | Engine dispatch logs independently confirm the model-level bug |
| 3. Design intent | Design gap identified | `getVisibleNodes` assumes all nodes are focusable; grouped listbox pattern breaks this assumption |
| 4. Fix | Not executed | Recommended: pattern-level filter to exclude non-focusable structural nodes from navigation list |

### Files examined
- `/Users/user/Desktop/aria/src/interactive-os/ui/NavList.tsx` -- component rendering (groups are not focusable)
- `/Users/user/Desktop/aria/src/interactive-os/ui/useNavList.ts` -- hook using navlist pattern
- `/Users/user/Desktop/aria/src/interactive-os/pattern/navlist.ts` -- pattern definition
- `/Users/user/Desktop/aria/src/interactive-os/axis/navigate.ts` -- ArrowDown -> focusNext mapping
- `/Users/user/Desktop/aria/src/interactive-os/pattern/createPatternContext.ts` -- focusNext uses getVisibleNodes
- `/Users/user/Desktop/aria/src/interactive-os/engine/getVisibleNodes.ts` -- root cause: includes group nodes
- `/Users/user/Desktop/aria/src/interactive-os/primitives/useAriaView.ts` -- DOM focus sync (querySelector fails for group nodes)
- `/Users/user/Desktop/aria/src/interactive-os/primitives/useAria.ts` -- engine + external sync
- `/Users/user/Desktop/aria/src/pages/PageUiShowcase.tsx` -- sidebar using grouped NavList data
- `/Users/user/Desktop/aria/src/pages/uiCategories.ts` -- sidebar group structure
- `/Users/user/Desktop/aria/src/interactive-os/__tests__/navlist.integration.test.tsx` -- existing tests (flat data only, all pass)
