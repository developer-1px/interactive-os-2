# module.css → ax() 마이그레이션 트래커

## 목적
- module.css에서 ax()로 대체 가능한 속성 이관
- last-mile 중 반복 패턴을 발견하여 새 축 후보로 누적

## 작업 루프 (파일당)
1. ax()로 대체 가능한 속성 → 이관
2. 남은 last-mile 중 반복 → 태깅
3. 태그 3회+ → 축 후보 검토

## 축 후보 누적

| 패턴 | 빈도 | 축 후보? | 비고 |
|------|------|----------|------|
| `font-weight` 오버라이드 | semi 9회 + medium 2회 (ui 전역 + cms) | ⚡ **축 확정급** | textStyle weight와 독립. semi/medium/regular 3값 |
| `border: 1px solid var(--border-*)` | 7 (Button×2, Accordion, Spinbutton×3, Tooltip) | ⚡ **축 확정급** | variant/컴포넌트별 테두리. surface 미소유 |
| `background` on state (tone-dim/selection) | 4 (Combobox×2, Toolbar×2) | ⚡ 축 후보 | focused/selected 상태 배경. surface와 별개 |
| `color: var(--tone-*-base)` on state | 3 (Toggle, ToggleGroup, Spinbutton error) | ⚡ 축 후보 | text 축에 tone 색상 부재 |
| `transition` + `transform` | 3 (Accordion, TabGroup, Spinbutton) | ⚡ 축 후보 | motion/animation 반복 |
| `::placeholder` color | 2 (Combobox, Spinbutton) | 🔍 관찰중 | pseudo-element, ax() 불가 |
| `font-variant-numeric: tabular-nums` | 1 (Spinbutton ×2) | 🔍 관찰중 | 숫자 정렬용 |
| `box-shadow` focus ring | 2 (Spinbutton normal/error) | 🔍 관찰중 | outline과 다른 focus 표현 |
| `padding-*` 방향별 | 2 (Accordion left, NavList top) | 🔍 관찰중 | padding축은 전방향만 |
| `opacity` | 2 (Breadcrumb, TabGroup) | 🔍 관찰중 | 시각적 약화 |
| `text-transform: uppercase` + `letter-spacing` | 1 (NavList groupLabel) | 🔍 관찰중 | 라벨 타이포 오버라이드 |
| `outline` focus ring | 1 (Toolbar) | 🔍 관찰중 | focus 시각 표현 |
| `white-space: nowrap` | 1 (TabGroup) | 🔍 관찰중 | clamp:'1'과 유사하나 ellipsis 없이 |
| `font-style: italic` | 1 (TabGroup) | 🔍 관찰중 | 임시/미저장 상태 |
| `surface-sunken` | 1 (TabGroup) | 🔍 관찰중 | surface축에 없는 값 |

---

## ui/ (31개)

| # | 파일 | 상태 | 메모 |
|---|------|------|------|
| 1 | ui/Accordion.module.css | ✅ | 전부 last-mile. weight-semi, border-bottom, transition/transform(chevron), padding-left |
| 2 | ui/AlertDialog.module.css | ✅ | import 없음. 이미 ax() 완전 이관. 삭제 후보 |
| 3 | ui/Breadcrumb.module.css | ✅ | 전부 last-mile. 미세 gap, flex-shrink, margin, opacity |
| 4 | ui/Button.module.css | ✅ | border-radius→shape:xl, width→width:full 이관. dead code(.sm/.lg) 제거. last-mile: weight-semi/medium, border |
| 5 | ui/CalendarGrid.module.css | ⬜ | |
| 6 | ui/Checkbox.module.css | ✅ | 이미 빈 파일(코멘트만). 삭제 후보 |
| 7 | ui/CodeBlock.module.css | ⬜ | |
| 8 | ui/Combobox.module.css | ✅ | border-radius×2→shape:xl 이관. last-mile: ::placeholder, margin-top, overflow, state bg(focused/selected) |
| 9 | ui/Composer.module.css | ⬜ | |
| 10 | ui/DatePicker.module.css | ⬜ | |
| 11 | ui/DisclosureGroup.module.css | ✅ | last-mile: justify-content override |
| 12 | ui/FileIcon.module.css | ⬜ | |
| 13 | ui/FileViewerModal.module.css | ⬜ | |
| 14 | ui/Form.module.css | ✅ | 빈 셀렉터만. 삭제 후보 |
| 15 | ui/Kanban.module.css | ⬜ | |
| 16 | ui/ListBox.module.css | ✅ | 전부 last-mile. selected→weight-semi (패턴 +1) |
| 17 | ui/MarkdownViewer.module.css | ⬜ | |
| 18 | ui/MenuList.module.css | ✅ | 빈 파일(코멘트만). 삭제 후보 |
| 19 | ui/Menubar.module.css | ⬜ | |
| 20 | ui/NavList.module.css | ✅ | last-mile: weight-semi, letter-spacing, text-transform, 방향별 padding |
| 21 | ui/PatternDemo.module.css | ⬜ | |
| 22 | ui/QuickOpen.module.css | ⬜ | |
| 23 | ui/RadioGroup.module.css | ✅ | aria-checked color → 조건부 text:'primary'로 이관. import 제거. 삭제 후보 |
| 24 | ui/SelectionOverlay.module.css | ⬜ | |
| 25 | ui/Slider.module.css | ⬜ | |
| 26 | ui/Spinbutton.module.css | ✅ | 대형. weight-semi×2, weight-medium, border×3, focus ring, tabular-nums, transition, ::placeholder |
| 27 | ui/SplitPane.module.css | ⬜ | |
| 28 | ui/StreamFeed.module.css | ⬜ | |
| 29 | ui/SwitchGroup.module.css | ✅ | aria-checked color → 조건부 text:'primary'로 이관. import 제거. 삭제 후보 |
| 30 | ui/TabGroup.module.css | ✅ | 전부 last-mile. surface-sunken(새패턴), white-space, state --_bg/--_fg, font-style:italic, opacity reveal transition |
| 31 | ui/TextInput.module.css | ⬜ | |
| 32 | ui/Toaster.module.css | ⬜ | |
| 33 | ui/Toggle.module.css | ✅ | font-size→textStyle:caption, color→text:muted 이관. last-mile: weight-semi, data-checked tone color |
| 34 | ui/ToggleGroup.module.css | ✅ | 빈 .item 제거. last-mile: indicator tone color |
| 35 | ui/Toolbar.module.css | ✅ | last-mile: state bg(focused/selected), outline focus ring, color:bright |
| 36 | ui/Tooltip.module.css | ✅ | 대형. popover positioning, border, border-radius, shadow, transition, pointer-events. 대부분 진짜 last-mile |
| 37 | ui/Treemap.module.css | ⬜ | |
| 38 | ui/Workspace.module.css | ✅ | root→layout:fill, inner styles 제거, empty→text:muted. last-mile: height:100% |

## ui/chat/ (6개)

| # | 파일 | 상태 | 메모 |
|---|------|------|------|
| 39 | ui/chat/ChatFeed.module.css | ⬜ | |
| 40 | ui/chat/DiffBlock.module.css | ⬜ | |
| 41 | ui/chat/FallbackBlock.module.css | ⬜ | |
| 42 | ui/chat/StreamingTextBlock.module.css | ⬜ | |
| 43 | ui/chat/TextBlock.module.css | ⬜ | |
| 44 | ui/chat/ThinkingBlock.module.css | ⬜ | |
| 45 | ui/chat/ToolSummaryBlock.module.css | ⬜ | |

## pages/ (10개)

| # | 파일 | 상태 | 메모 |
|---|------|------|------|
| 46 | pages/birdseye/BirdseyeLayout.module.css | ⬜ | |
| 47 | pages/book/PageBookViewer.module.css | ⬜ | |
| 48 | pages/chat/PageAgentChat.module.css | ⬜ | |
| 49 | pages/cms/CmsLanding.module.css | ⬜ | |
| 50 | pages/creator/PageComponentCreator.module.css | ⬜ | |
| 51 | pages/showcase/IndicatorsDemo.module.css | ⬜ | |
| 52 | pages/incident/PageIncidentInterface.module.css | ⬜ | |
| 53 | pages/showcase/PageUiShowcase.module.css | ⬜ | |
| 54 | pages/storymap/PageStoryMap.module.css | ⬜ | |
| 55 | pages/viewer/PageViewer.module.css | ⬜ | |
| 56 | pages/viewer/TimelineColumn.module.css | ⬜ | |
| 57 | pages/theme/PageThemeCreator.module.css | ⬜ | |
| 58 | pages/replay/ReplayCursor.module.css | ⬜ | |

## pattern/examples/ (21개)

| # | 파일 | 상태 | 메모 |
|---|------|------|------|
| 59 | examples/accordion.module.css | ⬜ | |
| 60 | examples/alert.module.css | ⬜ | |
| 61 | examples/alertDialog.module.css | ⬜ | |
| 62 | examples/button.module.css | ⬜ | |
| 63 | examples/carousel.module.css | ⬜ | |
| 64 | examples/checkbox.module.css | ⬜ | |
| 65 | examples/combobox.module.css | ⬜ | |
| 66 | examples/datepicker.module.css | ⬜ | |
| 67 | examples/disclosure.module.css | ⬜ | |
| 68 | examples/feed.module.css | ⬜ | |
| 69 | examples/grid.module.css | ⬜ | |
| 70 | examples/link.module.css | ⬜ | |
| 71 | examples/listbox.module.css | ⬜ | |
| 72 | examples/menu.module.css | ⬜ | |
| 73 | examples/menubar.module.css | ⬜ | |
| 74 | examples/meter.module.css | ⬜ | |
| 75 | examples/radiogroup.module.css | ⬜ | |
| 76 | examples/shared.module.css | ⬜ | |
| 77 | examples/slider.module.css | ⬜ | |
| 78 | examples/spinbutton.module.css | ⬜ | |
| 79 | examples/switch.module.css | ⬜ | |
| 80 | examples/table.module.css | ⬜ | |
| 81 | examples/tabs.module.css | ⬜ | |
| 82 | examples/toolbar.module.css | ⬜ | |
| 83 | examples/tree.module.css | ⬜ | |
| 84 | examples/treegrid.module.css | ⬜ | |
| 85 | examples/windowSplitter.module.css | ⬜ | |

## devtools/ (1개)

| # | 파일 | 상태 | 메모 |
|---|------|------|------|
| 86 | devtools/inspector/PageStoreInspector.module.css | ⬜ | |
