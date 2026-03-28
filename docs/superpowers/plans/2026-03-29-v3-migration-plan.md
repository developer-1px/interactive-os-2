# v3 Migration Plan — 2026-03-29

## 목표

v2 axis bundle 레거시 제거. 모든 pattern이 v3 flat inputMap 형태로 통일.

## Task 1: Aria `as` prop

`<Aria>` 컴포넌트에 `as` prop 추가. 기본값 `div`, `table`/`ul`/`nav` 등 가능.
- 파일: `src/interactive-os/primitives/aria.tsx`
- AriaProps에 `as?: React.ElementType` 추가
- AriaRoot의 `<div>` → `<Component>` 동적 렌더

## Task 2: v2→v3 Pattern 전환

각 pattern에서 axis bundle 호출을 flat inputMap + config-only 호출로 교체.

### 전환 규칙

| v2 | v3 |
|----|----|
| `navigate({ orientation, wrap })` | 직접 handler: `ArrowDown: focusNext`, etc. |
| `select({ mode, selectionFollowsFocus })` | `selectConfig({ mode, selectionFollowsFocus })` + 직접 handler |
| `expand({ mode })` | `expandConfig()` + 직접 handler |
| `activate({ onClick })` | config만: `{ activateOnClick: true }` 또는 직접 handler |
| `dismiss()` | 직접 handler: `Escape: dismissHandler` |
| `popup({ type })` | config + visibilityFilter + 직접 handler |
| `checked()` | config만 + 직접 handler: `Space: toggleCheckHandler` |
| `value()` | config만 + 직접 handler |
| `tab()` | 직접 handler: `Tab: focusNextWrap` |

### 대상 파일 (20개)

1. tabs.ts — select + activate + navigate → flat
2. tabsManual.ts — select + activate + navigate → flat
3. radiogroup.ts — select + activate + navigate → flat
4. radiogroupActivedescendant.ts — select + custom → flat
5. tree.ts — select + activate + expand + navigate → flat
6. menu.ts — activate + expand + navigate → flat
7. toolbar.ts — activate + navigate → flat
8. disclosure.ts — activate → flat
9. alertdialog.ts — dismiss → flat
10. menuButton.ts — popup + navigate + activate → flat
11. menuActivedescendant.ts — activate + expand → flat
12. table.ts — expand → flat (minimal)
13. slider.ts — value → flat
14. spinbutton.ts — value → flat
15. checkbox.ts — checked → flat
16. checkboxMixed.ts — checked + navigate → flat
17. switch.ts — checked → flat
18. buttonToggle.ts — checked → flat
19. link.ts — activate → flat
20. feed.ts — custom feedAxis → flat

### 이미 v3인 파일 (config-only 사용, 변환 불필요)

- treegrid.ts — selectConfig + expandConfig + flat handlers ✓
- menubar.ts — expandConfig + flat handlers ✓
- listbox.ts — selectConfig + flat handlers ✓
- listboxGrouped.ts — selectConfig + flat handlers ✓
- calendarGrid.ts — selectConfig + flat handlers ✓
- grid.ts — flat handlers ✓
- combobox.ts — flat handlers ✓
- alert.ts — no handlers ✓
- meter.ts — no handlers ✓
- dialog.ts — minimal ✓
- windowSplitter.ts — value config ✓

## Task 3: v2 Bundle 함수 제거

전환 완료 후 axis 파일에서 bundle 함수 삭제:
- `navigate()`, `rovingTabindex()`, `gridNav()` from navigate.ts
- `select()` from select.ts
- `expand()` from expand.ts
- `activate()`, `activateConfig()` from activate.ts
- `dismiss()` from dismiss.ts
- `popup()` from popup.ts
- `checked()` from checked.ts
- `value()` from value.ts
- `tab()` from tab.ts

Config-only 함수는 유지: `selectConfig()`, `expandConfig()`

## 실행 순서

1. Task 1 (as prop) — 직접
2. Task 2 (pattern 전환) — 서브에이전트 3개 병렬
   - Agent A: tabs, tabsManual, radiogroup, radiogroupActivedescendant, toolbar, disclosure
   - Agent B: tree, menu, menuButton, menuActivedescendant, alertdialog, table
   - Agent C: slider, spinbutton, checkbox, checkboxMixed, switch, buttonToggle, link, feed
3. Task 3 (bundle 제거) — 직접 (전환 후)
4. Verify — typecheck + lint + test + deps
