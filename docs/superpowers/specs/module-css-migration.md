# module.css → ax() 마이그레이션 트래커

## 목적
- module.css에서 ax()로 대체 가능한 속성 이관
- last-mile 중 반복 패턴을 발견하여 새 축 후보로 누적

## 작업 루프 (파일당)
1. ax()로 대체 가능한 속성 → 이관
2. 남은 last-mile 중 반복 → 태깅
3. 태그 3회+ → 축 후보 검토

## 설계 위계 — ax() 14축의 소유권 공식

```
시각 8축: surface → tone → text → weight → state → textStyle → shape → controlSize
구조 6축: layout → flex → width → gap → padding → clamp
```

### 소유권 매트릭스

| 속성 | 소유 축 | 비고 |
|------|---------|------|
| background | surface(base) + tone(color) + state(focused/selected) | 3축 조립 |
| color(text) | text(위계) 또는 text(tone) | neutral 4단계 + semantic 4색 |
| font-weight | textStyle(번들) → weight(오버라이드) | weight가 textStyle을 이김 |
| font-size | textStyle(번들) 또는 controlSize(컨트롤) | 2 소스, 겹치지 않음 |
| border-radius | shape(비컨트롤) 또는 controlSize(컨트롤) | 2 소스, 겹치지 않음 |
| border | **last-mile** | surface가 소유하나 variant별 override 빈번 |
| outline | surface(:focus-visible) + state(focused) | state가 커스텀 focus ring 제공 |
| transition | **last-mile** | surface 자체 속성만 소유, 범용 motion 미소유 |
| positioning | **last-mile** | fixed/absolute/z-index = 항상 last-mile |
| animation | **last-mile** | keyframes = 항상 last-mile |

### Last-mile 정당성 판정

위 매트릭스에서 **last-mile**인 속성은 다음 중 하나:
1. **빈도 < 3** — 축으로 승격할 근거 부족
2. **값이 연속적** — 축은 이산 enum, 연속값(px, %, calc)은 축화 불가
3. **조합이 고유** — 컴포넌트 고유 레시피 (split border-radius, asymmetric padding 등)

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
| 5 | ui/CalendarGrid.module.css | ✅ | 전부 last-mile. grid table, fixed sizing(36px), state bg, border |
| 6 | ui/Checkbox.module.css | ✅ | 이미 빈 파일(코멘트만). 삭제 후보 |
| 7 | ui/CodeBlock.module.css | ✅ | 대형. shiki 통합, line numbers, code-token highlight, diff line colors. 전부 last-mile |
| 8 | ui/Combobox.module.css | ✅ | border-radius×2→shape:xl 이관. last-mile: ::placeholder, margin-top, overflow, state bg(focused/selected) |
| 9 | ui/Composer.module.css | ✅ | 대형. editor/overlay positioning, placeholder, suggestion popup. 전부 last-mile |
| 10 | ui/DatePicker.module.css | ✅ | 전부 last-mile. split border-radius, positioning, fixed sizing |
| 11 | ui/DisclosureGroup.module.css | ✅ | last-mile: justify-content override |
| 12 | ui/FileIcon.module.css | ✅ | 전부 last-mile. icon ext별 커스텀 색상, opacity |
| 13 | ui/FileViewerModal.module.css | ✅ | editBadge→text:warning+weight:semi 이관. last-mile: modal positioning/sizing, backdrop, image |
| 14 | ui/Form.module.css | ✅ | 빈 셀렉터만. 삭제 후보 |
| 15 | ui/Kanban.module.css | ✅ | 대형. surface-sunken, state bg, ext color bar, weight hints, dep colors, compact variant. 전부 last-mile |
| 16 | ui/ListBox.module.css | ✅ | 전부 last-mile. selected→weight-semi (패턴 +1) |
| 17 | ui/MarkdownViewer.module.css | ✅ | 대형. prose 타이포(h1~h4, p, ul, table, blockquote). 전부 last-mile — prose 렌더러 |
| 18 | ui/MenuList.module.css | ✅ | 빈 파일(코멘트만). 삭제 후보 |
| 19 | ui/Menubar.module.css | ✅ | 전부 last-mile. submenu positioning, bg-hover on focused/expanded |
| 20 | ui/NavList.module.css | ✅ | last-mile: weight-semi, letter-spacing, text-transform, 방향별 padding |
| 21 | ui/PatternDemo.module.css | ✅ | 전부 last-mile. surface-sunken, state bg, weight-semi, uppercase, slider track/thumb, nested indent |
| 22 | ui/QuickOpen.module.css | ✅ | itemFocused→state:focused, itemName→weight:medium, empty 제거. last-mile: positioning, animation, border, shadow, caret |
| 23 | ui/RadioGroup.module.css | ✅ | aria-checked color → 조건부 text:'primary'로 이관. import 제거. 삭제 후보 |
| 24 | ui/SelectionOverlay.module.css | ✅ | 전부 last-mile. CSS custom properties로 variant 분기, outline, transition |
| 25 | ui/Slider.module.css | ✅ | 전부 last-mile. track/thumb 커스텀 sizing, weight-medium, tabular-nums, focus ring |
| 26 | ui/Spinbutton.module.css | ✅ | 대형. weight-semi×2, weight-medium, border×3, focus ring, tabular-nums, transition, ::placeholder |
| 27 | ui/SplitPane.module.css | ✅ | 전부 last-mile. separator cursor/border, hit area(::before) |
| 28 | ui/StreamFeed.module.css | ✅ | 전부 last-mile. animation(fadeSlideIn, pulse, blink), FAB positioning, cursor |
| 29 | ui/SwitchGroup.module.css | ✅ | aria-checked color → 조건부 text:'primary'로 이관. import 제거. 삭제 후보 |
| 30 | ui/TabGroup.module.css | ✅ | 전부 last-mile. surface-sunken(새패턴), white-space, state --_bg/--_fg, font-style:italic, opacity reveal transition |
| 31 | ui/TextInput.module.css | ✅ | 전부 last-mile. input base styling, ::placeholder |
| 32 | ui/Toaster.module.css | ✅ | title→weight:medium 이관. last-mile: fixed positioning, animation, variant border-color |
| 33 | ui/Toggle.module.css | ✅ | font-size→textStyle:caption, color→text:muted 이관. last-mile: weight-semi, data-checked tone color |
| 34 | ui/ToggleGroup.module.css | ✅ | 빈 .item 제거. last-mile: indicator tone color |
| 35 | ui/Toolbar.module.css | ✅ | last-mile: state bg(focused/selected), outline focus ring, color:bright |
| 36 | ui/Tooltip.module.css | ✅ | 대형. popover positioning, border, border-radius, shadow, transition, pointer-events. 대부분 진짜 last-mile |
| 37 | ui/Treemap.module.css | ✅ | 전부 last-mile. ext color bar(::before), block hover/focus, label ellipsis |
| 38 | ui/Workspace.module.css | ✅ | root→layout:fill, inner styles 제거, empty→text:muted. last-mile: height:100% |

## ui/chat/ (6개)

| # | 파일 | 상태 | 메모 |
|---|------|------|------|
| 39 | ui/chat/ChatFeed.module.css | ✅ | 전부 last-mile. 채팅 버블 레이아웃, weight-medium, asymmetric border-radius |
| 40 | ui/chat/DiffBlock.module.css | ✅ | 전부 last-mile. diff grid, diff line bg colors |
| 41 | ui/chat/FallbackBlock.module.css | ✅ | 전부 last-mile. dashed border, details/summary reset |
| 42 | ui/chat/StreamingTextBlock.module.css | ✅ | 전부 last-mile. prose rhythm sync |
| 43 | ui/chat/TextBlock.module.css | ✅ | 전부 last-mile. chat-compact prose theme (heading 억제, 간격 축소) |
| 44 | ui/chat/ThinkingBlock.module.css | ✅ | thinkingLabel→weight:semi+text:muted 이관. last-mile: details/summary, settled opacity |
| 45 | ui/chat/ToolSummaryBlock.module.css | ✅ | toolName→weight:semi 이관. last-mile: icon row positioning, composes, tool group borders |

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
